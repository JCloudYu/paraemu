(()=>{
	"use strict";
	
	const argv = process.argv.slice(2);
	
	const path = require('path');
	const pemu = require('./paraemu');
	
	const PREFIX_CHECK = /^paraemu:\/\/.*$/;
	const env_ctrls = {};
	
	
	const runtime_conf_path = argv.shift();
	while( argv.length > 0 ) {
		let arg = argv.shift();
		switch ( arg ) {
			case "--remote":
			case "-R":
			{
				let url = argv.shift();
				if ( !PREFIX_CHECK.test(url) ) {
					url = `paraemu://${url}`;
				}
				
				env_ctrls.remote = {
					protocol:url.protocol,
					host:url.hostname,
					port:(url.port === '') ? 23400 : (url.port|0)
				};
				break;
			}
			
			case "--server":
			case "-S":
			{
				let url = argv.shift();
				if ( !PREFIX_CHECK.test(url) ) {
					url = `paraemu://${url}`;
				}
				
				env_ctrls.server = {
					protocol:url.protocol,
					host:url.hostname,
					port:(url.port === '') ? 23400 : (url.port|0)
				};
				break;
			}
		}
	}
	
	env_ctrls.module_paths = [path.resolve(__dirname, '../')];
	pemu.load(runtime_conf_path, env_ctrls);
})();
