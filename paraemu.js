(async () => {
    'use strict';

    const fs = require('fs');
    const path = require('path');
    const events = require('events');
    const cluster = require('cluster');

    const procQueue = [];
    const exports = new events.EventEmitter();
    const oriEmmiter = exports.emit;

    exports.emit = (event, ...args) => {
        console.log('emit');
        // send from worker to master
        process.send({ event, args });
    };
    module.exports = exports;

    if (cluster.isMaster) {
        const eventHandler = (worker) => {
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
                eventHandler(worker);
            });

            // master receive message form worker
            cluster.on('message', (worker, msg) => {
                procQueue.forEach((proc) => {
                    proc.send(msg);
                });
            });
        }
    }
    else {
        process.on('message', (msg) => {
            console.log('message');
            const { event, args } = msg;
            oriEmmiter.call(exports, event, ...args);
        });
    }
})();
