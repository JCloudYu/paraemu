(() => {
    'use strict';

	const pemu = require('./paraemu.js');

    console.log({
    	who: 'worker2',
    	id: pemu.id,
    	tag: pemu.tag,
    	args: pemu.args
    });
    pemu.on('event1', (event, ...args) => {
        console.log({
        	event,
        	me: pemu.id,
        	who:'worker2',
        	args
        });
    });
    
   setTimeout(()=>{
    	process.exit(0);
    }, 5000);
})();
