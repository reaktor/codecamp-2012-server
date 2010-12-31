/**
 * Test for the bookkeeper.
 */
var vows = require('vows'),
        assert = require('assert'),
        util = require('util'),
        BookKeeper = require('../src/bookkeeper').BookKeeper;
var bookkeeper = new BookKeeper();
var challenge1 = {name : "Eka"};
var challenge2 = {name : "Toka"};
var challenge1Scores = {winner1 : 10, winner2 : 10, third : 4, loser : 0};
var challenge2Scores = {winner1 : 10, winner2 : 6, third : 4, loser : 0};
var firstChallenge = {
    'When first challenge ends' : {
        'Has correct cumulative score for first challenge' : function() {
            bookkeeper.record(challenge1, challenge1Scores);
            assert.deepEqual(bookkeeper.getCumulativeScores(challenge1), challenge1Scores);
        }
    }
}
var secondChallenge = {
    'When second challenge ends' : {
        topic : function () {
            bookkeeper.record(challenge2, challenge2Scores);
            this.callback()
        },
        'Has correct cumulative score for first challenge' : function() {
            assert.deepEqual(bookkeeper.getCumulativeScores(challenge1), challenge1Scores);
        },
        'Has correct cumulative score for second challenge' : function() {
            assert.deepEqual(bookkeeper.getCumulativeScores(challenge2), {
                winner1 : 20, winner2 : 16, third : 8, loser : 0
            });
        },
        'Has correct ranking' : function() {
            assert.deepEqual(bookkeeper.getRanking(), {winner1 : 1, winner2 : 2, third : 3, loser : 4})
        }
    }
}
vows.describe('Bookkeeping').addBatch(firstChallenge).addBatch(secondChallenge).export(module);
