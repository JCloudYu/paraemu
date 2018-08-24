#!/usr/bin/env node

(()=>{
	"use strict";
	
	const child_process = require( 'child_process' );
	const argv = process.argv.slice(0);
	const exec_env = argv.splice(0, 2);
	
	argv.splice(-1, 0, `${__dirname}/run-basic.js`);
	child_process.execFileSync( exec_env[0], argv, { stdio:'inherit' });
})();
