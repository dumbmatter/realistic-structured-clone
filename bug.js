/*
Run this in a web browser console:

    var shared = new ArrayBuffer(7);
    var obj = {
        wrapper1: new Uint8Array(shared),
        wrapper2: new Uint16Array(shared, 2, 2)
    };
    obj.wrapper1[0] = 1;
    obj.wrapper2[1] = 0xffff;

    function clone(x) {
        return new Promise(function (resolve, reject) {
            window.addEventListener('message', function(e) {
                resolve(e.data);
            });
            window.postMessage(x, "*");
        });
    }

    clone(obj).then(function (obj2) {
        console.log(obj2.wrapper1.buffer === obj2.wrapper2.buffer);
    });

The output should be "true".

Then run this script in Node.js and the output is "false".
*/

var shared = new ArrayBuffer(7);
var obj = {
    wrapper1: new Uint8Array(shared),
    wrapper2: new Uint16Array(shared, 2, 2)
};
obj.wrapper1[0] = 1;
obj.wrapper2[1] = 0xffff;

// This just uses the structured-cloning-throwing preset
var structuredClone = require('./index');

var obj2 = structuredClone(obj);

console.log(obj2.wrapper1.buffer === obj2.wrapper2.buffer);
