#!/usr/bin/env node

(()=>{
	"use strict";
	
	process.isCLI = true;
	process.argv.splice(0, 2);
	const pemu = require('./paraemu');
	pemu.load(process.argv[0]);
	pemu.on( 'tasks-ready', (e)=>{
		pemu.emit( 'tasks-ready' );
	});
})();
