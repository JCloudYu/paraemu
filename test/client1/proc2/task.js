(()=>{
	"use strict";
	
	const pemu = require( '../../../paraemu' );
	
	pemu.on( 'join-signal', (e)=>{
		let
		logMsg  = '[CLIENT1 PROC2] receiving join-signal event\n';
		logMsg += `            SID: ${e.sender}\n`;
		logMsg += `            STAG: ${e.sender_tag}`;
		
		console.log(logMsg);
	});
})();
