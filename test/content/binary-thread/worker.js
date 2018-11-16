(()=>{
	const pemu = require('../../../paraemu');
	
	pemu.on('binary-in', (e, ...args)=>{
		console.log( `WORKER ${e.type}`, args );
		pemu.send( e.sender, 'binary-out', ...args );
	});
})();
