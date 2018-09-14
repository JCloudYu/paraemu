#!/usr/bin/env node

(()=>{
	"use strict";
	
	const child_process = require( 'child_process' );
	const argv = process.argv.slice(0);
	const exec_env = argv.splice(0, 2);
	const packageConf = JSON.parse(require('fs').readFileSync(`${__dirname}/package.json`));
	const json_check = /^.*\.json$/;
	
	const BYPASS_OPTIONS = [ '-h', '--help', '-v', '-vv', '--version', '--version-detail' ];
	const exec_args = [];
	let configFound = false, should_continue = false;
	for( let arg of argv ) {
		if ( json_check.test(arg) ) {
			configFound = configFound || true;
			should_continue = should_continue || true;
			exec_args.push(`${__dirname}/run-basic.js`);
		}
		
		if ( BYPASS_OPTIONS.indexOf(arg) >= 0 ) {
			should_continue = should_continue || true;
		}
		
		exec_args.push(arg);
	}
	
	if ( !configFound && !should_continue ) {
		process.stderr.write( 'Missing required runtime_conf file!\n\n' );
		argv[0] = '-h';
	}
	
	switch( argv[0] ) {
		case "--help":
		case "-h":
			process.stderr.write( "Usage: paraemu [OPTIONS] [NODE-OPTIONS] runtime_conf [RUNTIME-ARGS]\n" );
			process.stderr.write(
				"OPTIONS:\n" +
				"    -h,  --help              print this help\n" +
				"    -v,  --version           display version info of current paraemu environment\n" +
				"    -vv, --version-detail    display detailed version info of current paraemu environment\n" +
				"\n" +
				"NODE-OPTIONS:\n" +
				"    All environmental control options for node environment\n" +
				"\n" +
				"RUNTIME-ARGS:\n" +
				"    -R,  --remote     The remote master paraemu group info this group will link to\n" +
				"    -S,  --server     This group will be instantiated as a master group\n" +
				"\n"
			);
			process.exit(0);
			return;
		
		case "--version":
		case "-v":
		case "--version-detail":
		case "-vv":
			process.stderr.write(`paraemu version ${packageConf.version} (node ${process.version})\n`);
			if ( argv[0] === "-vv" || argv[0] === "--version-detail" ) {
				process.stderr.write(`node env:\n`);
				let max_len = 0;
				for( let idx in process.versions ) {
					if ( !process.versions.hasOwnProperty(idx) ) continue;
					if ( idx.length > max_len ) { max_len = idx.length; }
				}
				
				for( let idx in process.versions ) {
					if ( !process.versions.hasOwnProperty(idx) ) continue;
					let version = process.versions[idx];
					let padding_len = max_len - idx.length;
					let padding = '';
					while( padding_len-- > 0 ) padding += ' ';
					process.stderr.write(`    ${padding}${idx} - ${version}\n`);
				}
				process.stderr.write("\n");
			}
			process.exit(0);
			return;
	}
	
	
	
	child_process.execFileSync( exec_env[0], exec_args, { stdio:'inherit' });
})();
