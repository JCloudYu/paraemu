/**
 * Project: 0015.parallel-emulator
 * File: task1.js
 * Author: JCloudYu
 * Create Date: Sep. 06, 2018 
 */
(()=>{
	"use strict";
	
	const pemu = require( '../../../paraemu' );
	
	pemu
	.on( 'identification', async(e)=>{
		try {
			console.log( "[TASK2] Receiving 'identification' event!" );
			let prev = Date.now();
			let response = await pemu.deliver( e.sender, 'identification-received', "This is task2!" );
			let diff = (Date.now() - prev)/1000;
			console.log( `[TASK2] Get response for 'identification-received' event in ${diff} seconds...! (${response})`);
		}
		catch(e){
			console.log( "[TASK2] No response...." );
		}
		
		pemu.emit( 'do-no-response' );
	})
	.on( 'should-not-respond', async(e)=>{
		console.log( "[TASK2] Receiving 'should-not-respond' event! Not responding..." );
	})
	.on( 'bye', ()=>{
		setTimeout(()=>{process.exit(0);}, 0);
	});
})();
