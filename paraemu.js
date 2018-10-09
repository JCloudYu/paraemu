(()=>{
	"use strict";
	
	require( 'pemu-lib' );
	
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
	}
})();
