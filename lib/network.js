(()=>{
	'use strict';
	
	const _WEAK_REL = new WeakMap();
	module.exports = {RegisterPacketReceiver: SOCKET_PACKET_RECEIVER, SendPacket:SOCKET_PACKET_SENDER};
	
	function SOCKET_PACKET_SENDER(socket, data) {
		const buffer = Buffer.from(JSON.stringify(data));
		const header = Buffer.alloc(4);
		header.writeUInt32LE(buffer.length, 0);
		socket.write(Buffer.concat([header, buffer]));
	}
	function SOCKET_PACKET_RECEIVER(socket){
		_WEAK_REL.set(socket, {
			_chunk: Buffer.alloc(0)
		});
		
		socket.on('data', ___HANDLE_DATA);
		return socket;
	}
	function ___HANDLE_DATA(chunk){
		const _PRIVATES = _WEAK_REL.get(this);
		_PRIVATES._chunk = Buffer.concat([_PRIVATES._chunk, chunk]);
		
		let result = ___EAT_MESSAGE(chunk);
		if( !result ) return;
		
		let {raw, anchor} = result;
		_PRIVATES._chunk = _PRIVATES._chunk.slice(anchor);
		this.emit('message', JSON.parse(raw.toString()));
	}
	function ___EAT_MESSAGE(chunk){
		if( chunk.length <= 4 ){ return false; }
		
		let contentLength = chunk.readUInt32LE(0);
		if( chunk.length < contentLength ){ return false; }
		
		
		let next = 4 + contentLength;
		let raw = chunk.slice(4, next);
		return {raw, anchor: next};
	}
})();
