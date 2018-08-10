(async () => {
    'use strict';

    const fs = require('fs');
    const path = require('path');
    const events = require('events');
    const cluster = require('cluster');

    const eventEmitter = new events.EventEmitter();
    const procQueue = [];
    const exports = {
        on: (event, cb) => {
            console.log('on');
            eventEmitter.on(event, cb);
        },
        off: (event, cb) => {
            console.log('off');
            eventEmitter.removeListener(event, cb);
        },
        emit: (event, ...args) => {
            console.log('emit');
            // send from worker to master
            eventEmitter.send({ event, args });
        }
    };
    module.exports = exports;

    const workerEventHandler = (worker) => {
        worker.on('online', () => {
            console.log('online');
            procQueue.push(worker);
        });

        // If process disconnected, remove worker in procQueue
        worker.on('disconnect', () => {
            console.log('disconnect');
            const removeIdx = procQueue.indexOf(worker);
            if (removeIdx !== -1) {
                procQueue.splice(removeIdx, 1);
            }
        });

        worker.on('message', (msg) => {
            console.log('message');
            const { event, args } = msg;
            eventEmitter.emit(event, ...args);
        });
    };

    if (process.isCLI) {
        const relFilePath = process.argv[0];
        const absFilePath = path.resolve(relFilePath);
        const opts = process.argv.slice(1);

        // parse config file
        const cfg = JSON.parse(fs.readFileSync(absFilePath, 'utf8'));
        const { process: cfgProcs } = cfg;

        cfgProcs.forEach((cfgProc) => {
            // get absolute directory path
            const relProcPath = cfgProc['working-dir'];
            const absProcPath = path.resolve(relProcPath);

            cluster.setupMaster({
                cwd: absProcPath,
                exec: cfgProc.script,
                args: cfgProc.args || []
            });
            const worker = cluster.fork();
            workerEventHandler(worker);
        });

        // master receive message form worker
        cluster.on('message', (worker, msg) => {
            procQueue.forEach((proc) => {
                proc.send(msg);
            });
        });
    }
})();
