(async () => {
    'use strict';

    // Worker Threads Worker
    const { parentPort, workerData } = require('worker_threads');

    parentPort.postMessage(`[WORKER3] group_id: ${workerData.group_id}, process_id: ${workerData.process_id}, thread_id: ${workerData.thread_id}`);
})();
