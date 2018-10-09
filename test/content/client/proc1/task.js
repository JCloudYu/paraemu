(()=>{
	"use strict";
	
	const pemu = require( '../../../../paraemu' );
	
	pemu
	.on( 'net-group-attach', (e)=>{
		let
		logMsg  = `[CLIENT PROC1] net-group-attach event\n`;
		logMsg += `    UID: ${pemu.uniqueId}\n`;
		logMsg += `    SID: ${e.sender}\n`;
		logMsg += `    TID: ${e.target}\n`;
		
		console.log(logMsg);
		
		
		
		pemu.emit( 'join-signal' );
	})
	.on( 'net-group-detach', (e)=>{
		let
		logMsg  = `[CLIENT PROC1] net-group-detach event\n`;
		logMsg += `    UID: ${pemu.uniqueId}\n`;
		logMsg += `    SID: ${e.sender}\n`;
		logMsg += `    TID: ${e.target}\n`;
		
		console.log(logMsg);
	})
	.on( 'tasks-ready', (e)=>{
		let
		logMsg  = '[CLIENT PROC1] receiving tasks-ready event\n';
		logMsg += `    UID: ${pemu.uniqueId}\n`;
		logMsg += `    SID: ${e.sender}\n`;
		logMsg += `    TID: ${e.target}\n`;
		
		console.log(logMsg);
	})
	.on( 'join-signal', (e)=>{
		let
		logMsg  = `[CLIENT PROC1] receiving join-signal event\n`;
		logMsg += `    UID: ${pemu.uniqueId}\n`;
		logMsg += `    SID: ${e.sender}\n`;
		logMsg += `    TID: ${e.target}\n`;
		
		console.log(logMsg);
	});
})();
