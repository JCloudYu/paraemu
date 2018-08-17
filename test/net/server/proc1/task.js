(()=>{
	"use strict";
	
	const pemu = require( '../../../../paraemu' );
	
	pemu.on( 'join-signal', (e)=>{
		let
		logMsg  = '[SERVER PROC1] receiving join-signal event\n';
		logMsg += `    UID: ${pemu.groupId}-${pemu.id}-${pemu.jobId}\n`;
		logMsg += `    SID: ${e.sender}\n`;
		logMsg += `    TID: ${e.target}\n`;
		
		console.log(logMsg);
	});
})();
