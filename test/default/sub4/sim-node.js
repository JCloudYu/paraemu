(()=>{
	"use strict";
	
	module.exports=(ctrl)=>{
		const RIDDLE_POOL = {};
		const RIDDLE_QUEUE = [];
		let TIMEOUT = null;
		
		ctrl.on( 'assign-riddle', (e, key, riddle)=>{
			RIDDLE_POOL[key] = riddle;
			RIDDLE_QUEUE.push(key);
		});
		
		ctrl.on( 'riddle-solved', (e, key)=>{
			let idx = RIDDLE_QUEUE.indexOf(key);
			if ( idx >= 0 ) {
				RIDDLE_QUEUE.splice(idx, 1);
			}
			
			delete RIDDLE_POOL[key];
		});
		
		ctrl.on( 'clean-up', ()=>{
			if ( TIMEOUT ) {
				clearTimeout(TIMEOUT);
				TIMEOUT=null;
			}
			
			ctrl.local( 'finalized' );
		});
		
		function ___SOLVE_RIDDLE(){
			if ( RIDDLE_QUEUE.length > 0 ) {
				let key = RIDDLE_QUEUE.shift();
				let riddle = RIDDLE_POOL[key];
				
				
				let sum = 0;
				for ( let i=0; i<riddle; i++ ) { sum += i; }
				ctrl.emit( 'riddle-solved', key, sum );
			}
			
			TIMEOUT = setTimeout(___SOLVE_RIDDLE, (Math.random() * 2000 + 500)|0)
		}
		
		TIMEOUT = setTimeout(___SOLVE_RIDDLE, (Math.random() * 2000 + 500)|0);
	};
})();
