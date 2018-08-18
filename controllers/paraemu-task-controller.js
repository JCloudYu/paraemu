(()=>{
	"use strict";
	
	
	const EXPORTED = module.exports = require( './task-controller/local-task-system' );
	
	// Prepare network connections after task workers are ready
	EXPORTED.on( '--paraemu-e-kernel-online', (config)=>{
		let controller = null, info;
		
		info = config.server;
		if ( info && (Object(info) === info) ) {
			controller = require( './task-controller/network/server-mode' );
		}
		else {
			info = config.remote;
			if ( info && Object(info) === info ) {
				controller = require( './task-controller/network/client-mode' );
			}
		}
		
		if ( controller ) {
			controller({ info, event:EXPORTED });
		}
	});
})();
