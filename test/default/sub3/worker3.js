(() => {
    'use strict';

    const { Worker } = require('worker_threads');
    const env = JSON.parse(process.env.paraemu);
    const thread_cnt = 2;
    let finish_cont = 0;

    for (let i = 1; i <= thread_cnt; i++) {
        const wt_worker_args = {
            group_id: env.group,
            process_id: env.id,
            thread_id: i
        };
        const wt_worker = new Worker('./wt_worker.js', { workerData: wt_worker_args });

        wt_worker.on('message', (msg) => {
            console.log(msg);

            ++finish_cont;
            if (finish_cont === thread_cnt) {
                console.log('[WORKER3] exiting!');
                process.exit(0);
            }
        });
    }
})();
