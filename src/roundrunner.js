var _ = require('underscore'),
    Challenger = require('./challenger').Challenger,
    Challenge = require('./challenge').Challenge,
        Scorer = require('./scorer').Scorer,
        Ranker = require('./ranker').Ranker;

exports.RoundRunner = function(config, round, messageHandler, bookKeeper) {
    messageHandler({
        message: "init",
        contenders : _.pluck(config.contenders, "name"),
        challenges : _.map(round.challenges, function(challenge) {
            return { name : challenge.name, capacity : challenge.capacity, numberOfItems : challenge.contents.length}
        })
    });
    messageHandler({message: "roundStart"})

    var sendChallenges = function(remainingChallenges) {
        if(remainingChallenges.length == 0) {
            messageHandler({message: "roundEnd", ranking : bookKeeper.getRanking()})
            return;
        }
        var remainingContenders = config.contenders.length;
        var challengeResults = {}
        var contenderCompletionHandler = function(challenge, contender, result) {
            result.rabbit = contender.isRabbit()
            challengeResults[contender.name] = result;
            remainingContenders--;
            if(remainingContenders == 0) {
                var scores = Scorer(config.scoring).score(challengeResults)
                bookKeeper.record(challenge, scores);
                messageHandler({message : "challengeEnd", challengeName : challenge.name, scores : scores, cumulativeScores : bookKeeper.getCumulativeScores(challenge)});
                sendChallenges(_.tail(remainingChallenges));
            }
        }
        var challenger = new Challenger(config, new Challenge(remainingChallenges[0]), contenderCompletionHandler, messageHandler);
        challenger.start();
    }
    sendChallenges(round.challenges)
}