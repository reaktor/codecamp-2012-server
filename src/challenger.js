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
    // TODO this function is awfully long
    var sendChallengeAndSaveResult = function(contender) {
        function log(text) {
            console.log("Challenge " + challenge + ", Contender " + contender + ": " + text);
        }
        function sendChallenge() {
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
            return request;
        }
        var started = new Date();
        var request = sendChallenge();
        var timedOut = false;
        request.on('response', function (response) {
            response.setEncoding('utf8');
            extractContent(response, function(solutionJson) {
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
            })
        });
        request.end();
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