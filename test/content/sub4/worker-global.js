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
	
	
	
	const TOTAL_RIDDLES = 100;
	const RIDDLE_MAP	= {};
	
	let SOLVED_RIDDLES_COUNT = 0;
	let RIDDLE_COUNT = 0;
	let GEN_RIDDLE = ()=>{
		RIDDLE_COUNT++;
		let key = `k${(new Date().getTime())}`;
		let riddle = (Math.random() * 65535)|0;
		
		RIDDLE_MAP[key] = { content:riddle };
		pemu.emit( 'assign-riddle', key, riddle );
		
		if ( RIDDLE_COUNT <= TOTAL_RIDDLES ) {
			setTimeout(GEN_RIDDLE, 500);
		}
	};
	
	pemu
	.on( 'tasks-ready', ()=>{
		setTimeout(GEN_RIDDLE, 500);
	})
	.on( 'riddle-solved', (e, key, result)=>{
		let riddle = RIDDLE_MAP[key];
		if ( riddle.solver ) { return; }
		
		SOLVED_RIDDLES_COUNT++;
		riddle.solver = e.sender;
		riddle.answer = result;
		riddle.solvedTime = (new Date()).getTime();
		
		console.log( `${SOLVED_RIDDLES_COUNT}: ${riddle.solver} has solved the riddle!` );
		
		
		
		if ( SOLVED_RIDDLES_COUNT === TOTAL_RIDDLES ) {
			pemu.emit( 'end-sim' );
			let logMsg = '';
			logMsg += `\nRiddles are solved!\n`;
			for( let _key in RIDDLE_MAP ) {
				if ( !RIDDLE_MAP.hasOwnProperty(_key) ) continue;
				
				let info = RIDDLE_MAP[_key];
				logMsg += `    KEY:${_key} RID:${info.content} ANS:${info.answer}\n`;
				logMsg += `        ${info.solver} at ${info.solvedTime}\n\n`;
			}
			console.log(logMsg);
			process.exit(0);
		}
	});
})();
