# Paraemu - Parallel Emulator #

## For user ##

### Install global package ###

> npm i -g paraemu

### How to use ###

1. Setting config file:
    ```javascript
    // ./config.json
    {
        "processes" : [
            {
                "tag": "proc1",
                "root": "./sub1",
                "script": "./worker1.js",
                "args": [ 1, 2, "string", false ]
            },
            {
                "script": "./sub2/worker2.js"
            },
            ...
        ]
    }
    ```
    Note: Only "script" is necessary.

2. Write  script file:
    ```javascript
    // ./worker1.js
    const pemu = require('paraemu');
    // Event will cross processes
    pemu.on('register_event_name', cb1);                     // register event
    pemu.off('remove_event_name', cb2);                      // remove event
    pemu.emit('trigger_event_name', [arg1], [arg2], [...]);  // trigger event
    ```
    Please refer to [Event Emitter](https://nodejs.org/api/events.html) for other usages.

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
