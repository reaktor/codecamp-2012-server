var assert = require('assert'),
    util = require('util'),
    _ = require('underscore');

function contains(messages, expected) {
    return _.any(_.map(messages, function(message) {
        return _.isEqual(message, expected)
    }))
}

// [T] -> T -> Unit
function assertContains(xs, x) {
    assert.isTrue(contains(xs, x), util.inspect(xs) + "\nDOES NOT CONTAIN\n" + util.inspect(x));
}

exports.assertContains = assertContains