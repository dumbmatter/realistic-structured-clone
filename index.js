'use strict';

var util = require('util');
var isPlainObject = require('lodash.isplainobject');

function DataCloneError(message) {
    this.name = this.constructor.name;
    this.message = message;
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, DataCloneError);
    }
}
util.inherits(DataCloneError, Error);

// http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm
function structuredClone(input, memory) {
    memory = memory !== undefined ? memory : new Map();

    if (memory.has(input)) {
        return memory.get(input);
    }

    var type = typeof input;
    var output;

    if (type === 'string' || type === 'number' || type === 'boolean' || type === 'undefined' || input === null) {
        return input;
    }

    var deepClone = 'none';

    if (input instanceof Boolean || input instanceof Number || input instanceof String || input instanceof Date) {
        output = new input.constructor(input.valueOf());
    } else if (input instanceof RegExp) {
        output = new RegExp(input.source, input.flags);
    } else if (input instanceof ArrayBuffer) {
        output = input.slice();
    } else if (ArrayBuffer.isView(input)) {
        var outputBuffer = structuredClone(input.buffer, memory);
        if (input instanceof DataView) {
            output = new DataView(outputBuffer, input.byteOffset, input.byteLength);
        } else {
            output = new input.constructor(outputBuffer, input.byteOffset, input.length);
        }
        // Supposed to also handle Blob, FileList, ImageData, ImageBitmap, but fuck it
    } else if (Array.isArray(input)) {
        output = new Array(input.length);
        deepClone = 'own';
    } else if (isPlainObject(input)) {
        output = {};
        deepClone = 'own';
    } else if (input instanceof Map) {
        output = new Map();
        deepClone = 'map';
    } else if (input instanceof Set) {
        output = new Set();
        deepClone = 'set';
    } else {
        throw new DataCloneError();
    }

    memory.set(input, output);

    if (deepClone === 'map') {
        input.forEach(function (v, k) {
            output.set(structuredClone(k, memory), structuredClone(v, memory));
        });
    } else if (deepClone === 'set') {
        input.forEach(function (v) {
            output.add(structuredClone(v, memory));
        });
    } else if (deepClone === 'own') {
        for (var name in input) {
            if (input.hasOwnProperty(name)) {
                var sourceValue = input[name];
                var clonedValue = structuredClone(sourceValue, memory);
                output[name] = clonedValue;
            }
        }
    }

    return output;
}

module.exports = structuredClone;
