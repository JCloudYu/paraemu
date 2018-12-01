/**
 *	Author: JCloudYu
 *	Create: 2018/10/16
**/
(()=>{
	"use strict";
	
	const {EventEmitter} = require( 'events' );
	const EXEC_CONF = JSON.parse(process.env.paraemu);
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
	
	Object.defineProperties(_PARENT_CONN, {
		tag:EXEC_CONF.tag,
		args:EXEC_CONF.args
	});
})();
