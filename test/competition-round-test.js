/**
 * Integration test for a competition round.
 */
var vows = require('vows'),
    assert = require('assert'),
    _ = require('underscore'),
    util = require('util'),
    contender = require('./contender'),
    assertContains = require('./assertions').assertContains,
    TestMessageQueue = require('./message-queue').TestMessageQueue,
    MessageBatcher = require('./message-queue').MessageBatcher,
    TestServer = require('./test-server').TestServer,
    sendMessage = require('./websocket-client').sendMessage;

var nonResponsive = contender.ContenderWithEmptyResponse(100);
var responsiveWithResultWithinBounds = contender.ContenderWhichReturnsNFirstItemsFromChallenge(1);
var responsiveWithOverweightResult = contender.ContenderWhichReturnsNFirstItemsFromChallenge(2);
var responsiveWithDiipaDaapaResult = contender.ContenderWithFixedResponse({"anything": "whatever"});
var rabbit = contender.ContenderWhichReturnsNFirstItemsFromChallenge(1);
rabbit.rabbit = true;

var contenders = [
    nonResponsive,
    responsiveWithResultWithinBounds,
    responsiveWithOverweightResult,
    responsiveWithDiipaDaapaResult,
    rabbit];

contenders.forEach(function(contender) {
  // Set host explicitly, because otherwise it seems to take about 1 second to get a reply to the first challenge. Makes no sense.
  contender.host = '127.0.0.1'
  contender.start()
})

var testServer = new TestServer(contenders)
var config = testServer.config
var round = testServer.round

var messageQueue = new TestMessageQueue(config.server.port)
var messageBatcher = new MessageBatcher(messageQueue)

function expectMessage(description, expectedMessage) {
    return {
        topic: function() {
            messageQueue.waitForMessage(this.callback)
        },

        description: function(message, _) {
            assert.deepEqual(message, expectedMessage);
        }
    };
}

var initialization = {
    "When visualization client connects" :
            expectMessage("initialization message is sent", {
                message : "init",
                contenders : [{name : "TestContender8200"}, {name : "TestContender8201"}, {name : "TestContender8202"}, { name : "TestContender8203"}, {name : "TestContender8204", rabbit : true}],
                challenges : [{name : "Eka", numberOfItems : 2, capacity : [99], timeout : 50}, {name : "Toka", numberOfItems : 2, capacity: [991], timeout : 150}]})
};

var roundStart = {
    "When round starts" : expectMessage("roundStart message is sent", {message : "roundStart"})
};

var firstChallengeStart = {
    "When first challenge starts" :
        expectMessage("challengeStart message is sent",
            { message : "challengeStart", challengeName : "Eka" })
};

var firstChallengeResults = {
    "When contenders finish first challenge" : {
        topic : function() {
            messageBatcher.waitForMessages(5, this.callback);
        },

        'timeout was 50ms': function(_, _) {
            assert.equal(round.challenges[0].timeout, 50)
        },

        '100ms contender fails': function(messages, _) {
            assertContains(messages, {message : "contenderFail", challengeName : "Eka", contenderName : "TestContender8200"});
        },

        'client with result within bounds succeeds': function(messages, _) {
            assertContains(messages, {message : "contenderReady", challengeName : "Eka", contenderName : "TestContender8201", value: 100, weight : [10]});
        },

        'client with overweight result fails': function(messages, _) {
            assertContains(messages, {message : "contenderFail", challengeName : "Eka", contenderName : "TestContender8202"});
        },

        'client with diipa daapa result fails': function(messages, _) {
            assertContains(messages, {message : "contenderFail", challengeName : "Eka", contenderName : "TestContender8203"});
        }

        // Handle these (and other) special cases in another context:
        // TODO client returning empty string
    }
};

var firstChallengeEnd = {
    "When first challenge ends" :
        expectMessage("challengeEnd message is sent with scores", {
            message : "challengeEnd",
            challengeName : "Eka",
            scores: {
                // TODO name contenders better in test
                "TestContender8201": 10,
                "TestContender8200": 0,
                "TestContender8202": 0,
                "TestContender8203": 0
            },
            cumulativeScores: {
                "TestContender8201": 10,
                "TestContender8200": 0,
                "TestContender8202": 0,
                "TestContender8203": 0
            }
        })
};

var secondChallengeStart = {
    "For visualization clients, when second challenge starts" :
        expectMessage("challengeStart message is sent", {message : "challengeStart", challengeName : "Toka"})
};

var secondChallengeResults = {
    "When contenders finish second challenge" : {
        topic : function() {
            messageBatcher.waitForMessages(6, this.callback);
        },

        'timeout was 150ms': function(_, _) {
            assert.equal(round.challenges[1].timeout, 150)
        },

        '100ms contender is ok with zero value': function(messages, _) {
            assertContains(messages, {message : "contenderReady", challengeName : "Toka", contenderName : "TestContender8200", value: 0, weight : [0]});
        }
    }
};

var secondChallengeEnd = {
    "When second challenge ends" :
        expectMessage("challengeEnd message is sent with scores", {
            message : "challengeEnd",
            challengeName : "Toka",
            scores: {
                "TestContender8201": 10,
                "TestContender8200": 6,
                "TestContender8202": 0,
                "TestContender8203": 0
            },
            cumulativeScores: {
                "TestContender8201": 20,
                "TestContender8200": 6,
                "TestContender8202": 0,
                "TestContender8203": 0
            }
        })
};

var roundEnd = {
    "When round ends" : expectMessage("roundEnd message is sent", {
        message : "roundEnd",
        ranking : {"TestContender8201": 1,
                   "TestContender8200": 2,
                   "TestContender8202": 3,
                   "TestContender8203": 3}
    })
};

var challengesSentToContenders = {
    "For first challenge" : {
        "correct challenge is sent" : function() {
            assert.deepEqual(responsiveWithResultWithinBounds.challenges[0], round.challenges[0])
        }
    },

    "For second challenge" : {
        "correct challenge is sent" : function() {
            assert.deepEqual(responsiveWithResultWithinBounds.challenges[1], round.challenges[1])
        }
    }
};

var shutDownMessageQueue = {
    "Shut down message queue": function() {
        messageQueue.close();
    }
}

vows.describe('All events in a round, in sequence')
        .addBatch(initialization)
        .addBatch(roundStart)
        .addBatch(firstChallengeStart)
        .addBatch(firstChallengeResults)
        .addBatch(firstChallengeEnd)
        .addBatch(secondChallengeStart)
        .addBatch(secondChallengeResults)
        .addBatch(secondChallengeEnd)
        .addBatch(roundEnd)
        .addBatch(challengesSentToContenders)
        .addBatch(shutDownMessageQueue)
        .addBatch(testServer.tearDownBatch())
        .export(module);
