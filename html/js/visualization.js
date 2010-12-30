var Connector = function(messageHandler) {
    var socket = new io.Socket();
    socket.on('connect', function() {
        console.log("Connected to server")
    })
    socket.on('disconnect', function() {
        console.log("Disconnect from server")
    })
    socket.on('message', function(messageString) {
        var message = JSON.parse(messageString);
        console.log("Message from server: " + message.message)
        messageHandler(message)
    });
    socket.connect();
};
var Handbrake = function(handler) {
    var queue = []
    setInterval(function() {
        if(queue.length > 0) {
            handler(queue.shift())
        }
    }, 100)
    return function(message) {
        queue.push(message)
    }
}
var Router = function(handlers) {
    function onMessage(message) {
        var handler = handlers[message.message];
        if (handler) {
            handler(message);
        }
    }

    new Connector(new Handbrake(onMessage))
};

var ChallengeMapper = function(initMessage) {
    function challengeId(challengeName) {
        for (i in initMessage.challenges) {
            if (initMessage.challenges[i].name == challengeName) {
                return i;
            }
        }
    }
    function associate(element, challengeName) {
        element.addClass('challenge-' + challengeId(challengeName))
    }
    function rowFor(challengeName) {
        return $('.challenge-results.challenge-' + challengeId(challengeName));
    }
    return {associate: associate, rowFor : rowFor}
}
var challengeMapper;

var ContenderMapper = function(initMessage) {
    function contenderId(contenderName) {
        for (i in initMessage.contenders) {
            if (initMessage.contenders[i] == contenderName) {
                return i;
            }
        }
    }
    function associate(element, contenderName) {
        element.addClass('contender-' + contenderId(contenderName))
    }
    return {
        contenderId : contenderId, associate: associate
    }
}
var contenderMapper;

var ResultMapper = function(initMessage) {
    function resultCellFor(challengeName, contenderName) {
        var challengeRow = challengeMapper.rowFor(challengeName);
        return $('.contender-result.contender-' + contenderMapper.contenderId(contenderName), challengeRow)
    }
    return {resultCellFor : resultCellFor}
}
var resultMapper;

function initHandler(initMessage) {
    challengeMapper = new ChallengeMapper(initMessage);
    contenderMapper = new ContenderMapper(initMessage);
    resultMapper = new ResultMapper(initMessage);
    Template.renderElements($('#contenders'), "contenders-name", initMessage.contenders, function(contenderName, element) {
        element.text(contenderName)
    })
    Template.renderElements($('#results'), "challenge-results", initMessage.challenges, function(challenge, challengeRow) {
        $('.challenge-name', challengeRow).text(challenge.name)
        challengeMapper.associate(challengeRow, challenge.name);
        Template.renderElements(challengeRow, "contender-result", initMessage.contenders, function(contenderName, contenderResultElement) {
            contenderMapper.associate(contenderResultElement, contenderName)
        })
    })
}
function challengeStartHandler(startMessage) {
    challengeMapper.rowFor(startMessage.challengeName).addClass("current");
}

function contenderFailHandler(failMessage) {
    var resultCell = resultMapper.resultCellFor(failMessage.challengeName, failMessage.contenderName)
    resultCell.addClass("fail");
}

function contenderReadyHandler(readyMessage) {
    var resultCell = resultMapper.resultCellFor(readyMessage.challengeName, readyMessage.contenderName)
    resultCell.addClass("success");
    resultCell.find(".result .weight").text(readyMessage.weight);
    resultCell.find(".result .value").text(readyMessage.value);
}

function challengeEndHandler(endMessage) {
    challengeMapper.rowFor(endMessage.challengeName).removeClass("current").addClass("completed");
    _.each(endMessage.scores, function(score, contenderName) {
        var resultCell = resultMapper.resultCellFor(endMessage.challengeName, contenderName)
        resultCell.children(".score").text(score)
    })
}

var handlers = {
    init : initHandler,
    challengeStart : challengeStartHandler,
    contenderFail : contenderFailHandler,
    contenderReady : contenderReadyHandler,
    challengeEnd : challengeEndHandler
};
$(function() {
    new Router(handlers)
})

