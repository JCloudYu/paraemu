(()=>{
	"use strict";

	const {Helper:{SetConstant}} = include( 'lib' );
	const {workerData:WORKER_DATA, parentPort} = require( 'worker_threads' );
	const JOB_WORKER_CONN = require( './job-worker-connection' );
	const EXPORTED	= module.exports = JOB_WORKER_CONN(
		WORKER_DATA.groupId, WORKER_DATA.taskId, WORKER_DATA.jobId
	);
	const JOB_MAP	= { [EXPORTED.jobId]:EXPORTED };
	const JOB_LIST	= [ EXPORTED ];
	
	// region [ Add execution constants and other apis ]
	SetConstant(EXPORTED, {
		args:WORKER_DATA.args
	});
	EXPORTED.job=()=>{
		const JOB_CONN = JOB_WORKER_CONN(EXPORTED.groupId, EXPORTED.taskId);
		JOB_MAP[ JOB_CONN.jobId ] = JOB_CONN;
		JOB_LIST.push(JOB_CONN);
		
		JOB_CONN.on( paraemu.SYSTEM_HOOK.PARAEMU_EVENT, __RECEIVE_EVENT);
		return JOB_CONN;
	};
	// endregion
	
	// region [ APIs for developers ]
	Object.defineProperty(parentPort, '__on', {
		value:parentPort.on.bind(parentPort),
		configurable:false, writable:false, enumerable:false
	});
	parentPort.on=(event, ...args)=>{
		if ( event === 'message' ) return;
		return parentPort.__on(event, ...args);
	};
	// endregion
	
	// region [ Handle core events ]
	EXPORTED.on( paraemu.SYSTEM_HOOK.PARAEMU_EVENT, __RECEIVE_EVENT);
	parentPort.__on( 'message', (msg)=>{
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
	
	
	
	
	
	
	function __RECEIVE_EVENT(eventInfo){
		parentPort.postMessage(eventInfo);
	}
})();
