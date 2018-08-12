(()=>{
	'use strict';
	
	const pemu = require('../../paraemu');
	
	let
	string  = "[WORKER1] Worker Started\n";
	string += `          PID: ${process.pid}\n`;
	string += `          PPID: ${process.ppid}\n`;
	string += `          ID: ${pemu.id}\n`;
	string += `          TAG: ${pemu.tag}\n`;
	string += `          ARGS: ${JSON.stringify(pemu.args)}\n`;
	string += `          CWD: ${process.cwd()}`;
	console.log(string);
	
	
	try {
		require( './test-module-2' );
		console.log( "[WORKER1] test-module-2 loading test - failed" );
	}
	catch(e) {
		console.log( "[WORKER1] test-module-2 loading test - passed" );
	}
	
	try {
		require( 'tiinytiny' );
		console.log( "[WORKER1] node_modules test - passed" );
	}
	catch(e) {
		console.log( "[WORKER1] node_modules test - failed" );
	}
	
	try {
		require( './test-module-1' );
		console.log( "[WORKER1] test-module-1 loading test - failed" );
	}
	catch(e) {
		console.log( "[WORKER1] test-module-1 loading test - passed" );
	}
	
	pemu.on('event1', (event, ...args)=>{
		let msg = `[WORKER1] receiving event (${JSON.stringify({event, args})})\n`;
		if ( event.type !== "event1" || event.sender_tag === "proc1" ) {
			console.log( `${msg}[WORKER1] event test - passed` );
		}
		else {
			console.log( `${msg}[WORKER1] event test - failed` );
		}
	})
	.on('tasks-ready', ()=>{
		let prev = (new Date()).getTime();
		console.log( `[WORKER1] tasks-ready received!`);
		setTimeout(()=>{
			console.log( `[WORKER1] sending event1` );
			pemu.emit('event1', 123, 'abc', [111, 'aaa']);
		}, 2000);
		
		setTimeout(()=>{
			let now = (new Date()).getTime();
			console.log( `[WORKER1] exiting! (${Math.floor((now-prev)/1000)} seconds)`);
			process.exit(0);
		}, 5000);
	});
})();
