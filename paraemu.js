(()=>{
	'use strict';
	
	const cluster = require( 'cluster' );
	const {EventEmitter} = require( 'events' );
	
	// If current process is not a child process
	if ( cluster.isMaster ) {
		module.exports = require( './paraemu-controller' );
		return;
	}
	

	
	
	const exports = module.exports = new EventEmitter();
	const _ori_on = process.on.bind(process);
	const _ori_emit = exports.emit.bind(exports);
	
	
	// Overwrite default event emitter's behavior
	exports.emit = (event, ...args)=>{
		process.send({
			type:'paraemu-event',
			event, args
		})
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
			_ori_emit( 'message', msg );
			return;
		}
		
		let args = Array.isArray(msg.args) ?  msg.args : [];
		_ori_emit( msg.event, ...args );
	});
})();
