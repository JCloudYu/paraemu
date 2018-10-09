(() => {
    'use strict';

    const EventEmitter = require('events');
    const { Socket } = require('net');

    const _WEAK_REL = new WeakMap();
    class jsonSocket extends EventEmitter {
        constructor(socket=null, serverInst=null) {
            super();

            socket = socket || new Socket();
            _WEAK_REL.set(this, {
                _parent: serverInst,
                _socket: socket,
                _connected: false,
                _error: null,
                _chunk: Buffer.alloc(0)
            });

            socket
            .on('connect', ___HANDLE_CONNECT.bind(this))
            .on('close', ___HANDLE_CLOSE.bind(this))
            .on('error', ___HANDLE_ERROR.bind(this))
            .on('data', ___HANDLE_DATA.bind(this));
        }

        sendMessage(data) {
            data = JSON.stringify(data);
            const { _socket } = _WEAK_REL.get(this);
            const buffer = Buffer.from(data);
            const header = Buffer.alloc(1 + 4);
            header[0] = 0;
            header.writeUInt32LE(buffer.length, 1);
            _socket.write(Buffer.concat([header, buffer]));
        }
    }
    module.exports = jsonSocket;

    function ___HANDLE_CONNECT() {
        const _PRIVATES = _WEAK_REL.get(this);
        _PRIVATES._connected = true;

        _PRIVATES._socket.emit('connected');
    }
    
    function ___HANDLE_CLOSE(withError) {
        const _PRIVATES = _WEAK_REL.get(this);
        _PRIVATES._connected = false;

        let error = withError ? (_PRIVATES._error || null) : null;
        _PRIVATES._socket.emit('disconnected', error);
    }

    function ___HANDLE_ERROR(error) {
        const _PRIVATES = _WEAK_REL.get(this);
        _PRIVATES._connected = false;
        _PRIVATES._error = error;
        _PRIVATES._socket.emit('error', error);
    }

    function ___HANDLE_DATA(chunk) {
        const _PRIVATES = _WEAK_REL.get(this);
        _PRIVATES._chunk = Buffer.concat([_PRIVATES._chunk, chunk]);

        let result = ___EAT_MESSAGE(chunk);
        if (!result) return;

        let { event, raw: rawData, anchor } = result;
        _PRIVATES._chunk = _PRIVATES._chunk.slice(anchor);
        _PRIVATES._socket.emit(event, JSON.parse(rawData.toString()));
    }
    
    function ___EAT_MESSAGE(chunk) {
        if (chunk.length <= 0) { return false; }

        let result, content, anchor = 1;
        result = ___EAT_EVENT_DATA(chunk, anchor);
        if (!result) { return false; }

        ({ content, anchor } = result);
        return { event: 'message', raw: content, anchor };
    }

    function ___EAT_EVENT_DATA(buff, anchor) {
        if (buff.length < (anchor + 4)) { return false; }

        let contentLength = buff.readUInt32LE(anchor);
        anchor += 4;
        if (buff.length < (anchor + contentLength)) { return false; }

        let content = buff.slice(anchor, anchor+contentLength);
        anchor += contentLength;
        return { content, anchor };
    }
})();
