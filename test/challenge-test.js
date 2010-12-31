var vows = require('vows'),
    assert = require('assert'),
    util = require('util'),
    Challenge = require('../src/challenge').Challenge,
    FailedResult = require('../src/result').FailedResult,
    AcceptedResult = require('../src/result').AcceptedResult

var challenge = Challenge({
    "name": "Eka",
    "timeout":50,
    "contents":[
        {"id":1,"weight":10,"value":100},
        {"id":2,"weight":100,"value":200}
    ],
    "capacity":99
});

var resultValidation = {
    'When validating result' : {
        'Accepts correct answer' : function() {
            assert.deepEqual(challenge.resultFor(["1"]), new AcceptedResult(100, 10));
        },
        'Fails overweight result' : function() {
            assert.deepEqual(challenge.resultFor(["1", "2"]), new FailedResult());
        },
        'Fails LOL result' : function() {
            assert.deepEqual(challenge.resultFor("LOL"), new FailedResult());
        },
        'Fails result containing duplicates' : function () {
            assert.deepEqual(challenge.resultFor(["1", "1"]), new FailedResult());
        },
        'Fails result containing unknown items' : function () {
            assert.deepEqual(challenge.resultFor(["1", "3"]), new FailedResult());
        }
    }
}
vows.describe('Challenge result validation').addBatch(resultValidation).export(module);