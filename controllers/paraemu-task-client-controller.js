(()=>{
	"use strict";
	
	const net	 = require( 'net' );
	const j_sock = require( 'json-socket' );


	
	module.exports = (envInfo)=>{
		const {remoteInfo, event} = envInfo;
		const socket = new net.Socket();
		socket.valid = false;
		socket.api = new j_sock(socket);
		
		socket
		.connect(remoteInfo.port, remoteInfo.host)
		.on( 'connect', ()=>{
			socket.api.sendMessage({type:'paraemu-group-info', groupId:event.groupId});
			socket.valid = true;
		})
		.on( 'message', (message)=>{
				switch( message.type ) {
					case "paraemu-event":
						socket.emit( '--paraemu-e-event', message );
						break;
					
					default:
						break;
				}
			})
		.on( 'close', (hasError)=>{
			socket.valid = false;
		});
		
		
		
		event.on( '--paraemu-e-network-event', (t_group, msg)=>{
			if ( !socket.valid ) return;
			
			socket.api.sendMessage(msg);
		});
	};
})();
