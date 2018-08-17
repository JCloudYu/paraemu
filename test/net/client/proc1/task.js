(()=>{
	"use strict";
	
	const pemu = require( '../../../../paraemu' );
	
	pemu
	.on( 'tasks-ready', (e)=>{
		pemu.emit( 'join-signal' );
	})
	.on( 'join-signal', (e)=>{
		let
		logMsg  = `[CLIENT PROC1] receiving join-signal event\n`;
		logMsg += `    UID: ${pemu.groupId}-${pemu.id}-${pemu.jobId}\n`;
		logMsg += `    SID: ${e.sender}\n`;
		logMsg += `    TID: ${e.target}\n`;
		
		console.log(logMsg);
	});
})();
