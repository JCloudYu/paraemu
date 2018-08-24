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
					sender: event.groupId,
					target: event.groupId,
					event: 'net-connection-ready',
					eventData: [{
						groupId:message.groupId
					}]
				});
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
		.on( 'error', (err)=>{
			socket.valid = false;
			event.__emit( '--paraemu-e-event', {
				type: 'paraemu-event',
				sender: event.groupId,
				target: event.groupId,
				event: 'net-connection-error',
				eventData: err
			});
		})
		.on( 'close', (hasError)=>{
			socket.valid = false;
			if ( socket.groupId ) {
				event.__emit( '--paraemu-e-event', {
					type: 'paraemu-event',
					sender: event.groupId,
					target: event.groupId,
					event: 'net-connection-removed',
					eventData: [{
						groupId:socket.groupId
					}]
				});
			}
		});
		
		
		
		event.on( '--paraemu-e-network-event', (t_group, msg, source=null)=>{
			if ( !socket.valid || !!source ) return;
			
			socket.api.sendMessage(msg);
		});
	};
})();
