(()=>{
	"use strict";
	
	// Register core module base on the role of current process
	if ( require( 'cluster' ).isMaster ) {
		module.exports = require( './paraemu-core-controller' );
	}
	else {
		module.exports = require( './paraemu-core-worker' );
	}
	
	
	
	
	
	
	// Append IP2PSim interface
	Object.defineProperty(exports, 'IP2PSim', {
		value:require( './extensions/ip2psim/ip2psim' ),
		configurable:false, writable:false, enumerable:true
	});
	
	
})();
