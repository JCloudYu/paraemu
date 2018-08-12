(() => {
    'use strict';

    const pemu = require('./paraemu.js');

   console.log({
    	who: 'worker1',
    	id: pemu.id,
    	tag: pemu.tag,
    	args: pemu.args
    });
    pemu.on('event1', (event, ...args)=>{
        console.log({
        	event,
        	me: pemu.id,
        	who:'worker1',
        	args
        });
    });
    
    setTimeout(()=>{
    	 pemu.emit('event1', 123, 'abc', [111, 'aaa']);
    }, 2000);
    
    setTimeout(()=>{
    	process.exit(0);
    }, 5000);
})();
