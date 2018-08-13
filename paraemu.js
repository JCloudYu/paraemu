(()=>{
	"use strict";
	
	// Register core module base on the role of current process
	if ( require( 'cluster' ).isMaster ) {
		module.exports = require( './paraemu-core-controller' );
	}
	else {
		module.exports = require( './paraemu-core-worker' );
	}
})();
