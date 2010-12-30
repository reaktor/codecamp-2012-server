var _ = require('underscore'),
    util = require('util');
var Scorer = function(scoring) {
	function zipAsObject(keys, values) {
		var hash = {}
		for (i in keys) {
			hash[keys[i]] = values[i];
		}
		return hash;		
	}
	function distributeScores(results, scoring) {
		if (results.length == 0) return [];
		var topValue = results[0].value;
		var winners = _.select(results, function(result) { return result.value == topValue})
		var scoresForWinners = _.map(winners, function(_) { return scoring[0]})
		var wl = winners.length;
		return scoresForWinners.concat(distributeScores(_.rest(results, wl), _.rest(scoring, wl)))
	}
	// (Contender -> Result) -> (Contender -> int)
    var score = function(challengeResults) {
	    var coupled = _.map(challengeResults, function(result, id) { return {id : id, ok : result.ok, value : result.value}})
		var accepted = _.select(coupled, function(result) {return result.ok})
		var sorted = _.sortBy(accepted, function(result) {return -result.value })
		var limited = _.first(sorted, scoring.length);
		var scores = distributeScores(limited, scoring);
		var ids = _.pluck(limited, "id")
		var result = zipAsObject(ids, scores);
		return result;
	}
	return {
		score : score
	}
}
exports.Scorer = Scorer