var Contender = require('./contender').Contender,
    http = require('http'),
    FailedResult = require('./result').FailedResult,
    extractContent = require('./contentextractor').extractContent,
    fs = require('fs');

// type ContenderCompletionListener : Challenge -> Contender -> Result -> Unit
// type Messagehandler : (Object -> Unit)
// Configuration -> Challenge -> ContenderCompletionListener -> Challenger
exports.Challenger = function(config, challenge, contenderCompletionListener, messageHandler) {
    messageHandler({message : "challengeStart", challengeName : challenge.name});
    var contenders = config.contenders;
    // Contender -> Unit
    function failContender(contender) {
        if (arguments.length == 2) {
            console.log(contender + " failed for " + arguments[1]);
        }
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
            httpClient.addListener('error', function(connectionException) {
                failContender(contender, "Connection error.");
            });
            var request = httpClient.request('POST', '/', {'host': contender.host, 'Content-Type': 'application/json'});
            request.write(challenge.toJSON());
            request.connection.setTimeout(challenge.timeout);
            request.connection.on('timeout', function() {
                timedOut = true
                failContender(contender, "timeout");
            });
            request.on('response', function (response) {
                if(response.statusCode != 200) {
                    failContender(contender, "wrong statuscode: " + response.statusCode)
                } else {
                    extractContent(response, solutionHandler, 'utf8')
                }
            });
            request.end();
        }
        function handleSolution(solutionJson) {
            fs.writeFile(contender + "-" + challenge + "-response.log", solutionJson, function (err) {
                if (err) console.log(contender + "-" + challenge + "-response.log write failed.");
            });
            if (!timedOut && solutionJson.length > 0) {
                var elapsed = new Date().getTime() - started.getTime();
                if (elapsed > challenge.timeout) {
                    failContender(contender, "Failed because of elapsed time " + elapsed + " > " + challenge.timeout);
                } else {
                    log("Got response in " + elapsed + " ms")
                    try {
                        var solution = JSON.parse(solutionJson);
                        var result = challenge.resultFor(solution);
                        if (result.ok) {
                            messageHandler({message : "contenderReady", challengeName : challenge.name, contenderName : contender.name, value: result.value, weight: result.weight})
                            contenderCompletionListener(challenge, contender, result);
                        } else {
                            failContender(contender, "result not ok: " + result.message);
                        }
                    } catch(e) {
                        failContender(contender, "Error parsing json: " + e);
                    }
                }
            } else {
              failContender(contender, "empty result or timeout");
            }
        }
        var request = sendChallenge(handleSolution);
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