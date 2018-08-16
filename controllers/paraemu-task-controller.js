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
	
	
	
	// region [ Prepare global controlling environment ]
	const GROUP_ID		 = __GEN_RANDOM_ID();
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
		
		
		const _core_paths	 = (options.search_paths || []).join( IS_WIN ? ';' : ':' );
		const _descriptor	 = __STATES.descriptor		= path.resolve(confPath);
		const _descriptorDir = __STATES.descriptorDir	= path.dirname(_descriptor);
		const _config		 = __STATES.currentConf		= JSON.parse(fs.readFileSync(_descriptor, 'utf8'));
		const _workers		 = __STATES.workers			= {};
		
		const {processes} = _config;
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
			_workers[ workerId ] = { instantiated:false, available:false, terminated:false, worker };
		});
		
		
		
		// Start network connection...
		const NETInfo = {
			groupId: GROUP_ID,
			event:__EVENT_POOL
		};
		
		if ( options.host && Object(options.host) === options.host) {
			NETInfo.serverInfo = options.host;
			require( './paraemu-task-server-controller' )(NETInfo);
		}
		else
		if ( options.remote && Object(options.remote) === options.remote ) {
			NETInfo.remoteInfo = options.remote;
			require( './paraemu-task-client-controller' )(NETInfo);
		}
	};
	__EVENT_POOL.emit=(event, ...args)=>{
		const eventInfo = {
			type:'paraemu-event',
			event:event, args
		};
	
		for ( let _id in __STATES.workers ) {
			if ( !__STATES.workers.hasOwnProperty(_id) ) continue;
			
			const workerInfo = __STATES.workers[_id];
			if ( workerInfo.available ) {
				workerInfo.worker.send(eventInfo);
			}
		}
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
		
		
		__ori_emit( '--paraemu-e-worker-started', worker );
		
		// Leftover check...
		let finished = true;
		for ( let _id in __STATES.workers ) {
			if ( !__STATES.workers.hasOwnProperty(_id) ) continue;
			
			const workerInfo = __STATES.workers[_id];
			finished = finished && workerInfo.instantiated;
		}
		
		if ( finished ) {
			__ori_emit( '--paraemu-e-tasks-ready' );
		}
	})
	.on( 'exit', (worker, code, signal)=>{
		const state = __STATES.workers[worker._id];
		state.available = false;
		state.terminated = true;
		
		
		__ori_emit( '--paraemu-e-worker-terminated', worker, code, signal );
		
		// Leftover check...
		let finished = true;
		for ( let _id in __STATES.workers ) {
			if ( !__STATES.workers.hasOwnProperty(_id) ) continue;
			
			const workerInfo = __STATES.workers[_id];
			finished = finished && workerInfo.terminated;
		}
		
		if ( finished ) {
			__STATES.noJobs = true;
			__ori_emit( '--paraemu-e-tasks-finished');
		}
	})
	.on( 'disconnected', (worker)=>{
		const state = __STATES.workers[worker._id];
		state.available = false;
	})
	.on( 'message', (worker, msg)=>{
		__ori_emit( '--paraemu-e-message', worker, msg);
	});
	// endregion

	// region [ Handle core events ]
	__EVENT_POOL
	.on( '--paraemu-e-worker-started', (worker)=>{
		let eventInfo = {
			type: 'worker-started',
			sender:worker._id,
			sender_tag:worker._tag
		};
		__ori_emit( eventInfo.type, eventInfo );
	})
	.on( '--paraemu-e-worker-terminated', (worker, code, signal)=>{
		let eventInfo = {
			type: 'worker-terminated',
			sender:worker._id,
			sender_tag:worker._tag
		};
		__ori_emit( eventInfo.type, eventInfo, {code, signal} );
	})
	.on( '--paraemu-e-tasks-ready', ()=>{
		let eventInfo = {
			type: 'tasks-ready'
		};
		let workerIds = [];
		for(let _id in __STATES.workers) {
			if ( __STATES.workers.hasOwnProperty(_id) ) {
				workerIds.push(_id);
			}
		}
		__ori_emit( eventInfo.type, eventInfo, workerIds );
	})
	.on( '--paraemu-e-tasks-finished', ()=>{
		let eventInfo = {
			type: 'tasks-finished'
		};
		__ori_emit( eventInfo.type, eventInfo );
	})
	.on( '--paraemu-e-message', (worker, msg)=>{
		let msgObj = msg;
		if ( Object(msg) !== msg || msg.type !== "paraemu-event" ) {
			msgObj = {type:"paraemu-event", event:'message', args:[msg]};
		}
		
		msg.sender = `${GROUP_ID}-${worker._id}`;
		msg.sender_tag = worker._tag;
		
		let target = null;
		if ( typeof msg.target === "string" ) {
			let [, taskId] = msg.target.split('-');
			target = ( taskId.length > 0 ) ? taskId : null;
		}
		
		for ( let _id in __STATES.workers ) {
			if ( !__STATES.workers.hasOwnProperty(_id) ) continue;
			
			const workerInfo = __STATES.workers[_id];
			if ( workerInfo.available && (target === null || target === _id) ) {
				workerInfo.worker.send(msgObj);
			}
		}
	});
	// endregion
	
	
	
	
	
	
	// region [ Miscellaneous functions ]
	function __GEN_RANDOM_ID(length=10) {
		return base32(crypto.randomBytes(length));
	}
	// endregion
})();
