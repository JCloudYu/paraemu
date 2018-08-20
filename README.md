# Paraemu - Parallel Emulator #

## For user ##

### Install global package ###

> npm i -g paraemu

### How to use ###

1. Setting config file:

    File structure:
    ```javascript
    {
        "server": undefined | {                     // server config
            "host": @string,
            "port": @int
        },
        "remote": undefined | {                     // client config
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

    Basic Example:
    ```javascript
    // ./test/config.sample.json
    {
        "processes" : [
            {
                "tag": "proc1",
                "root": "./default/sub1",
                "script": "./worker1.js",
                "args": [ 1, 2, "string", false ]
            },
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

    Server Example:
    ```javascript
    // ./test/config-server.sample.json
    {
        "server": {
            "host":"127.0.0.1",
            "port":23410
        },
        "processes" : [
            {
                "root": "./net/server/proc1",
                "script": "./task.js"
            },
            {
                "root": "./net/server/proc2",
                "script": "./task.js"
            }
        ]
    }
    ```

    Client Example:
    ```javascript
    // ./test/config-client2.sample.json
    {
        "remote": {
            "host":"127.0.0.1",
            "port":23410
        },
        "processes" : [
            {
                "root": "./net/client/proc1",
                "script": "./task.js"
            },
            {
                "root": "./net/client/proc2",
                "script": "./task.js"
            }
        ]
    }
    ```

2. Write script file:

    (1) Basic Example:
    ```javascript
    const pemu = require('paraemu');

    // event handler
    pemu.on('register_event_name', cb);                      // register event
    pemu.once('register_once_event_name', cb);               // register event once
    pemu.off('remove_event_name', cb);                       // remove event
    pemu.emit('trigger_event_name', [arg1], [arg2], [...]);  // trigger event

    // paraemu default event
    pemu.on('tasks-ready', cb);                              // all scripts are ready
    ```

    (2-1) Worker Threads Example (Main Thread Side):
    ```javascript
    // ./main_thread.js
    const pemu = require('paraemu');

    // usage is equal to 'new Worker(filename[, options])' in Worker Threads
    let worker = pemu.job('./worker.js', { workerData: { msg: 'Hello world!' } });
    ```

    (2-2) Worker Threads Example (Worker Side):
    ```javascript
    // ./worker.js
    const pemu = require('paraemu');

    const { msg } = pemu.args;                               // get workerData
    console.log(msg);
    ```

    (3-1) Server Client Example (Server Side):
    ```javascript
    // ./server.js
    const pemu = require('paraemu');

    pemu.on('tasks-ready', cb);                              // all scripts are ready in server side
    pemu.on('net-group-attach', cb);                         // client connection succeeded
    pemu.on('net-group-detach', cb);                         // client disconnected
    ```

    (3-2) Server Client Example (Client Side):
    ```javascript
    // ./client.js
    const pemu = require('paraemu');

    pemu.on('tasks-ready', cb);                              // all scripts are ready in client side
    pemu.on('net-group-attach', cb);                         // client connection succeeded
    pemu.on('net-group-detach', cb);                         // client disconnected
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
