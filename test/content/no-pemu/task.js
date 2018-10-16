/**
 *	Author: JCloudYu
 *	Create: 2018/10/16
**/
(()=>{
	"use strict";
	
	const EVT = require( './pemu-tiny' );
	
	EVT.on( 'tasks-ready', (e)=>{
		console.log( e.type );
	});
})();
