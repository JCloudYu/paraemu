/**
 * Project: 0015.parallel-emulator
 * File: set_timeout_once
 * Author: JCloudYu
 * Create Date: Aug. 18, 2018 
 */
(()=>{
	"use strict";
	
	const __SET_TIMEOUT		= ((global||window).setTimeout||__DO_NOTHING);
	const __CLEAR_TIMEOUT	= ((global||window).clearTimeout||__DO_NOTHING);
	__SET_TIMEOUT.unique=()=>{
		let hTimeout = null;
		return (...args)=>{
			if ( hTimeout !== null ) {
				try{ __CLEAR_TIMEOUT(hTimeout); } catch(e){}
			}
			
			return (hTimeout = __SET_TIMEOUT(...args));
		};
	};
	
	function __DO_NOTHING(){}
})();
