(()=>{
	"use strict";
	
	const argv = process.argv.slice(2);
	
	const path = require('path');
	const pemu = require('./paraemu');
	pemu.load(argv[0], {module_paths:[path.resolve(__dirname, '../')]});
})();
