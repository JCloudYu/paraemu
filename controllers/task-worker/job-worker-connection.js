(()=>{
	"use strict";
	
	const {EventEmitter} = require('events');
	const {ObjectId:{GenObjectId}, Helper:{GenRandomID, SetConstant}} = require( 'pemu-lib' );
	
	const GEN_RANDOM_ID  = GenRandomID.bind(null, 16);
	const DELIVERY_TIMEOUT = 30 * 1000;
	const DELIVERY_RESPONSE_TIMEOUT = 2 * 1000;
	
	module.exports = (groupId, taskId, jobId=null)=>{
		const JOB_INST = new EventEmitter();
		const JOB_ID = jobId||GEN_RANDOM_ID();
		const ACTIVE_DELIVERY_POOL  = {};
		const PASSIVE_DELIVERY_POOL = {};
		
		// Register constants
		SetConstant(JOB_INST, {
			jobId: JOB_ID, groupId, taskId,
			uniqueId: `${groupId}-${taskId}-${JOB_ID}`
		});
		
		
		
		// region [ Prepare APIs for developers ]
		SetConstant(JOB_INST, {
			__emit:JOB_INST.emit.bind(JOB_INST),
			__dispatch:(eventInfo, broadcast=true)=>{
				switch( eventInfo.type ) {
					case paraemu.SYSTEM_EVENT.CUSTOM_EVENT:
					{
						let {event, eventData, sender, target} = eventInfo;
						eventData = Array.isArray(eventData) ?  eventData : [];
						JOB_INST.__emit(event, {type:event, sender, target}, ...eventData);
						break;
					}
					
					case paraemu.SYSTEM_EVENT.DELIVERY_EVENT:
						if ( !broadcast ) {
							let {isAck, deliveryId, eventData, event, sender, target} = eventInfo;
							eventData = Array.isArray(eventData) ?  eventData : [];
							
							if ( !isAck ) {
								const respondWith = (()=>{
									let invoked = false;
									return (response=null)=>{
										if ( invoked ) return;
										
										invoked = true;
										JOB_INST.__emit( paraemu.SYSTEM_HOOK.PARAEMU_EVENT, {
											type: paraemu.SYSTEM_EVENT.DELIVERY_EVENT,
											sender: JOB_ID,
											target: sender,
											isAck:1, deliveryId,
											event, eventData:[response]
										});
									};
								})();
								
								JOB_INST.__emit( event, {type:event, sender, target, respondWith}, ...eventData);
								PASSIVE_DELIVERY_POOL[deliveryId]={
									timeout:setTimeout(()=>{
										delete ACTIVE_DELIVERY_POOL[deliveryId];
										respondWith();
									}, DELIVERY_RESPONSE_TIMEOUT)
								};
							}
							else {
								let deliveryInfo;
								if ( deliveryInfo = ACTIVE_DELIVERY_POOL[deliveryId] ) {
									let { resolve, timeout } = deliveryInfo;
									clearTimeout(timeout);
									delete ACTIVE_DELIVERY_POOL[deliveryId];
									resolve(eventData[0]);
								}
							}
						}
						break;
					
					default:
						break;
				}
			}
		}, true);
		JOB_INST.send = (target, event, ...args)=>{
			JOB_INST.__emit( paraemu.SYSTEM_HOOK.PARAEMU_EVENT, {
				type: paraemu.SYSTEM_EVENT.CUSTOM_EVENT,
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
		JOB_INST.deliver = (target, event, ...eventData)=>{
			const deliveryId = GenObjectId().toString('base64url');
		
			JOB_INST.__emit( paraemu.SYSTEM_HOOK.PARAEMU_EVENT, {
				type: paraemu.SYSTEM_EVENT.DELIVERY_EVENT,
				sender: JOB_ID,
				target: target,
				isAck:0, deliveryId, event, eventData
			});
		
			return new Promise((resolve, reject)=>{
				ACTIVE_DELIVERY_POOL[deliveryId]={
					timeout:setTimeout(()=>{
						delete ACTIVE_DELIVERY_POOL[deliveryId];
						reject();
					}, DELIVERY_TIMEOUT),
					resolve, reject
				};
			});
		};
		// endregion
		
		return JOB_INST;
	};
})();
