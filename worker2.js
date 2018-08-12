(() => {
    'use strict';

	const pemu = require('./paraemu.js');

    console.log('It is worker2');
    pemu.on('event1', (...args) => {
        console.log('worker2 event1');
    });
    
    process.exit(0);
})();
