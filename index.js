require('core-js/fn/object/values');
var DOMException = require('domexception');
var Typeson = require('typeson');
var structuredCloningThrowing = require('typeson-registry/dist/presets/structured-cloning-throwing');

// http://stackoverflow.com/a/33268326/786644 - works in browser, worker, and Node.js
var globalVar = typeof window !== 'undefined' ? window : 
   typeof WorkerGlobalScope !== 'undefined' ? self :
   typeof global !== 'undefined' ? global :
   Function('return this;')();

if (!globalVar.DOMException) {
    globalVar.DOMException = DOMException;
}

var TSON = new Typeson().register(structuredCloningThrowing);

function realisticStructuredClone(obj) {
    return TSON.parse(TSON.stringify(obj));
}

module.exports = realisticStructuredClone;
