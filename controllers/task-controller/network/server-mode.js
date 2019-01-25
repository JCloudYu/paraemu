(()=>{
	"use strict";
	
	const net = require('net');
	const {Helper:{SendPacket, RegisterPacketReceiver}} = include( 'lib' );
	
	module.exports = (envInfo)=>{
		const {info: hostInfo, event} = envInfo;
		const conns = {};
		
		event.on('--paraemu-e-network-event', (t_group, msg, srcSock)=>{
			if( !t_group ){
				for( let _groupId in conns ){
					if( !conns.hasOwnProperty(_groupId) || srcSock === conns[_groupId] ){
						continue;
					}
					
					SendPacket(conns[_groupId], msg);
				}
				
				return;
			}
			
			if( srcSock && srcSock.groupId === t_group ) return;
			if( !conns[t_group] ) return;
			
			SendPacket(conns[t_group], msg);
		});
		
		net.createServer((socket)=>{
			RegisterPacketReceiver(socket);
			socket.valid = false;
			
			
			socket
			.setTimeout(10000)
			.on('error', ()=>{
				try{ socket.valid = false; } catch(e){}
			})
			.on('message', (message)=>{
				if( message.type === "paraemu-group-info" && !socket.valid ){
					conns[socket.groupId = message.groupId] = socket;
					socket.valid = true;
					
					SendPacket(socket, {
						type: 'paraemu-group-info',
						groupId: event.groupId
					});
					
					event.__emit(paraemu.SYSTEM_HOOK.PARAEMU_EVENT, {
						type: paraemu.SYSTEM_EVENT.CUSTOM_EVENT,
						sender: message.groupId,
						target: null,
						event: 'net-group-attach'
					}, socket);
					return;
				}
				
				
				
				if( !socket.valid ) return;
				switch( message.type ){
					case paraemu.SYSTEM_EVENT.CUSTOM_EVENT:
					case paraemu.SYSTEM_EVENT.DELIVERY_EVENT:
						event.__emit(paraemu.SYSTEM_HOOK.PARAEMU_EVENT, message, socket);
						break;
					
					default:
						break;
				}
			})
			.on('timeout', ()=>{
				socket.end();
				socket.destroy();
			})
			.on('close', (hasError)=>{
				socket.valid = false;
				
				if( socket.groupId ){
					delete conns[socket.groupId];
					
					event.__emit(paraemu.SYSTEM_HOOK.PARAEMU_EVENT, {
						type: paraemu.SYSTEM_EVENT.CUSTOM_EVENT,
						sender: socket.groupId,
						target: null,
						event: 'net-group-detach'
					}, socket);
				}
			});
		})
		.on('error', (err)=>{
			event.__emit(paraemu.SYSTEM_HOOK.PARAEMU_EVENT, {
				type: paraemu.SYSTEM_EVENT.CUSTOM_EVENT,
				sender: event.groupId,
				target: event.groupId,
				event: 'net-connection-error',
				eventData: [err]
			});
		})
		.listen(hostInfo.port || 23400, hostInfo.host || '127.0.0.1', (e)=>{
			event.__emit(paraemu.SYSTEM_HOOK.PARAEMU_EVENT, {
				type: paraemu.SYSTEM_EVENT.CUSTOM_EVENT,
				sender: event.groupId,
				target: event.groupId,
				event: 'net-connection-ready'
			});
		});
	};
})();
