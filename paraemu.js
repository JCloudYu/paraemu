(async () => {
    'use strict';

    const events = require('events');
    const eventEmitter = new events.EventEmitter();
    const procQueue = [];
    const exports = {
        on: (event, cb) => {
            eventEmitter.on(event, cb);
        },
        off: (event, cb) => {
            eventEmitter.removeListener(event, cb);
        },
        emit: (event, ...args) => {
            procQueue.forEach((proc) => {
                proc.send({ event, args });
            });
        }
    };
    module.exports = exports;

    const workerEventHandler = (worker) => {
        worker.on('fork', () => {
            procQueue.push(worker);
        });

        // if process disconnected, remove worker in procQueue
        worker.on('disconnect', () => {
            const removeIdx = procQueue.indexOf(worker);
            if (removeIdx !== -1) {
                procQueue.splice(removeIdx, 1);
            }
        });

        worker.on('message', (msg) => {
            const { event, args } = msg;
            eventEmitter.emit(event, ...args);
        });
    };

    const fs = require('fs');
    const path = require('path');
    const cluster = require('cluster');
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
    }
})();
