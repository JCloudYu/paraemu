(()=>{
	'use strict';
	
	const pemu = require('../../../paraemu');
	
	let
	string  = "[WORKER4] Worker Started\n";
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
	
	
	const sim_node = require( './sim-node' );
	const SIM_AMOUNT = 10;
	for( let i=0; i<SIM_AMOUNT; i++ ) {
		sim_node(pemu.job());
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
