(()=>{
	"use strict";
	
	const path			 = require( 'path' );
	const fs			 = require( 'fs' );
	const {EventEmitter} = require( 'events' );
	
	const GEN_RANDOM_ID = GenRandomID.bind(null, 10);
	const TASK_MANAGER = require( './task-manager' );
	const EXPORTED = module.exports = new EventEmitter();
	Object.setConstant(EXPORTED, {groupId:GEN_RANDOM_ID()});
	
	const SESSION_INFO = { CONFIG:null, DESCRIPTOR:null, DEFAULT_DIR:null };
	
	
	
	// region [ Export APIs for developers ]
	const INTERNAL_OFF = EXPORTED.removeAllListeners.bind(EXPORTED);
	const INTERNAL_EVENT_FORMAT = /^--paraemu-e-.*$/;
	
	Object.defineProperty(EXPORTED, '__emit', {
		value:EXPORTED.emit.bind(EXPORTED), writable:false, configurable:false, enumerable:false
	});
	EXPORTED.send=(target, event, ...args)=>{
		const eventInfo = {
			type:paraemu.SYSTEM_EVENT.CUSTOM_EVENT,
			target:target,
			sender:EXPORTED.groupId,
			event:event,
			eventData:args
		};
	
		EXPORTED.__emit( paraemu.SYSTEM_HOOK.PARAEMU_EVENT, eventInfo )
	};
	EXPORTED.emit=(event, ...args)=>{
		EXPORTED.send( null, event, ...args );
	};
	EXPORTED.local=(event, ...args)=>{
		EXPORTED.send( EXPORTED.groupId, event, ...args );
	};
	EXPORTED.removeAllListeners=(eventName)=>{
		if ( INTERNAL_EVENT_FORMAT.test(eventName) ) { return; }
		return INTERNAL_OFF(eventName);
	};
	EXPORTED.load=(confPath, options={})=>{
		// ISSUE: Remember prevent developers from loading again before the termination of existing processes...
		
		
		
		const MODULE_PATH = options.module_paths || [];
		const DESCRIPTOR  = SESSION_INFO.DESCRIPTOR  = path.resolve(confPath);
		const DEFAULT_DIR = SESSION_INFO.DEFAULT_DIR = path.dirname(DESCRIPTOR);
		const CONFIG	  = SESSION_INFO.CONFIG		 = JSON.parse(fs.readFileSync(DESCRIPTOR, 'utf8'));
		const {processes:PROCESSES=[]} = CONFIG;
		
		PROCESSES.forEach((process)=>{
			if ( process.disabled ) { return; }
		
			const workerId = GEN_RANDOM_ID();
			const {script, root=null, tag=workerId, args=[], env:argv=[]} = process;
			
		
			TASK_MANAGER.instantiate({
				cwd:path.resolve(DEFAULT_DIR, root||''),
				script:path.resolve(DEFAULT_DIR, root||'', script),
				module_paths:MODULE_PATH,
				taskId:workerId,
				groupId:EXPORTED.groupId,
				tag, args, argv
			});
		});
		
		
		
		// Prepare server & remote info
		CONFIG.server = options.server || CONFIG.server || null;
		CONFIG.remote = options.remote || CONFIG.remote || null;
	};
	// endregion
	
	// region [ Core events processing logic ]
	EXPORTED
	.on( paraemu.SYSTEM_HOOK.PARAEMU_EVENT, (eventInfo, source=null)=>{
		// Parse event target information
		let t_group, t_task, t_inst;
		if ( !eventInfo.target ) {
			([t_group, t_task, ...t_inst] = [null, null, null]);
		}
		else {
			([t_group=null, t_task=null, ...t_inst] = eventInfo.target.split('-'));
		}
		
		
		// Emit Local Events
		if ( !t_group || t_group === EXPORTED.groupId ) {
			TASK_MANAGER.sendMessage(t_task, eventInfo);
		}
		
		
		
		// Emit Network Events
		if ( !t_group || t_group !== EXPORTED.groupId ) {
			EXPORTED.__emit( '--paraemu-e-network-event', t_group, eventInfo, source );
		}
	});
	// endregion
	
	// region [ Handle task manager's events ]
	TASK_MANAGER
	.on( 'tasks-online', ()=>{
		EXPORTED.__emit( '--paraemu-e-kernel-online', SESSION_INFO.CONFIG );
	})
	.on( 'tasks-ready', ()=>{
		EXPORTED.__emit( '--paraemu-e-kernel-ready', SESSION_INFO.CONFIG );
		EXPORTED.send(EXPORTED.groupId, 'tasks-ready');
	})
	.on( 'tasks-finished', ()=>{
		EXPORTED.__emit( 'tasks-finished' );
	})
	.on( 'core-state', (stateInfo)=>{
		EXPORTED.__emit( 'kernel-state', stateInfo );
	})
	.on( 'core-data', (worker, data)=>{
		EXPORTED.__emit( 'worker-data', { id:worker._id, tag:worker._tag, data });
	})
	.on( 'core-event', (eventInfo)=>{
		Object.assign(eventInfo, {
			sender: [EXPORTED.groupId, eventInfo.sender].join('-'),
		});
	
		EXPORTED.__emit( paraemu.SYSTEM_HOOK.PARAEMU_EVENT, eventInfo );
	});
	// endregion
})();
