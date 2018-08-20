(() => {
    'use strict';

	const pemu = require( '../../../paraemu' );
    const { Worker } = require('worker_threads');
    const thread_cnt = 2;
    let finish_cnt = 0;

    for (let i = 1; i <= thread_cnt; i++) {
        const wt_worker_args = {
            group_id: pemu.groupId,
            process_id: pemu.taskId,
            thread_id: i
        };
        const wt_worker = new Worker('./wt_worker.js', { workerData: wt_worker_args });

        wt_worker.on('message', (msg) => {
            console.log(msg);

            ++finish_cnt;
            if (finish_cnt === thread_cnt) {
                console.log('[WORKER3] exiting!');
                process.exit(0);
            }
        });
    }
})();
