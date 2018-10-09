(()=>{
	"use strict";

	const {Helper:{SetConstant}} = require( 'pemu-lib' );
	const JOB_WORKER_CONN = require( './job-worker-connection' );
	const EXEC_CONF = JSON.parse(process.env.paraemu);
	const EXPORTED	= module.exports = JOB_WORKER_CONN(EXEC_CONF.groupId, EXEC_CONF.taskId);
	const JOB_MAP	= { [EXPORTED.jobId]:EXPORTED };
	const JOB_LIST	= [ EXPORTED ];
	
	
	
	// region [ Add execution constants and other apis ]
	SetConstant(EXPORTED, {
		tag:EXEC_CONF.tag,
		args:EXEC_CONF.args
	});
	EXPORTED.job=()=>{
		const JOB_CONN = JOB_WORKER_CONN(EXPORTED.groupId, EXPORTED.taskId);
		JOB_MAP[ JOB_CONN.jobId ] = JOB_CONN;
		JOB_LIST.push(JOB_CONN);
		
		JOB_CONN.on( paraemu.SYSTEM_HOOK.PARAEMU_EVENT, __RECEIVING_EVENT);
		return JOB_CONN;
	};
	// endregion
	
	// region [ APIs for developers ]
	Object.defineProperty(process, '__on', {
		value:process.on.bind(process),
		configurable:false, writable:false, enumerable:false
	});
	process.on=(event, ...args)=>{
		if ( event === 'message' ) return;
		return process.__on(event, ...args);
	};
	// endregion
	
	// region [ Handle core events ]
	EXPORTED.on( paraemu.SYSTEM_HOOK.PARAEMU_EVENT, __RECEIVING_EVENT);
	process.__on( 'message', (msg)=>{
		if ( Object(msg) !== msg ) { return; }
		
		let [,, t_job=null] = msg.target ? msg.target.split('-') : [null, null, null];
		if ( !t_job ) {
			for( let _job of JOB_LIST ) {
				_job.__dispatch(msg);
			}
		}
		else {
			let _job = JOB_MAP[t_job];
			if ( _job ) {
				_job.__dispatch(msg, false);
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
