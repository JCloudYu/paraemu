(()=>{
    "use strict";
    
    const net	 = require( 'net' );
    const j_sock = require( '../../../lib/json-socket' );


    
    module.exports = (envInfo)=>{
        const {info:remoteInfo, event} = envInfo;
        const socket = new net.Socket();
        socket.valid = false;
        socket.api = new j_sock(socket);
        
        socket
        .connect(remoteInfo.port||23400, remoteInfo.host||'127.0.0.1')
        .on( 'connect', ()=>{
            socket.api.sendMessage({type:'paraemu-group-info', groupId:event.groupId});
        })
        .on( 'message', (message)=>{
            if ( message.type === "paraemu-group-info" && !socket.valid ) {
                socket.groupId = message.groupId;
                socket.valid = true;
                
                event.__emit( paraemu.SYSTEM_HOOK.PARAEMU_EVENT, {
                    type: paraemu.SYSTEM_EVENT.CUSTOM_EVENT,
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
                case paraemu.SYSTEM_EVENT.CUSTOM_EVENT:
                case paraemu.SYSTEM_EVENT.DELIVERY_EVENT:
                    event.__emit( paraemu.SYSTEM_HOOK.PARAEMU_EVENT, message, socket );
                    break;
                
                default:
                    break;
            }
        })
        .on( 'error', (err)=>{
            socket.valid = false;
            event.__emit( paraemu.SYSTEM_HOOK.PARAEMU_EVENT, {
                type: paraemu.SYSTEM_EVENT.CUSTOM_EVENT,
                sender: event.groupId,
                target: event.groupId,
                event: 'net-connection-error',
                eventData: [ err ]
            });
        })
        .on( 'close', (hasError)=>{
            socket.valid = false;
            if ( socket.groupId ) {
                event.__emit( paraemu.SYSTEM_HOOK.PARAEMU_EVENT, {
                    type: paraemu.SYSTEM_EVENT.CUSTOM_EVENT,
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
