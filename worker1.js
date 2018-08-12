(() => {
    'use strict';

    const pemu = require('./paraemu.js');

    console.log('It is worker1');
    pemu.on('event1', (...args) => {
        console.log('worker1: event1');
    });
    
    setTimeout(()=>{
    	 pemu.emit('event1', 123, 'abc', [111, 'aaa']);
    }, 2000);
    
    setTimeout(()=>{
    	process.exit(0);
    }, 10000);
})();
