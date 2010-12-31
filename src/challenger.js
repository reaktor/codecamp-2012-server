var Contender = require('./contender').Contender,
    http = require('http'),
    FailedResult = require('./result').FailedResult,
    extractContent = require('./contentextractor').extractContent;

// type ContenderCompletionListener : Challenge -> Contender -> Result -> Unit
// type Messagehandler : (Object -> Unit)
// Configuration -> Challenge -> ContenderCompletionListener -> Challenger
exports.Challenger = function(config, challenge, contenderCompletionListener, messageHandler) {
    messageHandler({message : "challengeStart", challengeName : challenge.name});
    var contenders = config.contenders;
    // Contender -> Unit
    function failContender(contender) {
        messageHandler({message : "contenderFail", challengeName : challenge.name, contenderName : contender.name})
        contenderCompletionListener(challenge, contender, new FailedResult());
    }
    var sendChallengeAndSaveResult = function(contender) {
        var started = new Date();
        var timedOut = false;
        function log(text) {
            console.log("Challenge " + challenge + ", Contender " + contender + ": " + text);
        }
        function sendChallenge(solutionHandler) {
            log("Sending challenge");
            var httpClient = http.createClient(contender.port, contender.host);
            var request = httpClient.request('POST', '/', {'host': contender.host});
            request.write(challenge.toJSON());
            request.connection.setTimeout(challenge.timeout);
            request.connection.on('timeout', function() {
                log("Timeout")
                timedOut = true
                failContender(contender);
            });
            request.on('response', function (response) {
                extractContent(response, solutionHandler, 'utf8')
            });
            request.end();
        }
        function solutionHandler(solutionJson) {
            if (!timedOut && solutionJson.length > 0) {
                var elapsed = new Date().getTime() - started.getTime();
                if (elapsed > challenge.timeout) {
                    log("Failed because of elapsed time " + elapsed + " > " + challenge.timeout);
                    failContender(contender);
                } else {
                    log("Got response in " + elapsed + " ms")
                    var solution = JSON.parse(solutionJson);
                    var result = challenge.resultFor(solution);
                    if (result.ok) {
                        messageHandler({message : "contenderReady", challengeName : challenge.name, contenderName : contender.name, value: result.value, weight: result.weight})
                        contenderCompletionListener(challenge, contender, result);
                    } else {
                        failContender(contender);
                    }
                }
            }
        }
        var request = sendChallenge(solutionHandler);
    };
    return {
        // Unit -> Coordinator
        start: function() {
            contenders.forEach(function(contender) {
                sendChallengeAndSaveResult(new Contender(contender));
            });
            return this;
        }
    }
}