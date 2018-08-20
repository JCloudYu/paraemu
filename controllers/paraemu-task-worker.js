(()=>{
	"use strict";
	
	try {
		const WorkerThread = require( 'worker_threads' );
		if ( WorkerThread.isMainThread ) {
			module.exports = require( './task-worker/master-thread' );
		}
		else {
			module.exports = require( './task-worker/worker-thread' )
		}
	}
	catch (e) {
		module.exports = require( './task-worker/no-threads' );
	}
})();
