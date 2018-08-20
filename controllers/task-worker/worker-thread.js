(()=>{
	"use strict";

	const {workerData:WORKER_DATA, parentPort} = require( 'worker_threads' );
	const JOB_WORKER_CONN = require( './job-worker-connection' );
	const EXPORTED	= module.exports = JOB_WORKER_CONN(WORKER_DATA.group, WORKER_DATA.task);
	const JOB_MAP	= { [EXPORTED.id]:EXPORTED };
	const JOB_LIST	= [ EXPORTED ];
	
	// region [ Add execution constants and other apis ]
	Object.setConstant(EXPORTED, {
		args:WORKER_DATA.args
	});
	EXPORTED.job=()=>{
		const JOB_CONN = JOB_WORKER_CONN(EXPORTED.groupId, EXPORTED.taskId);
		JOB_MAP[ JOB_CONN.id ] = JOB_CONN;
		JOB_LIST.push(JOB_CONN);
		
		JOB_CONN.on( '--paraemu-e-event', __RECEIVE_EVENT);
		return JOB_CONN;
	};
	// endregion
	
	// region [ APIs for developers ]
	Object.defineProperty(parentPort, '__on', {
		value:parentPort.on.bind(parentPort),
		configurable:false, writable:false, enumerable:false
	});
	parentPort.on=(event, ...args)=>{
		if ( event === 'message' ) {
			return EXPORTED.on( 'message', ...args );
		}
		
		return parentPort.__on(event, ...args);
	};
	// endregion
	
	// region [ Handle core events ]
	EXPORTED.on( '--paraemu-e-event', __RECEIVE_EVENT);
	parentPort.__on( 'message', (msg)=>{
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
	
	
	
	
	
	
	function __RECEIVE_EVENT(eventInfo){
		parentPort.postMessage(eventInfo);
	}
})();
