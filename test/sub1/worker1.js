(()=>{
	'use strict';
	
	const pemu = require('../../paraemu');
	
	console.log( `worker1: ${process.cwd()}` );
	try {
		require( './other-module' );
		console.log( "worker1: other-module loaded!" );
	}
	catch(e) {
		console.log( "worker1: other-module load failed!" );
	}
	
	
	try {
		require( 'tiinytiny' );
		console.log( "worker1: tiinytiny loaded!" );
	}
	catch(e) {
		console.log( "worker1: tiinytiny load failed!" );
	}
	
	console.log({
		who: 'worker1',
		id: pemu.id,
		tag: pemu.tag,
		args: pemu.args
	});
	
	pemu.on('event1', (event, ...args)=>{
		console.log({
			event,
			me: pemu.id,
			who: 'worker1',
			args
		});
	})
	.on('tasks-ready', ()=>{
		console.log("worker1 synced");
		setTimeout(()=>{
			pemu.emit('event1', 123, 'abc', [111, 'aaa']);
		}, 2000);
		
		setTimeout(()=>{
			process.exit(0);
		}, 5000);
	});
})();
