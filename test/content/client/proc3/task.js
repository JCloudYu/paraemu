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
	.on('Start', async(e) => {
		const promises = [];
		for( let i=0; i<100; i++ ) {
			let num = i;
			promises.push(pemu.deliver(e.sender, 'Deliver').then((result)=>{
				console.log(`${num} - ${result}`);
			}));
		}
		
		await Promise.all(promises);
	})
})();
