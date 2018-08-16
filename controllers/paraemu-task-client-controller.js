(()=>{
	"use strict";
	
	const net	 = require( 'net' );
	const j_sock = require( 'json-socket' );
	
	module.exports = (options)=>{
		const socket = new j_sock(new net.Socket());
		socket.connect(options.port, options.host)
		.on( 'connect', ()=>{
			socket.sendMessage({});
			
		});
	};
})();
