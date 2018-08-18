(()=>{
	"use strict";
	
	const {EventEmitter} = require( 'events' );

	
	const exports = module.exports = new EventEmitter();
	const _ori_on = process.on.bind(process);
	const _ori_emit = exports.emit.bind(exports);
	const GEN_RANDOM_ID = GenRandomID.bind(null, 16);
	const DEFAULT_JOB_ID = GEN_RANDOM_ID();
	
	let __TASK_READY = true;
	
	
	
	
	// Prepare environmental arguments
	const _env_conf = JSON.parse(process.env.paraemu);
	Object.defineProperties(exports, {
		args:{value:_env_conf.args, writable:false, configurable:false, enumerable:true},
		tag:{value:_env_conf.tag, writable:false, configurable:false, enumerable:true},
		groupId:{value:_env_conf.group, writable:false, configurable:false, enumerable:true},
		jobId:{value:DEFAULT_JOB_ID, configurable:false, writable:false, enumerable:true},
		id:{value:_env_conf.id, writable:false, configurable:false, enumerable:true},
		ready:{set:(val)=>{__TASK_READY = !!val;}, get:()=>{return __TASK_READY;}, configurable:false, enumerable:true}
	});
	
	// Overwrite default event emitter's behavior
	exports.send = (target, event, ...args)=>{
		process.send({
			type:'paraemu-event',
			sender:DEFAULT_JOB_ID,
			target:target,
			event,
			eventData:args
		});
	};
	exports.emit = (event, ...args)=>{
		exports.send( null, event, ...args );
	};
	exports.local = (event, ...args)=>{
		exports.send( exports.groupId, event, ...args );
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
		
		let {sender, target, event, eventData} = msg;
		eventData = Array.isArray(eventData) ?  eventData : [];
		_ori_emit(event, {type:event, sender, target}, ...eventData);
	});
	
	__CHECK_READY(true);
	
	
	
	
	function __CHECK_READY(delay=false) {
		if ( !delay && __TASK_READY ) {
			process.send({ type:'worker-ready' });
			return;
		}
		
		setTimeout(__CHECK_READY, 0);
	}
})();
