(()=>{
	"use strict";
	
	const net	 = require( 'net' );
	const j_sock = require( 'json-socket' );


	
	module.exports = (envInfo)=>{
		const {info:remoteInfo, event} = envInfo;
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
				event.__emit( '--paraemu-e-event', {
					type: 'paraemu-event',
					sender: message.groupId,
					target: event.groupId,
					event: 'net-group-attach'
				}, socket);
				return;
			}
			
			
			
			if ( !socket.valid ) return;
			switch( message.type ) {
				case "paraemu-event":
					event.__emit( '--paraemu-e-event', message, socket );
					break;
				
				default:
					break;
			}
		})
		.on( 'close', (hasError)=>{
			if ( socket.groupId ) {
				socket.valid = false;
				
				event.__emit( '--paraemu-e-event', {
					type: 'paraemu-event',
					sender: socket.groupId,
					target: event.groupId,
					event: 'net-group-detach'
				}, socket);
			}
		});
		
		
		
		event.on( '--paraemu-e-network-event', (t_group, msg, source=null)=>{
			if ( !socket.valid || !!source ) return;
			
			socket.api.sendMessage(msg);
		});
	};
})();
