(()=>{
	"use strict";
	
	const net	 = require( 'net' );
	const j_sock = require( 'json-socket' );


	
	module.exports = (envInfo)=>{
		const {remoteInfo, event, internalTrigger} = envInfo;
		const socket = new net.Socket();
		socket.valid = false;
		socket.api = new j_sock(socket);
		
		socket
		.connect(remoteInfo.port, remoteInfo.host)
		.on( 'connect', ()=>{
			socket.api.sendMessage({type:'paraemu-group-info', groupId:event.groupId});
		})
		.on( 'message', (message)=>{
			if ( message.type === "paraemu-group-info" && !socket.valid ) {
				socket.groupId = message.groupId;
				socket.valid = true;
				internalTrigger( '--paraemu-e-event', {
					type: 'paraemu-event',
					sender: message.groupId,
					target: event.groupId,
					event: 'net-group-attach'
				});
				return;
			}
			
			
			
			if ( !socket.valid ) return;
			switch( message.type ) {
				case "paraemu-event":
					internalTrigger( '--paraemu-e-event', message );
					break;
				
				default:
					break;
			}
		})
		.on( 'close', (hasError)=>{
			socket.valid = false;
		});
		
		
		
		event.on( '--paraemu-e-network-event', (t_group, msg, socket)=>{
			if ( !socket.valid ) return;
			
			socket.api.sendMessage(msg);
		});
	};
})();
