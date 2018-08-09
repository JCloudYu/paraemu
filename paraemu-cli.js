#!/usr/bin/env node

(()=>{
	"use strict";
	
	process.isCLI = true;
	process.argv.splice(0, 2);
	require('./paraemu');
})();
