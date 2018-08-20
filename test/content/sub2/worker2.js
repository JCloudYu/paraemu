(()=>{
	'use strict';
	
	const pemu = require('../../../paraemu');
	
	let
	string  = "[WORKER2] Worker Started\n";
	string += `          PID: ${process.pid}\n`;
	string += `          PPID: ${process.ppid}\n`;
	string += `          UID: ${pemu.uniqueId}\n`;
	string += `          GID: ${pemu.groupId}\n`;
	string += `          TID: ${pemu.taskId}\n`;
	string += `          JID: ${pemu.jobId}\n`;
	string += `          TAG: ${pemu.tag}\n`;
	string += `          ARGS: ${JSON.stringify(pemu.args)}\n`;
	string += `          CWD: ${process.cwd()}\n`;
	
	console.log(string);
	
	
	try {
		require( './test-module-2' );
		console.log( "[WORKER2] test-module-2 loading test - passed" );
	}
	catch(e) {
		console.log( "[WORKER2] test-module-2 loading test - failed" );
	}
	
	try {
		require( 'tiinytiny' );
		console.log( "[WORKER2] node_modules test - failed" );
	}
	catch(e) {
		console.log( "[WORKER2] node_modules test - passed" );
	}
	
	try {
		require( './test-module-1' );
		console.log( "[WORKER2] test-module-1 loading test - failed" );
	}
	catch(e) {
		console.log( "[WORKER2] test-module-1 loading test - passed" );
	}
	
	
	pemu
	.on('event1', (event, ...args)=>{
		let msg = `[WORKER2] receiving event (${JSON.stringify({event, args})})\n`;
		if ( event.type !== "event1" || args[0] === "proc1" ) {
			console.log( `${msg}[WORKER2] event test - passed` );
		}
		else {
			console.log( `${msg}[WORKER2] event test - failed` );
		}
	})
	.on('tasks-ready', (e)=>{
		let prev = (new Date()).getTime();
		console.log( `[WORKER2] tasks-ready received!`);
		setTimeout(()=>{
			let now = (new Date()).getTime();
			console.log( `[WORKER2] exiting! (${Math.floor((now-prev)/1000)} seconds)`);
			process.exit(0);
		}, 5000);
	});
})();
