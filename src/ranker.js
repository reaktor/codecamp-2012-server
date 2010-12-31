var _ = require('underscore'),
    inspect = require('util').inspect,
    Scorer = require('./scorer').Scorer
var Ranker = function() {
    // (Contender -> Int) -> (Contender -> Int)
    var rank = function(scores) {
        var scoresWithOkFlag = {}
        _.each(scores, function(score, contenderName) { scoresWithOkFlag[contenderName] = {value : score, ok : true}})
        return Scorer(_.range(1, _.size(scores) + 1)).score(scoresWithOkFlag);
    }
    return {rank : rank}
}
exports.Ranker = Ranker