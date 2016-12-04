'use strict';

var assert = require('assert');
var structuredClone = require('..');

function assertSameEntries(xcontainer, ycontainer) {
    var x = xcontainer.entries();
    var y = ycontainer.entries();
    var xentry = x.next();
    var yentry = y.next();
    while (xentry.done === false) {
        assert.deepEqual(xentry.value[0], yentry.value[0]);
        assert.deepEqual(xentry.value[1], yentry.value[1]);
        xentry = x.next();
        yentry = y.next();
    }
    assert.equal(yentry.done, true);
}

function confirmContainerWorks(x) {
    var y = structuredClone(x);
    assertSameEntries(x, y);
}

describe('Valid Input', function () {
    var confirmWorks = function (x) {
        if (x !== x) { // Special case for NaN
            assert(structuredClone(x) !== structuredClone(x));
        } else if (x instanceof RegExp) {
            var y = structuredClone(x);
            assert.equal(x.source, y.source);
            assert.equal(x.flags, y.flags);
            assert.equal(x.global, y.global);
            assert.equal(x.ignoreCase, y.ignoreCase);
            assert.equal(x.multiline, y.multiline);
            assert.equal(x.unicode, y.unicode);
            assert.equal(x.sticky, y.sticky);
        } else {
            assert.deepEqual(structuredClone(x), x);
        }
    };

    it('Primitive Types', function () {
        confirmWorks('string');
        confirmWorks(6);
        confirmWorks(NaN);
        confirmWorks(true);
        confirmWorks(undefined);
        confirmWorks(null);
    });

    it('Date', function () {
        confirmWorks(new Date());
        confirmWorks(new Date('2015-05-06T23:27:37.535Z'));
    });

    it('RegExp', function () {
        confirmWorks(new RegExp('ab+c', 'i'));
        confirmWorks(/ab+c/i);
        confirmWorks(new RegExp('de+f', 'gm'));
        confirmWorks(new RegExp('gh.*i', 'yu'));
    });

    it('ArrayBuffer', function () {
        var ab = new ArrayBuffer(5);
        var ab2 = structuredClone(ab);
        assertSameEntries(new Int8Array(ab), new Int8Array(ab2));

        var shared = new ArrayBuffer(7);
        var obj = {
            wrapper1: new Uint8Array(shared),
            wrapper2: new Uint16Array(shared, 2, 2)
        };
        obj.wrapper1[0] = 1;
        obj.wrapper2[1] = 0xffff;
        var obj2 = structuredClone(obj);
        assert(obj2.wrapper1.buffer === obj2.wrapper2.buffer);
        assertSameEntries(obj.wrapper1, obj2.wrapper1);

        confirmContainerWorks(new Int16Array(7));
        confirmContainerWorks(new Int16Array(new ArrayBuffer(16), 2, 7));
        confirmWorks(new DataView(new ArrayBuffer(16), 3, 13));
    });

    it('Array', function () {
        confirmContainerWorks([1, 2, 5, 3]);
        confirmContainerWorks(['a', 'g', 2, true, null]);
    });

    it('Plain Object', function () {
        confirmWorks({
            a: 1,
            b: 2,
            c: true,
            d: undefined,
            e: 'f'
        });
    });

    it('Map', function () {
        confirmContainerWorks(new Map([['a', 1], [{}, 2], [{}, 5], [0, 3]]));
        confirmContainerWorks(new Map());
    });

    it('Set', function () {
        confirmContainerWorks(new Set(['a', {}, {}, 0]));
        confirmContainerWorks(new Set());
    });

    it('Circular Reference', function () {
        var circular = [];
        circular.push(circular);

        // Can't use confirmWorks because deepEqual can't handle it
        var circular2 = structuredClone(circular);
        assert.equal(typeof circular, typeof circular2);
        assert.equal(circular.length, circular2.length);
        assert.equal(circular, circular[0]);
        assert.equal(circular2, circular2[0]);
    });

    it('Big Nested Thing', function () {
        confirmWorks({
            a: [1, 2, new Date()],
            b: {
                c: {
                    d: 1,
                    e: true,
                    f: [1, 'a', undefined, {g: 6, h: 10}]
                }
            }
        });
    });

    it('getter', function () {
        var value;
        var obj = {
            get ref1() {return value;},
            get ref2() {return value;}
        };
        value = obj;
        assert.throws(function () {
            obj.ref1 = 1;
        });
        assert.equal(obj, obj.ref1);
        assert.equal(obj, obj.ref2);

        var obj2 = structuredClone(obj);
        assert.equal(obj2, obj2.ref1);
        assert.equal(obj2, obj2.ref2);
        assert.doesNotThrow(function () {
            obj2.ref1 = 1;
        });
        assert.equal(obj2.ref1, 1);
        assert.equal(obj2, obj2.ref2);
    });

/* disabled tests that don't pass yet
    it('POD class', function () {
        var MyClass = function () {
            this.x = 'x';
        }
        confirmWorks(new MyClass());
    });

    it('class with method', function () {
        var MyClass = function () {
            this.x = 'y';
        }
        MyClass.prototype = {method1() {}};
        var obj = new MyClass();
        assert.equal(typeof obj.method1, 'function');
        confirmWorks(obj);
    });
*/
});

describe('Invalid Input', function () {
    var confirmFails = function (x) {
        assert.throws(function () {
            structuredClone(x);
        }, /DataCloneError/);
    };

    it('Function', function () {
        confirmFails(function () {});
    });

    it('Error', function () {
        confirmFails(new Error());
    });

    it('WeakMap', function () {
        confirmFails(new WeakMap());
    });

    it('WeakSet', function () {
        confirmFails(new WeakSet());
    });

    it('throwing getter', function () {
        var x = {
            get bad() {throw new RangeError();}
        };
        assert.throws(function () {
            structuredClone(x);
        }, RangeError);
    });
});
