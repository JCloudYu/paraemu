(()=>{
	"use strict";
	
	const crypto = require( 'crypto' );
	const base32 = require( './base32' );
	
	global.GenRandomID=(length)=>{
		return base32(crypto.randomBytes(length));
	};
	
	Object.setConstant = (target, props, hidden=false)=>{
		for(let prop in props) {
			if ( !props.hasOwnProperty(prop) ) continue;
			
			Object.defineProperty(target, prop, {
				value:props[prop],
				configurable:false, writable:false, enumerable:!hidden
			})
		}
		
		return target;
	};
})();
