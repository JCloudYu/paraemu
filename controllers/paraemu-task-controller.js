(()=>{
	"use strict";
	
	const {Helper:{UniqueTimeout}} = require( 'pemu-lib' );
	const NET_TIMEOUT = UniqueTimeout();
	const EXPORTED = module.exports = require( './task-controller/local-task-system' );
	
	// Prepare network connections after task workers are ready
	EXPORTED.on( '--paraemu-e-kernel-online', (config)=>{
		NET_TIMEOUT(__START_NETWORK_COMMUNICATION.bind(null, config), 5000);
	});
	
	EXPORTED.on( '--paraemu-e-kernel-ready', (config)=>{
		NET_TIMEOUT(__START_NETWORK_COMMUNICATION.bind(null, config), 0);
	});
	
	function __START_NETWORK_COMMUNICATION(config){
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
	}
})();
