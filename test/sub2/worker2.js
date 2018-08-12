(()=>{
	'use strict';
	
	const pemu = require('../../paraemu');
	
	console.log( `worker2: ${process.cwd()}` );
	try {
		require( './other-module' );
		console.log( "worker2: other-module loaded!" );
	}
	catch(e) {
		console.log( "worker2: other-module load failed!" );
	}
	
	
	try {
		require( 'tiinytiny' );
		console.log( "worker2: tiinytiny loaded!" );
	}
	catch(e) {
		console.log( "worker2: tiinytiny load failed!" );
	}
	
	console.log({
		who: 'worker2',
		id: pemu.id,
		tag: pemu.tag,
		args: pemu.args
	});
	
	pemu
	.on('event1', (event, ...args)=>{
		console.log({
			event,
			me: pemu.id,
			who: 'worker2',
			args
		});
	})
	.on('tasks-ready', (e)=>{
		console.log("worker2 synced");
		setTimeout(()=>{
			process.exit(0);
		}, 5000);
	});
})();
