(()=>{
	"use strict";
	
	const net	 = require( 'net' );
	const j_sock = require( 'json-socket' );
	
	module.exports = (envInfo)=>{
		const {info:hostInfo, event} = envInfo;
		const conns = {};
		
		event.on( '--paraemu-e-network-event', (t_group, msg, srcSock)=>{
			if ( !t_group ) {
				for( let _groupId in conns ) {
					if ( !conns.hasOwnProperty(_groupId) || srcSock === conns[_groupId] ) {
						continue;
					}
					
					conns[_groupId].api.sendMessage(msg);
				}
				
				return;
			}
			
			if ( srcSock && srcSock.groupId === t_group ) return;
			if ( !conns[t_group] ) return;
			
			conns[t_group].api.sendMessage(msg);
		});
	
		net.createServer((socket)=>{
			socket.api = new j_sock(socket);
			socket.valid = false;
			
			
			socket
			.on( 'error', ()=>{
				try { socket.valid = false; } catch(e) {}
			})
			.on( 'message', (message)=>{
				if ( message.type === "paraemu-group-info" && !socket.valid ) {
					conns[socket.groupId=message.groupId] = socket;
					socket.valid = true;
					
					socket.api.sendMessage({
						type:'paraemu-group-info',
						groupId:event.groupId
					});
					
					event.__emit( '--paraemu-e-event', {
						type: 'paraemu-event',
						sender: message.groupId,
						target: null,
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
				socket.valid = false;
			
				if ( socket.groupId ) {
					delete conns[socket.groupId];
					
					event.__emit( '--paraemu-e-event', {
						type: 'paraemu-event',
						sender: socket.groupId,
						target: null,
						event: 'net-group-detach'
					}, socket);
				}
			});
		})
		.on( 'error', (err)=>{
			event.__emit( '--paraemu-e-event', {
				type: 'paraemu-event',
				sender: event.groupId,
				target: event.groupId,
				event: 'net-connection-error',
				eventData: err
			});
		})
		.listen(hostInfo.port||23400, hostInfo.host||'127.0.0.1', (e)=>{
			event.__emit( '--paraemu-e-event', {
				type: 'paraemu-event',
				sender: event.groupId,
				target: event.groupId,
				event: 'net-connection-ready'
			});
		});
	};
})();
