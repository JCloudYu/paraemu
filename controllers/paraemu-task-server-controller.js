(()=>{
	"use strict";
	
	const net	 = require( 'net' );
	const j_sock = require( 'json-socket' );
	
	module.exports = (envInfo)=>{
		const {hostInfo, event, internalTrigger} = envInfo;
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
			.on( 'close', ()=>{
				socket.valid = false;
				delete conns[socket.groupId];
			})
			.once( 'group-info', (info)=>{
				conns[socket.groupId=info.groupId] = socket;
				socket.valid = true;
			})
			.on( 'message', (message)=>{
				if ( message.type === "paraemu-group-info" ) {
					socket.emit( 'group-info', message );
					return;
				}
			
				if ( !socket.valid ) return;
				
				
				
				switch( message.type ) {
					case "paraemu-event":
						internalTrigger( '--paraemu-e-event', message, socket );
						break;
					
					default:
						break;
				}
			})
			.on( 'close', (hasError)=>{
				if ( socket.groupId ) {
					delete conns[socket.groupId];
					socket.valid = false;
				}
			});
		})
		.on( 'error', (err)=>{
			console.log(err);
		})
		.listen(hostInfo.port||23400, hostInfo.host||'127.0.0.1');
	};
})();
