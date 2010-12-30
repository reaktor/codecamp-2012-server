var http = require('http'),
        fs = require('fs'),
        _ = require('underscore'),
        util = require('util');
var nextAvailablePort = 8200;
// (Challenge -> Object) -> Unit
function Contender(resultStrategy) {
    this.host = '127.0.0.1';
    this.challenges = [];
    this.timeout = 0;
    this.port = nextAvailablePort++;
    var testClient = this;
    this.start = function() {
        this.server = http.createServer(this.handler);
        this.server.listen(this.port, this.host);
        console.log('Contender running at http://' + this.host + ':' + this.port + '/');
        return this;
    };
    this.handler = function (req, res) {
        var challengeJson = '';
        req.on('data', function (chunk) {
            challengeJson += chunk;
        });
        req.on('end', function() {
            setTimeout(function() {
                var challenge = JSON.parse(challengeJson);
                testClient.challenges.push(challenge);
                var result = resultStrategy(challenge)
                var resultJson = JSON.stringify(result);
                res.writeHead(200);
                res.write(resultJson);
                res.end();
            }, testClient.timeout);
        });
    };
    this.config = function() {
        return { 'host': this.host, 'port': this.port, 'name' : "TestContender" + this.port };
    }
    this.id = function() {
        return this.config().name;
    }
}
// Int -> Contender
function ContenderWhichReturnsNFirstItemsFromChallenge(numberOfItemsToKeep) {
    return new Contender(function(challenge) {
        var keptItems = challenge.contents.slice(0, numberOfItemsToKeep)
        var idsOfKeptItems = keptItems.map(function(item) {
            return item.id
        })
        return idsOfKeptItems;
    });
}
function RandomContender() {
    return new Contender(function(challenge) {
        function pickRandom(items) {
            var index = Math.floor(Math.random() * items.length);
            var item = items[index];
            items.splice(index, 1);
            return item
        }
        var itemsLeft = _.clone(challenge.contents)
        var keptItems = []
        var item = pickRandom(itemsLeft);
        var totalWeight = 0;
        while (item && item.weight + totalWeight <= challenge.capacity) {
            keptItems.push(item);
            totalWeight += item.weight
            item = pickRandom(itemsLeft)
        }
        var idsOfKeptItems = keptItems.map(function(item) {
            return item.id
        })
        return idsOfKeptItems;
    });
}

// Object -> Contender
function ContenderWithFixedResponse(response) {
    return new Contender(function(challenge) {
        return response;
    });
}
// Int -> Contender
function ContenderWithEmptyResponse(timeout) {
    var contender = new Contender(function(challenge) {
        return [];
    });
    contender.timeout = timeout;
    return contender;
}
exports.Contender = Contender
exports.ContenderWhichReturnsNFirstItemsFromChallenge = ContenderWhichReturnsNFirstItemsFromChallenge
exports.ContenderWithFixedResponse = ContenderWithFixedResponse
exports.ContenderWithEmptyResponse = ContenderWithEmptyResponse
exports.RandomContender = RandomContender