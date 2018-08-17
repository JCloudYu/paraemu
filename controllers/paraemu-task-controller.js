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
			_workers[ workerId ] = { instantiated:false, available:false, terminated:false, worker };
		});
		
		
		
		// region [ Check and start network connection ]
		let hostInfo = server || options.server;
		if ( hostInfo && Object(hostInfo) === hostInfo) {
			require( './paraemu-task-server-controller' )({
				hostInfo, event:__EVENT_POOL
			});
			return;
		}
		
		let remoteInfo = remote || options.remote;
		if ( remoteInfo && Object(remoteInfo) === remoteInfo ) {
			require( './paraemu-task-client-controller' )({
				remoteInfo, event:__EVENT_POOL
			});
		}
		// endregion
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
	__EVENT_POOL.sendEvent=(event, ...args)=>{
	
	};
	__EVENT_POOL.sendEventTo=(target, event, ...args)=>{
	
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
		if ( Object(msg) !== msg || msg.type !== "paraemu-event" ) {
			__ori_emit( '--paraemu-e-data', worker, msg );
			return;
		}
	
		
		msg.sender = [GROUP_ID, worker._id, msg.sender].join('-');
		msg.sender_tag = msg.sender_tag || worker._tag;
		msg.target = msg.target ? `${msg.target}` : null;
		
		__ori_emit( '--paraemu-e-event', msg);
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
	.on( '--paraemu-e-data', (worker, data)=>{
		let eventInfo = {
			type: 'worker_data',
			sender: worker._id,
			sender_tag: worker._tag
		};
		__ori_emit( eventInfo.type, eventInfo, data );
	})
	.on( '--paraemu-e-event', (msg)=>{
		// Parse msg target information
		let t_group, t_task, t_inst;
		if ( !msg.target ) {
			([t_group, t_task, ...t_inst] = [null, null, null]);
		}
		else {
			([t_group=null, t_task=null, ...t_inst] = msg.target.split('-'));
		}
		
		
		
		// Emit Local Events
		if ( !t_group || t_group === GROUP_ID ) {
			for ( let _id in __STATES.workers ) {
				if ( !__STATES.workers.hasOwnProperty(_id) ) continue;
				
				const workerInfo = __STATES.workers[_id];
				if ( workerInfo.available && (!t_task||t_task === _id) ) {
					workerInfo.worker.send(msg);
				}
			}
		}
		
		
		
		// Emit Network Events
		if ( !t_group || t_group !== GROUP_ID ) {
			__ori_emit( '--paraemu-e-network-event', t_group, msg );
		}
	});
	// endregion
	
	
	
	
	
	
	// region [ Miscellaneous functions ]
	function __GEN_RANDOM_ID(length=10) {
		return base32(crypto.randomBytes(length));
	}
	// endregion
})();
