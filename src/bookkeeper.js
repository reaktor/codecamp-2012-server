var _ = require('underscore'),
    inspect = require('util').inspect,
    Ranker = require('./ranker').Ranker

exports.BookKeeper = function() {
    var cumulativeScores
    var cumulativeScoresPerChallenge = {}

    // Challenge -> (contenderName -> Int) -> Unit
    function record(challenge, scores) {
        console.log("Record: " + challenge.name + " = " + inspect(scores))
        if (!cumulativeScores) {
            cumulativeScores = _.clone(scores);
        } else {
            _.each(scores, function(score, contenderName) { cumulativeScores[contenderName] += score})
        }
        cumulativeScoresPerChallenge[challenge.name] = _.clone(cumulativeScores)
    }
    // Challenge -> (contenderName -> Int)
    function getCumulativeScores(challenge) {
        return cumulativeScoresPerChallenge[challenge.name]
    }
    // Challenge -> (contenderName -> Int)
    function getRanking() {
        return new Ranker().rank(cumulativeScores)
    }
    return {record : record, getCumulativeScores : getCumulativeScores, getRanking : getRanking}
}