(()=>{
	"use strict";
	
	const cluster = require( 'cluster' );
	const {EventEmitter} = require( 'events' );
	const EXPORTED = module.exports = new EventEmitter();
	
	
	const IS_WIN = (require( 'os' ).platform() === "win32");
	const ONLINE_TIMEOUT = setTimeout.no_repeat();
	const READY_TIMEOUT = setTimeout.no_repeat();
	const EXIT_TIMEOUT	= setTimeout.no_repeat();
	
	// Runtime state control
	const WORKER_STATE_MAP	= {};
	const WORKER_STATE_LIST = [];
	
	
	
	
	
	
	// region [ Register task manager apis ]
	Object.assign(EXPORTED, {
		killAll:()=>{
		
		},
		instantiate:(taskInfo)=>{
			const {groupId, taskId, tag, cwd, script, module_paths, args, argv} = taskInfo;
			
			cluster.setupMaster({ cwd, exec:script, execArgv:argv });
			const worker = cluster.fork({
				paraemu: JSON.stringify({groupId, taskId, tag, args}),
				NODE_PATH:module_paths.join(IS_WIN ? ';' : ':')
			});
			
			
			
			worker._groupId = groupId;
			worker._taskId = taskId;
			worker._tag = tag;
			
			
			
			WORKER_STATE_LIST.push(WORKER_STATE_MAP[taskId]={
				worker,
				ready_notified:false,
				instantiated:false,
				available:false,
				terminated:false
			});
		},
		sendMessage:(targetId, eventInfo)=>{
			for( const {available, worker} of WORKER_STATE_LIST ) {
				if ( available && ( !targetId||targetId===worker._taskId )) {
					worker.send(eventInfo);
				}
			}
		}
	});
	// endregion
	
	// region [ Handle events from workers ]
	cluster
	.on( 'online', (worker)=> {
		const state = WORKER_STATE_MAP[worker._taskId];
		state.instantiated = true;
		state.available = true;
		
		
		
		EXPORTED.emit( 'core-state',  {
			type:'worker-started', id:worker._taskId, tag:worker._tag
		});
		
		ONLINE_TIMEOUT(__CHECK_TASK_ONLINE_STATUS, 0);
	})
	.on( 'exit', (worker, code, signal)=>{
		const state = WORKER_STATE_MAP[worker._taskId];
		state.available = false;
		state.terminated = true;
		
		
		
		EXPORTED.emit( 'core-state',  {
			type: 'worker-terminated', id:worker._taskId, tag:worker._tag, code, signal
		});
		
		if ( !state.ready_notified ) {
			state.ready_notified = true;
			READY_TIMEOUT(__CHECK_READY_STATE, 0);
		}
		
		EXIT_TIMEOUT(__CHECK_TERMINATE_STATE, 0);
	})
	.on( 'disconnected', (worker)=>{
		const state = WORKER_STATE_MAP[worker._taskId];
		state.available = false;
	})
	.on( 'message', (worker, msg)=>{
		if ( Object(msg) !== msg ) {
			EXPORTED.emit( 'core-data', worker, msg );
			return;
		}
		
		switch( msg.type ) {
			case paraemu.SYSTEM_EVENT.CUSTOM_EVENT:
			case paraemu.SYSTEM_EVENT.DELIVERY_EVENT:
				Object.assign(msg, {
					sender: [worker._taskId, msg.sender].join('-'),
					target: msg.target ? `${msg.target}` : null
				});
				EXPORTED.emit( 'core-event', msg );
				break;
			
			case "worker-ready":
				WORKER_STATE_MAP[worker._taskId].ready_notified = true;
				READY_TIMEOUT(__CHECK_READY_STATE, 0);
				break;
				
			default:
				EXPORTED.emit( 'core-data', worker, msg );
				break;
		}
	});
	// endregion
	
	
	
	
	
	
	
	
	
	function __CHECK_TASK_ONLINE_STATUS() {
		let all_online = true;
		for( let {instantiated} of WORKER_STATE_LIST ) {
			all_online = all_online && instantiated;
		}
		
		if ( all_online ) {
			EXPORTED.emit( 'tasks-online' );
		}
	}
	function __CHECK_READY_STATE() {
		let ready = true;
		for( let {ready_notified, terminated} of WORKER_STATE_LIST ) {
			ready = ready && (ready_notified || terminated);
		}
		
		if ( ready ) {
			EXPORTED.emit( 'tasks-ready' );
		}
	}
	function __CHECK_TERMINATE_STATE() {
		let exit = true;
		for( let {terminated} of WORKER_STATE_LIST ) {
			exit = exit && terminated;
		}
		
		if ( exit ) {
			EXPORTED.emit( 'tasks-finished' );
		}
	}
})();
