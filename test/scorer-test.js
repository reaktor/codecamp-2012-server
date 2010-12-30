/**
 * Test for the scorer.
 */
var vows = require('vows'),
        assert = require('assert'),
        util = require('util');
var scorer = require('../src/scorer');
var scoring = [10, 6, 4]
var scorerTests = {
	'At challenge start' : {
		'returns empty scores' : function() {
			assert.deepEqual(scorer.Scorer(scoring).score({}), {});
		}
	},
	'With more acceptable results than can be scored' : {
		'returns correct scores for scorable results' : function() {
			var results = {
				third : {value : 2, ok : true}, 
				fourth : {value : 1, ok : true}, 
				second : { value : 3, ok : true },
				fail : { value : 0, ok : false },
				winner : { value : 5, ok : true }
			};
			assert.deepEqual(scorer.Scorer(scoring).score(results), {winner : 10, second : 6, third : 4});
		}
	},
	'With less acceptable results than can be scored' : {
		'returns correct scores for scorable results' : function() {
			var results = {
				fail : { value : 0, ok : false },
				loser : { value : 0, ok : true },
				winner : { value : 5, ok : true }
			};
			assert.deepEqual(scorer.Scorer(scoring).score(results), {winner : 10});
		}
	},
	'With tie' : {
		'Skips score next to tie' : function() {
			var results = {
				third : { value : 3, ok : true },
				loser : { value : 0, ok : true },
				winner1 : { value : 5, ok : true },
				winner2 : { value : 5, ok : true }
			};
			assert.deepEqual(scorer.Scorer(scoring).score(results), {winner1 : 10, winner2 : 10, third : 4});
		}
	}	
	
}
vows.describe('Mannapuuro').addBatch(scorerTests).export(module);
