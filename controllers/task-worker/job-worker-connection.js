(()=>{
	"use strict";
	
	const {EventEmitter} = require('events');
	const GEN_RANDOM_ID = GenRandomID.bind(null, 16);
	
	module.exports = (groupId, taskId, jobId=null)=>{
		const JOB_INST = new EventEmitter();
		const JOB_ID = jobId||GEN_RANDOM_ID();
		
		// Register constants
		Object.setConstant(JOB_INST, {
			jobId:JOB_ID, groupId, taskId,
			uniqueId: `${groupId}-${taskId}-${JOB_ID}`
		});
		
		
		
		// region [ Prepare APIs for developers ]
		Object.setConstant(JOB_INST, {__emit:JOB_INST.emit.bind(JOB_INST)}, true);
		JOB_INST.send = (target, event, ...args)=>{
			JOB_INST.__emit( '--paraemu-e-event', {
				type:'paraemu-event',
				sender:JOB_ID,
				target:target,
				event,
				eventData:args
			});
		};
		JOB_INST.emit = (event, ...args)=>{
			JOB_INST.send( null, event, ...args );
		};
		JOB_INST.local = (event, ...args)=>{
			JOB_INST.send( JOB_INST.groupId, event, ...args );
		};
		// endregion
		
		return JOB_INST;
	};
})();
