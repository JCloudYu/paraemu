(()=>{
	const {Binary} = require('beson');
	const pemu = require('../../../paraemu');

	// usage is equal to 'new Worker(filename[, options])' in Worker Threads
	let worker = pemu.job(`${__dirname}/worker.js`, { workerData: { data: 'Hello world!' } });

	pemu.on( 'binary-out', (e, ...args)=>{
		console.log( `MASTER ${e.type}`, args );
	});

	worker.on('online', (e)=>{
		setTimeout(()=>{
			pemu.send( worker.uniqueId, 'binary-in', Binary.alloc(32) );
		}, 0);
	})
})();
