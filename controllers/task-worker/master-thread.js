(()=>{
	"use strict";

	const beson = require( 'beson' );
	const {Worker:Thread} = require( 'worker_threads' );
	const JOB_WORKER_CONN = require( './job-worker-connection' );
	const {Helper:{GenRandomID, SetConstant}} = include( 'lib' );
	
	const EXEC_CONF = JSON.parse(process.env.paraemu);
	const EXPORTED	= module.exports = JOB_WORKER_CONN(EXEC_CONF.groupId, EXEC_CONF.taskId);
	
	const GEN_RANDOM_ID = GenRandomID.bind(null, 16);
	const ASYNC_JOB_MAP		= { [EXPORTED.jobId]:EXPORTED };
	const ASYNC_JOB_LIST	= [ EXPORTED ];
	const WORKER_JOB_LIST	= [];
	
	
	
	// region [ Add execution constants and other apis ]
	SetConstant(EXPORTED, { tag:EXEC_CONF.tag, args:EXEC_CONF.args });
	EXPORTED.job=(...input_args)=>{
		if ( input_args.length === 0 ) {
			const JOB_CONN = JOB_WORKER_CONN(EXPORTED.groupId, EXPORTED.taskId);
			JOB_CONN.__in = EXPORTED.__in;
			ASYNC_JOB_MAP[ JOB_CONN.jobId ] = JOB_CONN;
			ASYNC_JOB_LIST.push(JOB_CONN);
			
			JOB_CONN.on( paraemu.SYSTEM_HOOK.PARAEMU_EVENT, __RECEIVING_EVENT);
			return JOB_CONN;
		}
		else {
			let [scriptPath, options={}, ...args] = input_args;
			let jobId = GEN_RANDOM_ID();
			if ( options.hasOwnProperty('workerData') ) {
				args = options.workerData;
			}
			
			options.workerData = {
				args, jobId,
				groupId: EXPORTED.groupId,
				taskId: EXPORTED.taskId
			};
			
			const worker = new Thread(scriptPath, options);
			WORKER_JOB_LIST.push(worker);
			
			SetConstant(worker, {
				groupId:EXPORTED.groupId,
				taskId:EXPORTED.taskId,
				jobId,
				uniqueId: `${EXPORTED.groupId}-${EXPORTED.taskId}-${jobId}`
			});
			
			worker
			.on( 'exit', __WORKER_EXITED)
			.on( 'message', (msg)=>{
				msg = beson.Deserialize(msg);
			
				if ( !(Object(msg) === msg) ) {
					return;
				}
			
				switch(msg.type) {
					case paraemu.SYSTEM_EVENT.CUSTOM_EVENT:
					case paraemu.SYSTEM_EVENT.DELIVERY_EVENT:
						__RECEIVING_EVENT(msg);
						break;
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
		if ( event === 'message' ) return;
		
		return process.__on(event, ...args);
	};
	// endregion
	
	// region [ Handle core events ]
	EXPORTED.on( paraemu.SYSTEM_HOOK.PARAEMU_EVENT, __RECEIVING_EVENT);
	process.__on( 'message', (msg)=>{
		const eventData = msg.eventData;
		if( eventData && typeof eventData === 'string' ) msg.eventData = beson.Deserialize( Buffer.from( eventData, 'base64' ) );

		if ( Object(msg) !== msg ) { return; }

		// Send to all emitters
		let [,,t_job=null] = msg.target ? msg.target.split('-') : [null, null, null];
		
		if ( !t_job ) {
			for( let _job of ASYNC_JOB_LIST ) {
				_job.__dispatch(msg);
			}
		}
		else {
			let _job = ASYNC_JOB_MAP[t_job];
			if ( _job ) {
				_job.__dispatch(msg, false);
			}
		}
		
		
		// Send to all child workers
		for( let _worker of WORKER_JOB_LIST ) {
			try { _worker.postMessage(beson.Serialize(msg)); } catch(e) {}
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
		const eventData = eventInfo.eventData;
		if( eventData && eventData.length > 0 ) eventInfo.eventData = Buffer.from( beson.Serialize(eventData) ).toString('base64');

		process.send(eventInfo);
	}
	function __WORKER_EXITED(worker){
		let idx = WORKER_JOB_LIST.indexOf(worker);
		if ( idx >= 0 ) {
			WORKER_JOB_LIST.splice(idx,1);
		}
	}
})();
