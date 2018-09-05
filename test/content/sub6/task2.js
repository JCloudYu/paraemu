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
			let response = await pemu.deliver( e.sender, 'identification-received', "This is task2!" );
			console.log( `[TASK2] Get response for 'identification-received' event! (${response})`);
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
