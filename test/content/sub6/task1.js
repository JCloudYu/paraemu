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
	.on( paraemu.DEFAULT_EVENT.TASKS_READY, ()=>{
		pemu.emit( 'identification' );
	})
	.on( 'identification-received', (e, message)=>{
		console.log( `[TASK1] Receiving 'identification-received' event! (${message})` );
		e.respondWith( "Hi!" );
	})
	.on( 'do-no-response', async(e)=>{
		let prev = Date.now();
		await pemu.deliver(e.sender, 'should-not-respond');
		let diff = (Date.now() - prev)/1000;
		console.log(`[TASK1] Get response for 'should-not-response' after ${diff} seconds...`);
		
		
		pemu.send(e.sender, 'bye');
		setTimeout(()=>{process.exit(0);}, 0);
	});
})();
