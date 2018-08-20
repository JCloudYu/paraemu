(()=>{
	"use strict";

	const {Worker:Thread} = require( 'worker_threads' );
	const JOB_WORKER_CONN = require( './job-worker-connection' );
	const EXEC_CONF = JSON.parse(process.env.paraemu);
	const EXPORTED	= module.exports = JOB_WORKER_CONN(EXEC_CONF.group, EXEC_CONF.id);
	const JOB_MAP	= { [EXPORTED.id]:EXPORTED };
	const JOB_LIST	= [ EXPORTED ];
	
	
	
	// region [ Add execution constants and other apis ]
	Object.setConstant(EXPORTED, {
		tag:EXEC_CONF.tag,
		args:EXEC_CONF.args
	});
	EXPORTED.job=(...args)=>{
		const JOB_CONN = JOB_WORKER_CONN(EXPORTED.groupId, EXPORTED.taskId);
		JOB_MAP[ JOB_CONN.id ] = JOB_CONN;
		JOB_LIST.push(JOB_CONN);
		
		JOB_CONN.on( '--paraemu-e-event', __RECEIVING_EVENT);
		
		if ( args.length > 0 ) {
			let [scriptPath, options={}] = args;
			options.workerData = {
				args: options.workerData,
				group: EXPORTED.groupId,
				task: EXPORTED.taskId
			};
			const worker = new Thread(scriptPath, options);
			JOB_CONN.worker = worker;
			worker.on( 'message', (msg)=>{
			
			});
		}
		return JOB_CONN;
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
		
		let {sender, target, event, eventData} = msg;
		eventData = Array.isArray(eventData) ?  eventData : [];
		let [,, t_job=null] = target ? target.split('-') : [null, null, null];
		
		if ( !t_job ) {
			for( let _job of JOB_LIST ) {
				_job.__emit(event, {type:event, sender, target}, ...eventData)
			}
		}
		else {
			let _job = JOB_MAP[t_job];
			if ( _job ) {
				_job.__emit(event, {type:event, sender, target}, ...eventData)
			}
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
})();
