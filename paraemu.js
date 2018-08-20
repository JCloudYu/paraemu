(()=>{
	"use strict";
	
	require( './lib/unique_timeout' );
	require( './lib/misc' );
	global.obtain = require;
	
	let WORKER_THREAD_ENABLED = false;
	let THREAD_MASTER_MODE	  = true;
	
	try {
		const WorkerThread = require( 'worker_threads' );
		WORKER_THREAD_ENABLED = true;
		THREAD_MASTER_MODE = WorkerThread.isMainThread;
	} catch (e) {}
	
	// Register core module base on the role of current process
	if ( require( 'cluster' ).isMaster && THREAD_MASTER_MODE ) {
		module.exports = require( './controllers/paraemu-task-controller' );
	}
	else {
		if ( !WORKER_THREAD_ENABLED ) {
			module.exports = require( './controllers/task-worker/no-threads' );
		}
		else
		if ( THREAD_MASTER_MODE ) {
			module.exports = require( './controllers/task-worker/master-thread' );
		}
		else {
			module.exports = require( './controllers/task-worker/worker-thread' )
		}
		
//		module.exports = require( './controllers/paraemu-task-worker' );
	}
	
	
	
	
	
	
	// Append IP2PSim interface
	Object.defineProperty(exports, 'IP2PSim', {
		value:require( './extensions/ip2psim/ip2psim' ),
		configurable:false, writable:false, enumerable:true
	});
	
	
})();
