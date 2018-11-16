(()=>{
	const pemu = require('../../../paraemu');
	pemu.on('binary', (e, ...result)=>{
		console.log('Worker Received:', result);
	});
})();
