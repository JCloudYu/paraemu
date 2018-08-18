#!/usr/bin/env node

(()=>{
	"use strict";
	
	process.isCLI = true;
	process.argv.splice(0, 2);
	
	const path = require('path');
	const pemu = require('./paraemu');
	pemu.load(process.argv[0], {module_paths:[path.resolve(__dirname, '../')]});
})();
