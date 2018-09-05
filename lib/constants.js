/**
 * Project: 0015.parallel-emulator
 * File: constants.js
 * Author: JCloudYu
 * Create Date: Sep. 05, 2018 
 */
(()=>{
	"use strict";
	
	global.paraemu = global.paraemu || {
		SYSTEM_HOOK: {
			PARAEMU_EVENT:	'--paraemu-e-event'
		},
		SYSTEM_EVENT: {
			CUSTOM_EVENT:	'paraemu-event',
			DELIVERY_EVENT: 'paraemu-delivery',
		},
		DEFAULT_EVENT: {
			NET_CONNECTION_READY: 'net-connection-ready',
			NET_CONNECTION_REMOVED: 'net-connection-removed',
			NET_CONNECTION_ERROR: 'net-connection-error',
			
			NET_GROUP_ATTACH: 'net-group-attach',
			NET_GROUP_DETACH: 'net-group-detach',
			
			TASKS_READY: 'tasks-ready',
			CARGO_DELIVERY: 'cargo-delivery'
		}
	};
})();
