/**
 * Project: 0015.parallel-emulator
 * File: paraemu-core-worker
 * Author: JCloudYu
 * Create Date: Aug. 13, 2018
 */
(()=>{
	"use strict";
	
	const crypto		 = require( 'crypto' );
	const IS_WIN		 = (require( 'os' ).platform() === "win32");
	const cluster		 = require( 'cluster' );
	const path			 = require( 'path' );
	const fs			 = require( 'fs' );
	const {EventEmitter} = require( 'events' );
	
	const base32		 = obtain( './lib/base32' );
	const INTERNAL_EVT_CHECK = /^--paraemu-e-.*$/;
	
	const READY_TIMEOUT = setTimeout.unique();
	const EXIT_TIMEOUT	= setTimeout.unique();
	
	
	
	// region [ Prepare global controlling environment ]
	const GROUP_ID = __GEN_RANDOM_ID();
	const __EVENT_POOL = module.exports = new EventEmitter();
	Object.defineProperties(__EVENT_POOL, {
		groupId: {value:GROUP_ID, configurable:false, writable:false, enumerable:true}
	});
	
	const __STATES = {
		noJobs: true,
		currentConf: null,
		descriptor: null,
		descriptorDir: null,
		workers: null
	};
	const __ori_emit = __EVENT_POOL.emit.bind(__EVENT_POOL);
	const __ori_off_all = __EVENT_POOL.removeAllListeners.bind(__EVENT_POOL);
	// endregion
	
	// region [ Add and override APIs for developers ]
	__EVENT_POOL.load=(confPath, options={})=>{
		if ( !__STATES.noJobs ) {
			throw new Error( "Existing tasks must be terminated to load new tasks!" );
		}
		
		
		const _core_paths	 = (options.module_paths || []).join( IS_WIN ? ';' : ':' );
		const _descriptor	 = __STATES.descriptor		= path.resolve(confPath);
		const _descriptorDir = __STATES.descriptorDir	= path.dirname(_descriptor);
		const _config		 = __STATES.currentConf		= JSON.parse(fs.readFileSync(_descriptor, 'utf8'));
		const _workers		 = __STATES.workers			= {};
		
		const {server=null, remote=null, processes=[]} = _config;
		const workerInfo  = [];
		const workerIds	  = [];
		processes.forEach((processInfo)=>{
			__STATES.noJobs = __STATES.noJobs && false;
		
			const {root=null, tag=null, script, args:workerArgs=[], env:workerArgvs=[]} = processInfo;
			const scriptPath = path.resolve(_descriptorDir, root||'', script);
			const workingDir = path.resolve(_descriptorDir, root||'');
			const workerId	 = __GEN_RANDOM_ID();
			const workerTag	 = tag || workerId;
			
			workerIds.push(workerId);
			workerInfo.push({
				scriptPath, workingDir, workerId, workerTag, workerArgs, workerArgvs
			});
		});
		workerInfo.forEach((info)=>{
			const {scriptPath, workingDir, workerId, workerTag, workerArgs, workerArgvs} = info;
		
			// Prepare script info
			cluster.setupMaster({
				cwd:workingDir,
				exec:scriptPath,
				execArgv:workerArgvs
			});
			
			const worker = cluster.fork({
				paraemu: JSON.stringify({
					group:GROUP_ID, id:workerId, tag:workerTag, args:workerArgs, worker_list:workerIds
				}),
				NODE_PATH:_core_paths
			});
			
			worker._id = workerId;
			worker._tag = workerTag;
			_workers[ workerId ] = {
				ready_notified:false,
				instantiated:false,
				available:false,
				terminated:false,
				worker
			};
		});
		
		
		
		// region [ Check and start network connection ]
		let hostInfo = server || options.server;
		if ( hostInfo && Object(hostInfo) === hostInfo) {
			require( './paraemu-task-server-controller' )({
				hostInfo, event:__EVENT_POOL, internalTrigger:__ori_emit
			});
			return;
		}
		
		let remoteInfo = remote || options.remote;
		if ( remoteInfo && Object(remoteInfo) === remoteInfo ) {
			require( './paraemu-task-client-controller' )({
				remoteInfo, event:__EVENT_POOL, internalTrigger:__ori_emit
			});
		}
		// endregion
	};
	__EVENT_POOL.send=(target, event, ...args)=>{
		const eventInfo = {
			type:'paraemu-event',
			target:target,
			sender:GROUP_ID,
			event:event,
			eventData:args
		};
	
		__ori_emit( '--paraemu-e-event', eventInfo )
	};
	__EVENT_POOL.emit=(event, ...args)=>{
		__EVENT_POOL.send( null, event, ...args );
	};
	__EVENT_POOL.local=(event, ...args)=>{
		__EVENT_POOL.send( GROUP_ID, event, ...args );
	};
	__EVENT_POOL.removeAllListeners=(eventName)=>{
		if ( INTERNAL_EVT_CHECK.test(eventName) ) { return; }
		return __ori_off_all(eventName);
	};
	// endregion

	// region [ Handle events from workers ]
	cluster
	.on( 'online', (worker)=>{
		const state = __STATES.workers[worker._id];
		state.instantiated = true;
		state.available = true;
		
		
		__ori_emit( '--paraemu-e-state', {
			type:'worker-started', id:worker._id, tag:worker._tag
		});
	})
	.on( 'exit', (worker, code, signal)=>{
		const state = __STATES.workers[worker._id];
		state.available = false;
		state.terminated = true;
		
		
		__ori_emit( '--paraemu-e-state', {
			type: 'worker-terminated', id:worker._id, tag:worker._tag, code, signal
		});
		
		if ( !state.ready_notified ) {
			state.ready_notified = true;
			READY_TIMEOUT(__CHECK_READY_STATE, 0);
		}
		
		EXIT_TIMEOUT(__CHECK_TERMINATE_STATE, 0);
	})
	.on( 'disconnected', (worker)=>{
		const state = __STATES.workers[worker._id];
		state.available = false;
	})
	.on( 'message', (worker, msg)=>{
		if ( Object(msg) !== msg ) {
			__ori_emit( '--paraemu-e-data', worker, msg ); return;
		}
		
		switch( msg.type ) {
			case "paraemu-event":
				Object.assign(msg, {
					sender: [GROUP_ID, worker._id, msg.sender].join('-'),
					target: msg.target ? `${msg.target}` : null
				});
				__ori_emit( '--paraemu-e-event', msg);
				break;
			
			case "worker-ready":
				__STATES.workers[worker._id].ready_notified = true;
				READY_TIMEOUT(__CHECK_READY_STATE, 0);
				break;
				
			default:
				__ori_emit( '--paraemu-e-data', worker, msg );
				break;
		}
	});
	// endregion

	// region [ Handle core events ]
	__EVENT_POOL
	.on( '--paraemu-e-state', (stateInfo)=>{
		__ori_emit( 'kernel-state', stateInfo );
	})
	.on( '--paraemu-e-data', (worker, data)=>{
		__ori_emit( 'worker-data', { id:worker._id, tag:worker._tag, data });
	})
	.on( '--paraemu-e-event', (eventInfo, source=null)=>{
		// Parse event target information
		let t_group, t_task, t_inst;
		if ( !eventInfo.target ) {
			([t_group, t_task, ...t_inst] = [null, null, null]);
		}
		else {
			([t_group=null, t_task=null, ...t_inst] = eventInfo.target.split('-'));
		}
		
		
		// Emit Local Events
		if ( !t_group || t_group === GROUP_ID ) {
			for ( let _id in __STATES.workers ) {
				if ( !__STATES.workers.hasOwnProperty(_id) ) continue;
				
				const workerInfo = __STATES.workers[_id];
				if ( workerInfo.available && (!t_task||t_task === _id) ) {
					workerInfo.worker.send(eventInfo);
				}
			}
		}
		
		
		
		// Emit Network Events
		if ( !t_group || t_group !== GROUP_ID ) {
			__ori_emit( '--paraemu-e-network-event', t_group, eventInfo, source );
		}
	});
	// endregion
	
	
	
	
	
	
	// region [ Miscellaneous functions ]
	function __CHECK_READY_STATE() {
		const workers = __STATES.workers;
		let ready = true;
		for( let _id in workers ) {
			if (!workers.hasOwnProperty(_id)) continue;
			ready = ready && (workers[_id].ready_notified || workers[_id].terminated);
		}
		
		if ( ready ) {
			__ori_emit( 'tasks-ready' );
			__EVENT_POOL.local( 'tasks-ready' );
		}
	}
	function __CHECK_TERMINATE_STATE() {
		const workers = __STATES.workers;
		let exit = true;
		for( let _id in workers ) {
			if (!workers.hasOwnProperty(_id)) continue;
			exit = exit && workers[_id].terminated;
		}
		
		if ( exit ) {
			__ori_emit( 'tasks-finished' );
		}
	}
	function __GEN_RANDOM_ID(length=10) {
		return base32(crypto.randomBytes(length));
	}
	// endregion
})();
