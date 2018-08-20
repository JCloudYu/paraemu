# Paraemu - Parallel Emulator #

## For user ##

### Install global package ###

> npm i -g paraemu

### How to use ###

1. Setting config file:

    File structure:
    ```javascript
    {
        "server": undefined | {                    // server config
            "host": @string,
            "port": @int
        },
        "remote": undefined | {                    // client config
            "host": @string,
            "port": @int
        },
        "processes" : [
            {
                "tag": undefined | @string,
                "root": undefined | @string,        // root path
                "script": @string,                  // execute file name
                "args": undefined | [ @any, ... ],  // node js command line arguments
                "env": undefined | [ @string, ... ] // node js command line options
            },
            ...
        ]
    }
    ```

    * Script execute path is `./${root}/${script}`.

    Server Example:
    ```javascript
    // ./server-config.json
    {
        "server": {
            "host":"127.0.0.1",
            "port":23410
        },
        "processes" : [
            {
                "tag": "proc1",
                "root": "./default/sub1",
                "script": "./worker1.js",
                "args": [ 1, 2, "string", false ]
            }
        ]
    }
    ```

    Client Example:
    ```javascript
    // ./client-config.json
    {
        "remote": {
            "host":"127.0.0.1",
            "port":23410
        },
        "processes": [
            {
                "script": "./default/sub2/worker2.js"
            },
            {
                "root": "./default/sub3",
                "script": "./worker3.js",
                "env": [ "--experimental-worker" ]
            }
        ]
    }
    ```

2. Write script file:

    Example:
    ```javascript
    // ./main_thread.js
    const pemu = require('paraemu');

    // paraemu default event
    // tasks-ready: all tasks ready will trigger it
    pemu.on('tasks-ready', () => {
        // usage is equal to 'new Worker(filename[, options])' in Worker Threads
        let worker = pemu.job('./worker.js', { workerData: { msg: 'Hello world!' } });
    });
    ```

    ```javascript
    // ./worker.js
    const pemu = require('paraemu');

    let cb = () => {
        const { msg } = pemu.args;                           // get workerData
        console.log(msg);
    };

    // event handler
    pemu.on('register_event_name', cb);                      // register event
    pemu.once('register_once_event_name', cb);               // register event once
    pemu.off('remove_event_name', cb);                       // remove event
    pemu.emit('trigger_event_name', [arg1], [arg2], [...]);  // trigger event
    ```

    * Events will trigger across processes.
    * Please refer to [Event Emitter](https://nodejs.org/api/events.html) for other usages.

3. Run command line:
    > paraemu ./config.json

---

## For maintainer ##

### Install project ###

* Clone project:
    > git clone \<project-url\>

* Install dependency package:
    > npm install

### Build and Run ###

* Run test (use node):
    > node ./paraemu-cli.js ./test/config.sample.json --arg1 --arg2

* Run test (use npm):
    > npm run test
