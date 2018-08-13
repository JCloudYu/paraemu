#!/usr/bin/env node

(()=>{
	"use strict";
	
	process.isCLI = true;
	process.argv.splice(0, 2);
	
	const path = require('path');
	const pemu = require('./paraemu');
	pemu.load(process.argv[0], {search_paths:[path.resolve(__dirname, '../')]});
	pemu.on( 'tasks-ready', (e)=>{
		pemu.emit( 'tasks-ready' );
	});
})();
