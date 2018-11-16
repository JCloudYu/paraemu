(()=>{
	const {Binary} = require('beson');
	const pemu = require('../../../paraemu');

	// usage is equal to 'new Worker(filename[, options])' in Worker Threads
	let worker = pemu.job(`${__dirname}/worker.js`, { workerData: { data: 'Hello world!' } });

	worker.on('online', (e)=>{
		setTimeout(()=>{
			pemu.send( worker.uniqueId, 'binary', Binary.alloc(32) );
		}, 0);
	})
})();
