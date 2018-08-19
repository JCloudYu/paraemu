(()=>{
	"use strict";
	
	try {
		require( 'worker_threads' );
		module.exports = require( './task-worker/with-threads' );
	}
	catch (e) {
		module.exports = require( './task-worker/no-threads' );
	}
})();
