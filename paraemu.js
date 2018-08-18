(()=>{
	"use strict";
	
	require( './lib/unique_timeout' );
	global.obtain = require;
	
	// Register core module base on the role of current process
	if ( require( 'cluster' ).isMaster ) {
		module.exports = require( './controllers/paraemu-task-controller' );
	}
	else {
		module.exports = require( './controllers/paraemu-task-worker' );
	}
	
	
	
	
	
	
	// Append IP2PSim interface
	Object.defineProperty(exports, 'IP2PSim', {
		value:require( './extensions/ip2psim/ip2psim' ),
		configurable:false, writable:false, enumerable:true
	});
	
	
})();
