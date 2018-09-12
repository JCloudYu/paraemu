#!/usr/bin/env node

(()=>{
	"use strict";
	
	const child_process = require( 'child_process' );
	const argv = process.argv.slice(0);
	const exec_env = argv.splice(0, 2);
	const json_check = /^.*\.json$/;
	
	const exec_args = [];
	for( let arg of argv ) {
		if ( json_check.test(arg) ) {
			exec_args.push(`${__dirname}/run-basic.js`);
		}
		
		exec_args.push(arg);
	}
	child_process.execFileSync( exec_env[0], exec_args, { stdio:'inherit' });
})();
