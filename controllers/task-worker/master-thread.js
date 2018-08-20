(()=>{
	"use strict";

	const {Worker:Thread} = require( 'worker_threads' );
	const JOB_WORKER_CONN = require( './job-worker-connection' );
	const EXEC_CONF = JSON.parse(process.env.paraemu);
	const EXPORTED	= module.exports = JOB_WORKER_CONN(EXEC_CONF.group, EXEC_CONF.id);
	
	const ASYNC_JOB_MAP		= { [EXPORTED.id]:EXPORTED };
	const ASYNC_JOB_LIST	= [ EXPORTED ];
	const WORKER_JOB_LIST	= [];
	
	
	
	// region [ Add execution constants and other apis ]
	Object.setConstant(EXPORTED, { tag:EXEC_CONF.tag, args:EXEC_CONF.args });
	EXPORTED.job=(...args)=>{
		if ( args.length === 0 ) {
			const JOB_CONN = JOB_WORKER_CONN(EXPORTED.groupId, EXPORTED.taskId);
			ASYNC_JOB_MAP[ JOB_CONN.id ] = JOB_CONN;
			ASYNC_JOB_LIST.push(JOB_CONN);
			
			JOB_CONN.on( '--paraemu-e-event', __RECEIVING_EVENT);
			return JOB_CONN;
		}
		else {
			let [scriptPath, options={}] = args;
			options.workerData = {
				args: options.workerData,
				group: EXPORTED.groupId,
				task: EXPORTED.taskId
			};
			
			const worker = new Thread(scriptPath, options);
			WORKER_JOB_LIST.push(worker);
			
			worker
			.on( 'exit', __WORKER_EXITED)
			.on( 'message', (msg)=>{
				if ( Object(msg) === msg && msg.type === "paraemu-event" ) {
					__RECEIVING_EVENT(msg);
				}
			});
			return worker;
		}
	};
	// endregion
	
	// region [ APIs for developers ]
	Object.defineProperty(process, '__on', {
		value:process.on.bind(process),
		configurable:false, writable:false, enumerable:false
	});
	process.on=(event, ...args)=>{
		if ( event === 'message' ) {
			return EXPORTED.on( 'message', ...args );
		}
		
		return process.__on(event, ...args);
	};
	// endregion
	
	// region [ Handle core events ]
	EXPORTED.on( '--paraemu-e-event', __RECEIVING_EVENT);
	process.__on( 'message', (msg)=>{
		if ( Object(msg) !== msg || msg.type !== "paraemu-event" ) {
			EXPORTED.__emit( 'message', {type:'message'}, msg );
			return;
		}
		
		// Send to all emitters
		let {sender, target, event, eventData} = msg;
		eventData = Array.isArray(eventData) ?  eventData : [];
		let [,, t_job=null] = target ? target.split('-') : [null, null, null];
		
		if ( !t_job ) {
			for( let _job of ASYNC_JOB_LIST ) {
				_job.__emit(event, {type:event, sender, target}, ...eventData)
			}
		}
		else {
			let _job = ASYNC_JOB_MAP[t_job];
			if ( _job ) {
				_job.__emit(event, {type:event, sender, target}, ...eventData)
			}
		}
		
		
		// Send to all child workers
		for( let _worker of WORKER_JOB_LIST ) {
			_worker.postMessage(msg);
		}
	});
	// endregion
	
	// region [ Prepare ready flag and start monitoring ready flag and fire worker-ready event ]
	let IS_TASK_READY = true;
	const __CHECK_READY = (delay=false)=>{
		if ( !delay && IS_TASK_READY ) {
			process.send({ type:'worker-ready' });
			return;
		}
		
		setTimeout(__CHECK_READY, 0);
	};
	Object.defineProperty(EXPORTED, 'ready',  {
		set:(val)=>{IS_TASK_READY = !!val;}, get:()=>{return IS_TASK_READY;},
		configurable:false, enumerable:true
	});
	__CHECK_READY(true);
	// endregion
	
	
	
	
	
	
	function __RECEIVING_EVENT(eventInfo){
		process.send(eventInfo);
	}
	function __WORKER_EXITED(worker){
		let idx = WORKER_JOB_LIST.indexOf(worker);
		if ( idx >= 0 ) {
			WORKER_JOB_LIST.splice(idx,1);
		}
	}
})();
