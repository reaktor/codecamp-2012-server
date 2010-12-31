/**
 * Test for the scorer.
 */
var vows = require('vows'),
        assert = require('assert'),
        util = require('util');
var ranker = require('../src/ranker').Ranker();
var rankerTests = {
	'With tie' : {
		'Skips rank next to tie' : function() {
			var scores = {winner1 : 10, winner2 : 10, third : 4, loser : 0};
			assert.deepEqual(ranker.rank(scores), {winner1 : 1, winner2 : 1, third : 3, loser : 4});
		}
	}

}
vows.describe('When ranking').addBatch(rankerTests).export(module);
