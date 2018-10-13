(()=>{
	'use strict';
	
	const {UniqueTimeout} = require( './misc' );
	
	const _BATCH_MSG_COUNT = 10;
	const _WEAK_REL = new WeakMap();
	const _NO_REPEAT_TIMEOUT = UniqueTimeout();
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
		_NO_REPEAT_TIMEOUT(___EAT_DATA.bind(this), 0);
	}
	function ___EAT_DATA() {
		const _PRIVATES = _WEAK_REL.get(this);
		let chunk = _PRIVATES._chunk;
	
		let count = 0, result = false;
		while( count < _BATCH_MSG_COUNT ) {
			result = ___EAT_MESSAGE(chunk);
			if ( !result ) break;
			
			let {raw, anchor} = result;
			chunk = chunk.slice(anchor);
			this.emit('message', JSON.parse(raw.toString()));
		}
		_PRIVATES._chunk = chunk;
		
		if ( chunk.length > 0 && result ) {
			_NO_REPEAT_TIMEOUT(___EAT_DATA.bind(this), 0);
		}
	}
	function ___EAT_MESSAGE(chunk){
		if( chunk.length <= 4 ){ return false; }

		let contentLength = chunk.readUInt32LE(0);
		let next = 4 + contentLength;
		if( chunk.length < next ){ return false; }
		
		let raw = chunk.slice(4, next);
		return {raw, anchor: next};
	}
})();
