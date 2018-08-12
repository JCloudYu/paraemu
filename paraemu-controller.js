(()=>{
	"use strict";
	
	
	let __SERIAL_COUNTER = 0;
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
	
	
	__EVENT_POOL.load=(confPath, options)=>{
		if ( !__STATES.noJobs ) {
			throw new Error( "Existing tasks must be terminated to load new tasks!" );
		}
		
		
		
		const _options		 = options;
		const _descriptor	 = __STATES.descriptor = path.resolve(confPath);
		const _descriptorDir = __STATES.descriptorDir = path.dirname(_descriptor);
		const _config		 = __STATES.currentConf = JSON.parse(fs.readFileSync(_descriptor, 'utf8'));
		const _workers		 = __STATES.workers = {};
		
		
		const {processes} = _config;
		processes.forEach((processInfo)=>{
			__STATES.noJobs = __STATES.noJobs || true;
		
			const {["working-dir"]:working_dir=_descriptorDir, script, tag=null} = processInfo;
			
			
			// Prepare script info
			cluster.setupMaster({
				cwd:working_dir, exec:script,
				args: processInfo.args || []
			});
			
			
			const workerId = __TOKENFY(++__SERIAL_COUNTER);
			const workerTag = processInfo[ 'tag' ] || workerId;
			const worker = cluster.fork({
				paraemu: {
					id: workerId,
					tag: workerTag
				}
			});
			
			worker._id = workerId;
			worker._tag = workerTag;
			_workers[ workerId ] = { available:false, terminated:false, worker };
		});
	};
	
	// Handle global events
	cluster
	.on( 'online', (worker)=>{
		const state = __STATES.workers[worker._id];
		state.available = true;
		
		
		__EVENT_POOL.emit( 'worker-started', worker._tag );
	})
	.on( 'exit', (worker, code, signal)=>{
		const state = __STATES.workers[worker._id];
		state.available = false;
		state.terminated = true;
		
		__EVENT_POOL.emit( 'worker-terminated', worker._tag, code, signal );
		
		
		// Leftover check...
		let finished = true;
		for ( let _id in __STATES.workers ) {
			if ( !__STATES.workers.hasOwnProperty(_id) ) continue;
			
			const workerInfo = __STATES.workers[_id];
			finished = finished && workerInfo.terminated;
		}
		
		if ( finished ) {
			__STATES.noJobs = true;
			__EVENT_POOL.emit( 'tasks-finished', worker._tag );
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
	function __TOKENFY(index=0, tokens=DEFAULT_RANGES) {
		let length = tokens.length, token = tokens[index%length];
		index = Math.floor(index/length);
		while( index > 0 ) {
			token = tokens[index%length] + token;
			index = Math.floor(index/length);
		}
		return token;
	}
})();
