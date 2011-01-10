var _ = require('underscore'),
    inspect = require('util').inspect;
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
    function pad(cs, padding, toSize) {
        return cs.concat(_.map(_.range(toSize - cs.length), function(_) { return padding}))
    }
	// (Contender -> Result) -> (Contender -> int)
    function score(challengeResults) {
	    var coupled = _.map(challengeResults, function(result, id) { return {id : id, ok : result.ok, value : result.value}})
      var sorted = _.sortBy(coupled, function(result) { return (result.ok) ? -result.value : 1 })
		  var accepted = _.select(sorted, function(result) {return result.ok })
		  var limited = _.first(accepted, scoring.length);
      var scores = distributeScores(limited, scoring);
      var padded = pad(scores, 0, coupled.length);
		  var ids = _.pluck(sorted, "id")
		  var result = zipAsObject(ids, padded);
		  return result;
	}
	return {
		score : score
	}
}
exports.Scorer = Scorer