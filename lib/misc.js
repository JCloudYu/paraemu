(()=>{
	"use strict";
	
	const crypto = require( 'crypto' );
	const base32 = require( './base32' );
	
	const __SET_TIMEOUT	  = setTimeout;
	const __CLEAR_TIMEOUT = clearTimeout;
	
	module.exports = {
		GenRandomID:(length)=>{
			return base32(crypto.randomBytes(length));
		},
		UniqueTimeout:()=>{
			let hTimeout = null;
			return (...args)=>{
				if ( hTimeout !== null ) {
					try{ __CLEAR_TIMEOUT(hTimeout); } catch(e){}
				}
				
				return (hTimeout = __SET_TIMEOUT(...args));
			};
		},
		SetConstant:(target, props, hidden=false)=>{
			for(let prop in props) {
				if ( !props.hasOwnProperty(prop) ) continue;
				
				Object.defineProperty(target, prop, {
					value:props[prop],
					configurable:false, writable:false, enumerable:!hidden
				})
			}
			
			return target;
		}
	};
})();
