(async () => {
    'use strict';

    const pemu = require('./paraemu.js');

    console.log('It is worker1');
    pemu.on('event1', (msg) => {
        console.log('hello world');
        console.log(msg);
    });
    pemu.emit('event1', 123, 'abc', [111, 'aaa']);
})();
