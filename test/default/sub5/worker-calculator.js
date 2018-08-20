(()=>{
	'use strict';
	
	const pemu = require('../../../paraemu');
	
	let
	string  = "[WORKER4] Worker Started\n";
	string += `          PID: ${process.pid}\n`;
	string += `          PPID: ${process.ppid}\n`;
	string += `          UID: ${pemu.uniqueId}\n`;
	string += `          GRP: ${pemu.groupId}\n`;
	string += `          ID: ${pemu.id}\n`;
	string += `          TAG: ${pemu.tag}\n`;
	string += `          ARGS: ${JSON.stringify(pemu.args)}\n`;
	string += `          CWD: ${process.cwd()}\n`;
	
	console.log(string);
	
	
	
	
	
	const SIM_AMOUNT = 10;
	const WORKERS = [];
	for( let i=0; i<SIM_AMOUNT; i++ ) {
		let worker = pemu.job(`${__dirname}/sim-node.js`);
		WORKERS.push(worker);
	}
	
	
	
	
	let FINAL_COUNT = 0;
	pemu
	.on( 'finalized', ()=>{
		FINAL_COUNT++;
		if ( FINAL_COUNT === SIM_AMOUNT ) {
			process.exit(0);
		}
	})
	.on( 'end-sim', ()=>{
		pemu.local( 'clean-up' );
	});
})();
