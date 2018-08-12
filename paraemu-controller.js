(()=>{
	"use strict";
	
	
	let __SERIAL_COUNTER = Math.floor(Math.random() * 10000000) + 14776336;
	const cluster		 = require( 'cluster' );
	const path			 = require( 'path' );
	const fs			 = require( 'fs' );
	const {EventEmitter} = require( 'events' );
	
	
	
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
	
	
	__EVENT_POOL.load=(confPath, options)=>{
		if ( !__STATES.noJobs ) {
			throw new Error( "Existing tasks must be terminated to load new tasks!" );
		}
		
		
		
		const _options		 = options;
		const _descriptor	 = __STATES.descriptor		= path.resolve(confPath);
		const _descriptorDir = __STATES.descriptorDir	= path.dirname(_descriptor);
		const _config		 = __STATES.currentConf		= JSON.parse(fs.readFileSync(_descriptor, 'utf8'));
		const _workers		 = __STATES.workers			= {};
		
		
		const {processes} = _config;
		processes.forEach((processInfo)=>{
			__STATES.noJobs = __STATES.noJobs || true;
		
			const {root=null, tag=null, script} = processInfo;
			
			const scriptPath = path.resolve(_descriptorDir, root||'', script);
			const workingDir = path.resolve(_descriptorDir, root||'');
			
			// Prepare script info
			cluster.setupMaster({
				cwd:workingDir, exec:scriptPath
			});
			
			
			const workerId = __TOKENFY(++__SERIAL_COUNTER);
			const workerTag = tag || workerId;
			const worker = cluster.fork({
				paraemu: JSON.stringify({
					id: workerId,
					tag: workerTag,
					args: processInfo.args || []
				})
			});
			
			worker._id = workerId;
			worker._tag = workerTag;
			_workers[ workerId ] = { instantiated:false, available:false, terminated:false, worker };
		});
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
		let msgObj;
		if ( Object(msg) !== msg || msg.type !== "paraemu-event" ) {
			msgObj = {type:"paraemu-event", event:'message', args:[msg]};
		}
		else {
			msgObj = msg;
		}
		
		for ( let _id in __STATES.workers ) {
			if ( !__STATES.workers.hasOwnProperty(_id) ) continue;
			
			const workerInfo = __STATES.workers[_id];
			if ( workerInfo.available ) {
				workerInfo.worker.send(msgObj);
			}
		}
	});
	
	
	
	
	const DEFAULT_RANGES = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const SHUFFLED_RANGES = DEFAULT_RANGES.split('').sort(function(){return 0.5-Math.random()}).join('');
	function __TOKENFY(index=0, tokens=SHUFFLED_RANGES) {
		let length = tokens.length, token = tokens[index%length];
		index = Math.floor(index/length);
		while( index > 0 ) {
			token = tokens[index%length] + token;
			index = Math.floor(index/length);
		}
		return token;
	}
})();
