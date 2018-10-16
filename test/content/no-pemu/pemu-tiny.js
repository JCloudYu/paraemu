/**
 *	Author: JCloudYu
 *	Create: 2018/10/16
**/
(()=>{
	"use strict";
	
	const {EventEmitter} = require( 'events' );
	const _PARENT_CONN = module.exports = new EventEmitter();
	
	
	
	process.on( 'message', (msg)=>{
		if ( Object(msg) !== msg ) { return; }
		
		const eventInfo = msg;
		if ( eventInfo.type === "paraemu-event" ) {
			let {event, eventData, sender, target} = eventInfo;
			eventData = Array.isArray(eventData) ?  eventData : [];
			_PARENT_CONN.emit(event, {type:event, sender, target}, ...eventData);
		}
	});
	process.send({ type:'worker-ready' });
})();
