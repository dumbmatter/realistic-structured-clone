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

// https://html.spec.whatwg.org/multipage/infrastructure.html#structuredclone
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

    if (type === 'symbol') {
        throw new DataCloneError('Value could not be cloned: ' + input.toString() + ' is a Symbol');
    }

    var deepClone = 'none';

    if (input instanceof Boolean || input instanceof Number || input instanceof String || input instanceof Date) {
        output = new input.constructor(input.valueOf());
    } else if (input instanceof RegExp) {
        output = new RegExp(input.source, input.flags);
    } else if (input instanceof ArrayBuffer) {
        output = input.slice();
    } else if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(input)) {
        var outputBuffer = structuredClone(input.buffer, memory);
        if (input instanceof DataView) {
            output = new DataView(outputBuffer, input.byteOffset, input.byteLength);
        } else {
            output = new input.constructor(outputBuffer, input.byteOffset, input.length);
        }
    } else if (input instanceof Map) {
        output = new Map();
        deepClone = 'map';
    } else if (input instanceof Set) {
        output = new Set();
        deepClone = 'set';
    } else if (typeof Blob !== 'undefined' && input instanceof Blob) {
        output = input.slice(0, input.size, input.type);
    } else if (Array.isArray(input)) {
        output = new Array(input.length);
        deepClone = 'own';
    } else if (typeof input === 'function') {
        throw new DataCloneError('Object could not be cloned: ' + input.name + ' is a function');
    } else if (!isPlainObject(input)) {
        // This is way too restrictive. Should be able to clone any object that isn't
        // a platform object with an internal slot other than [[Prototype]] or [[Extensible]].
        // But need to reject all platform objects, except those whitelisted for cloning
        // (ie, those with a [[Clone]] internal method), and this errs on the side of caution
        // for now.

        // Supposed to also handle FileList, ImageData, ImageBitmap, but fuck it
        throw new DataCloneError();
    } else {
        output = {};
        deepClone = 'own';
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
