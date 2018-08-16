(()=>{
	"use strict";
	
	const net	 = require( 'net' );
	const j_sock = require( 'json-socket' );
	
	module.exports = (options)=>{
		const conns = {};
		const GROUP_ID = options.groupId;
	
	
		net.createServer((socket)=>{
			socket = new j_sock(socket);
			socket.valid = false;
			socket.on( 'message', (message)=>{
				if ( message.type === "net-group-info" ) {
					socket.emit( 'group-info', message );
					return;
				}
			
				if ( !socket.valid ) return;
				
				
				
				switch( message.type ) {
					case "paraemu-event":
						socket.emit( 'paraemu-event', message );
						break;
					
					default:
						break;
				}
			})
			.once( 'group-info', (info)=>{
				conns[socket.groupId = info.groupId] = socket;
				socket.valid = true;
			})
			.on( 'paraemu-event', (eventInfo)=>{
				let [groupId, ] = (eventInfo.target||'').split( '-' );
				groupId = (groupId === "") ? null : groupId;
			
				if ( !groupId || groupId === GROUP_ID ) {
				
				}
				
				
				for( let _gId in conns ) {
					if ( !conns.hasOwnProperty(_gId) ) continue;
					
					if ( !groupId || _gId === groupId ) {
						conns[_gId].sendMessage(eventInfo);
					}
				}
			});
		})
		.on( 'error' )
		.listen(options.port||23400, options.host||'127.0.0.1');
	};
})();
