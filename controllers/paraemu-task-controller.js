(()=>{
	"use strict";
	
	
	
	const crypto		 = require( 'crypto' );
	const IS_WIN		 = (require( 'os' ).platform() === "win32");
	const cluster		 = require( 'cluster' );
	const path			 = require( 'path' );
	const fs			 = require( 'fs' );
	const {EventEmitter} = require( 'events' );
	
	const base32		 = obtain( './lib/base32' );
	const GROUP_ID		 = __GEN_RANDOM_ID();
	
	
	
	// Overall controller
	const __EVENT_POOL = module.exports = new EventEmitter();
	const __STATES = {
		noJobs: true,
		currentConf: null,
		descriptor: null,
		descriptorDir: null,
		workers: null
	};
	const __ori_emit = __EVENT_POOL.emit.bind(__EVENT_POOL);
	
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
			options,
			groupId: GROUP_ID,
			evt_pool:__EVENT_POOL,
			core_notify:__ori_emit
		};
		
		if ( options.host && Object(options.host) === options.host) {
			require( './paraemu-task-server-controller' )(NETInfo);
		}
		else
		if ( options.remote && Object(options.remote) === options.remote ) {
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
	
	Object.defineProperties(__EVENT_POOL, {
		groupId: {value:GROUP_ID, configurable:false, writable:false, enumerable:true}
	});
	
	
	
	
	
	
	// Handle global events
	cluster
	.on( 'online', (worker)=>{
		const state = __STATES.workers[worker._id];
		state.instantiated = true;
		state.available = true;
		
		__ori_emit( 'worker-started', {type:'worker-started'}, worker._tag );
		
		// Leftover check...
		let finished = true;
		for ( let _id in __STATES.workers ) {
			if ( !__STATES.workers.hasOwnProperty(_id) ) continue;
			
			const workerInfo = __STATES.workers[_id];
			finished = finished && workerInfo.instantiated;
		}
		
		if ( finished ) {
			__ori_emit( 'tasks-ready', {type:'tasks-ready'} );
		}
	})
	.on( 'exit', (worker, code, signal)=>{
		const state = __STATES.workers[worker._id];
		state.available = false;
		state.terminated = true;
		
		__ori_emit( 'worker-terminated', {type:'worker-terminated'}, worker._tag, code, signal );
		
		// Leftover check...
		let finished = true;
		for ( let _id in __STATES.workers ) {
			if ( !__STATES.workers.hasOwnProperty(_id) ) continue;
			
			const workerInfo = __STATES.workers[_id];
			finished = finished && workerInfo.terminated;
		}
		
		if ( finished ) {
			__STATES.noJobs = true;
			__ori_emit( 'tasks-finished', {type:'tasks-finished'} );
		}
	})
	.on( 'disconnected', (worker)=>{
		const state = __STATES.workers[worker._id];
		state.available = false;
	})
	.on( 'message', (worker, msg)=>{
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
	
	
	
	
	
	// Miscellaneous functions
	function __GEN_RANDOM_ID(length=10) {
		return base32(crypto.randomBytes(length));
	}
})();
