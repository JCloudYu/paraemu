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
                "root": "./content/sub1",
                "script": "./worker1.js",
                "args": [ 1, 2, "string", false ]
            },
            {
                "script": "./default/sub2/worker2.js"
            },
            {
                "root": "./content/sub3",
                "script": "./worker3.js",
                "env": [ "--experimental-worker", "--inspect-brk" ]
            }
        ]
    }
    ```

    Server Example:
    ```javascript
    // ./test/config.server.json
    {
        "server": {
            "host": "127.0.0.1",
            "port": 23410
        },
        "processes" : [
            {
                "root": "./content/server/proc1",
                "script": "./task.js"
            },
            {
                "root": "./content/server/proc2",
                "script": "./task.js"
            }
        ]
    }
    ```

    Client Example:
    ```javascript
    // ./test/content/config.client2.json
    {
        "remote": {
            "host": "127.0.0.1",
            "port": 23410
        },
        "processes" : [
            {
                "root": "./content/client/proc1",
                "script": "./task.js"
            },
            {
                "root": "./content/client/proc2",
                "script": "./task.js"
            }
        ]
    }
    ```

2. Write script file:

    (1) Basic Example:
    ```javascript
    const pemu = require('paraemu');

    // "...args" is "rest parameter"
    const callback = (e, ...args) => {
        console.log(e.sender);              // sender info
        console.log(e.target);
        console.log(e.type);                // event name
        console.log(args);
    };

    // event handler
    pemu.on('register_event_name', callback);                               // register event
    pemu.once('register_once_event_name', callback);                        // register event once
    pemu.off('remove_event_name', callback);                                // remove event
    pemu.emit('trigger_event_name', [arg1], [arg2], [...]);                 // trigger event (broadcast)
    pemu.local('trigger_event_name', [arg1], [arg2], [...]);                // trigger event (local group)
    pemu.send('target_id', 'trigger_event_name', [arg1], [arg2], [...]);    // trigger event (target group)

    // paraemu default event
    pemu.on('tasks-ready', callback);       // all scripts are ready
    ```

    (2-1) Worker Threads Example (Main Thread Side):
    ```javascript
    // ./main_thread.js
    const pemu = require('paraemu');

    // usage is equal to 'new Worker(filename[, options])' in Worker Threads
    let worker = pemu.job('./worker.js', { workerData: { data: 'Hello world!' } });
    ```

    (2-2) Worker Threads Example (Worker Side):
    ```javascript
    // ./worker.js
    const pemu = require('paraemu');

    const { data } = pemu.args;             // pemu.args = workerData
    console.log(data);
    ```

    (3-1) Server Client Example (Server Side):
    ```javascript
    // ./server.js
    const pemu = require('paraemu');

    // "...args" is "rest parameter"
    const callback = (e, ...args) => {
        console.log(e.sender);              // sender info
        console.log(e.target);
        console.log(e.type);                // event name
        console.log(args);
    };

    pemu.on('tasks-ready', callback);               // all scripts are ready in server side
    pemu.on('net-group-attach', callback);          // anyone of clients connected successfully
    pemu.on('net-group-detach', callback);          // anyone of clients disconnected
    pemu.on('net-connection-ready', callback);      // anyone of clients connected successfully
    pemu.on('net-connection-removed', callback);    // anyone of clients disconnected
    pemu.on('net-connection-error', callback);      // anyone of clients has gone wrong
    ```

    (3-2) Server Client Example (Client Side):
    ```javascript
    // ./client.js
    const pemu = require('paraemu');

    // "...args" is "rest parameter"
    const callback = (e, ...args) => {
        console.log(e.sender);              // sender info
        console.log(e.target);
        console.log(e.type);                // event name
        console.log(args);
    };

    pemu.on('tasks-ready', callback);               // all scripts are ready in client side
    pemu.on('net-group-attach', callback);          // anyone of clients connected successfully
    pemu.on('net-group-detach', callback);          // anyone of clients disconnected
    pemu.on('net-connection-ready', callback);      // your client connected successfully
    pemu.on('net-connection-removed', callback);    // your client disconnected
    pemu.on('net-connection-error', callback);      // your client has gone wrong
    ```

    (4-1) Send and Receive Example (Send Side):
    ```javascript
    // ./send.js
    const pemu = require('paraemu');

    try {
        // If receive.js do not use "respondWith" function, deliver await only wait up to 2 seconds.
        // In there, target_id must be a full id string. 
        let response = await pemu.deliver('target_id', 'trigger_event_name', [arg1], [arg2], [...])
        console.log(response);
    }
    catch (error) {
        // If send.js disconnected to receive.js, deliver await only wait up to 30 seconds and throw exception.
        console.log(error);
    }
    ```

    (4-2) Send and Receive Example (Receive Side):
    ```javascript
    // ./receive.js
    const pemu = require('paraemu');

    pemu.on('trigger_event_name', (e, ...args) => {
        e.respondWith('Receive message');
    });
    ```

    * Please refer to [Event Emitter](https://nodejs.org/api/events.html) for other usages.

3. Run command line:
    > paraemu ./config.json

4. Debug task use Chrome DevTools (Optional):  
    (1) Add "--inspect-brk" in "env" field in config.json  
    (2) Run commend line which is similar to step 3  
    (3) Url set "chrome://inspect" in Chrome  
    (4) Click "Open dedicated DevTools for Node" link  
    (5) Click "Add connection" button  
    (6) Add "localhost:9230" in url field  
        (Debugger listening start from 9230 port in first child process)  
    (7) Press "F5" key to refresh page  
    (8) Click "inspect" link in Remote Target  

5. Debug main task use Chrome DevTools (Optional):  
    (1) Run command line which is different from step 3:  
    > paraemu --inspect-brk ./config

    (2) Url set "chrome://inspect" in Chrome  
    (3) Click"Open dedicated DevTools for Node" link  
    (4) Click "Add connection" button  
    (5) Add "localhost:9229" in url field  
        (Debugger listening start from 9229 port in main process)  
    (6) Press "F5" key to refresh page  
    (7) Click "inspect" link in Remote Target

### Noun Definition ###

* Group: Total workspace in config.
* Task: Each child process in config.
* Job: Detailed work in each child process.

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
