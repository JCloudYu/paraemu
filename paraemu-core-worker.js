/**
 * Project: 0015.parallel-emulator
 * File: paraemu-core-worker
 * Author: JCloudYu
 * Create Date: Aug. 13, 2018 
 */
(()=>{
	"use strict";
	
	const {EventEmitter} = require( 'events' );


	
	const exports = module.exports = new EventEmitter();
	const _ori_on = process.on.bind(process);
	const _ori_emit = exports.emit.bind(exports);
	
	
	
	// Prepare environmental arguments
	const _env_conf = JSON.parse(process.env.paraemu);
	Object.defineProperties(exports, {
		args:{value:_env_conf.args, writable:false, configurable:false, enumerable:true},
		tag:{value:_env_conf.tag, writable:false, configurable:false, enumerable:true},
		id:{value:_env_conf.id, writable:false, configurable:false, enumerable:true},
		collaborators:{value:_env_conf.worker_list.slice(0), writable:false, configurable:false, enumerable:true}
	});
	
	// Overwrite default event emitter's behavior
	exports.emit = (event, ...args)=>{
		process.send({ type:'paraemu-event', event, args });
	};
	
	// Prevent users from listening to message directly
	process.on=(event, ...args)=>{
		if ( event === 'message' ) {
			return exports.on( 'message', ...args );
		}
		
		return _ori_on(event, ...args);
	};
	
	// Bind and handle process' event internally
	_ori_on( 'message', (msg)=>{
		if ( Object(msg) !== msg || msg.type !== "paraemu-event" ) {
			_ori_emit( 'message', {type:'message'}, msg );
			return;
		}
		
		let args = Array.isArray(msg.args) ?  msg.args : [];
		_ori_emit(msg.event, {type:msg.event, sender_tag:msg.sender_tag, sender:msg.sender}, ...args);
	});
})();
