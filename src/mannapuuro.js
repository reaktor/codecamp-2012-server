var http = require('http'),
        fs = require('fs'),
        _ = require('underscore'),
        util = require('util'),
		Scorer = require('./scorer').Scorer,
        url = require('url'),
        path = require("path"),
        io = require('socket.io');
// (Boolean, Int) -> Result
var Result = function(ok, value, weight) {
    return { ok: ok, value: value, weight: weight }
}
// { contents: [Item], capacity: Int } -> Challenge
var Challenge = function(challenge) {
    // Int -> Item
    var itemById = function(id) {
        return _.detect(challenge.contents, function(item) {
            return item.id == id;
        });
    }
    // [Item] -> (Item -> Int) -> Int
    var sum = function(items, f) {
        return _.reduce(items, function(acc, item) {
            return acc + f(item)
        }, 0);
    }
    // [ItemId] -> Result
    var determineResult = function(itemIds) {
        if (!_.isArray(itemIds)) {
            return new Result(false, 0, 0)
        }
        var chosenItems = itemIds.map(itemById);
        var weight = sum(chosenItems, function(i) {
            return i.weight
        });
        if (weight > challenge.capacity) {
            return new Result(false, 0, weight)
        } else {
            var value = sum(chosenItems, function(i) {
                return i.value
            });
            return new Result(true, value, weight)
        }
    }
    return {
        name: challenge.name,
        timeout: challenge.timeout,
        resultFor: determineResult,
        toString: function() { return challenge.name },
        toJSON : function() {return JSON.stringify(challenge)}
    }
}

var Contender = function(contender) {
    return {
        toString: function() { return contender.name },
        name: contender.name,
        host: contender.host,
        port: contender.port
    }
}

var Main = function(config, round) {
    var staticContentServer = new StaticContentServer();
    var httpServer = new HttpServer(config.server.port, staticContentServer.requestHandler)
    var visualizationServer = new VisualizationServer(httpServer)
    RoundRunner(config, round, visualizationServer.sendEvent);
    return {
        close : function() { httpServer.close() },
        registerMessageHandler : visualizationServer.registerMessageHandler
    };
}

var HttpServer = function(port, handler) {
    var server = http.createServer(handler);
    server.listen(port, '127.0.0.1');
    console.log('Result server running on port ' + port);
    return server;
}

var StaticContentServer = function() {
    var handler = function(req, res) {
        // int -> Object -> String -> http.ServerResponse -> Unit
        var serve = function(status, headers, content, response) {
            response.writeHead(status, headers);
            response.write(content);
            response.end();
        }
        var uri = url.parse(req.url).pathname;
        req.on('end', function() {
            var filename = "html" + uri;
            path.exists(filename, function(exists) {
                if (!exists) {
                    serve(404, {"Content-Type": "text/plain"}, "404 Not Found\n", res);
                    return;
                }
                fs.readFile(filename, "binary", function(err, file) {
                    if (err) {
                        serve(500, {"Content-Type": "text/plain"}, err + "\n", res);
                    } else {
                        res.writeHead(200);
                        res.write(file, "binary");
                        res.end();
                    }
                });
            });
        });
    }
    return {requestHandler : handler}    
}

var VisualizationServer = function(httpServer) {
    var messages = [];

    // (JSON -> Unit) -> Unit
    var sendInitMessages = function(client) {
        console.log("Visualization client connected.");
        messages.forEach(function(message) {
            client.send(JSON.stringify((message)))
        })
    }

    var socket = io.listen(httpServer);
    socket.on('connection', function(client) {
        client.on('message', function() {console.log("Lol@client message");})
        client.on('disconnect', function() {console.log("Client disconnected")})
        sendInitMessages(client)
    });

    var broadcast = function(message) {
        messages.push(message);
        socket.broadcast(JSON.stringify(message));
    }

    return {
        sendEvent : broadcast
    };
}

var RoundRunner = function(config, round, messageHandler) {
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
            messageHandler({message: "roundEnd"})
            return;
        }
        var remainingContenders = config.contenders.length;
        var challengeResults = {}
        var contenderCompletionHandler = function(challenge, contender, result) {
            challengeResults[contender.name] = result;
            remainingContenders--;
            if(remainingContenders == 0) {
                var scores = Scorer(config.scoring).score(challengeResults)
                messageHandler({message : "challengeEnd", challengeName : challenge.name, scores : scores});
                sendChallenges(_.tail(remainingChallenges));
            }
        }
        var challenger = new Challenger(config, new Challenge(remainingChallenges[0]), contenderCompletionHandler, messageHandler);
        challenger.start();
    }
    sendChallenges(round.challenges)
}

// type ContenderCompletionListener : Challenge -> Contender -> Result -> Unit
// type Messagehandler : (Object -> Unit)
// Configuration -> Challenge -> ContenderCompletionListener -> Challenger
var Challenger = function(config, challenge, contenderCompletionListener, messageHandler) {
    messageHandler({message : "challengeStart", challengeName : challenge.name});
    var contenders = config.contenders;
    // Contender -> Unit
    function failContender(contender) {
        messageHandler({message : "contenderFail", challengeName : challenge.name, contenderName : contender.name})
        contenderCompletionListener(challenge, contender, new Result(false, 0, 0));
    }
    // TODO this function is awfully long
    var sendChallengeAndSaveResult = function(contender) {
        function log(text) {
            console.log("Challenge " + challenge + ", Contender " + contender + ": " + text);
        }
        var started = new Date();
        log("Sending challenge");
        var httpClient = http.createClient(contender.port, contender.host);
        var request = httpClient.request('POST', '/', {'host': contender.host});
        request.write(challenge.toJSON());
        request.connection.setTimeout(challenge.timeout);
        request.connection.on('timeout', function() {
           log("Timeout")
            failContender(contender);
            request.end();
        });
        request.on('response', function (response) {
            var solutionJson = '';
            response.setEncoding('utf8');
            response.on('data', function (chunk) {
                solutionJson += chunk;
            });
            response.on('end', function() {
                if (solutionJson.length > 0) {
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
            });
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
exports.Main = Main