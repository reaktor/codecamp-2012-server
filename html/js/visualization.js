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
    }, 2000)
    return function(message) {
        queue.push(message)
    }
}
var Pihtari = function(handler) {
    var queue = []
    $(document).click(function (e) {
        if(queue.length > 0 && e.button == 0) {
            handler(queue.shift())
        }
    })
    return function(message) {
        queue.push(message)
    }
}

var Router = function(handlers) {
    function wrap(handler) {
        if (document.location.search == "?pihtari") {
            return new Pihtari(handler)
        }
        if (document.location.search == "?handbrake") {
            return new Handbrake(handler)
        }
        return handler;
    }
    function onMessage(message) {
        var handler = handlers[message.message];
        if (handler) {
            handler(message);
        }
    }

    new Connector(wrap(onMessage))
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
    function totalScoreCellFor(contenderName) {
        return $('.contender-total.contender-' + contenderId(contenderName))
    }
    return {
        contenderId : contenderId, associate: associate, totalScoreCellFor : totalScoreCellFor
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

var ValueVisualizer = function(initMessage) {
    var values = {}
    var maxValues = {}
    function showValue(message) {
        if (!values[message.challengeName]) {
            values[message.challengeName] = {}
        }
        values[message.challengeName][message.contenderName] = message.value;
        if (!maxValues[message.challengeName] || message.value > maxValues[message.challengeName]) {
            maxValues[message.challengeName] = message.value;
        }
        updateGraphs(message.challengeName);
    }
    function updateGraphs(challengeName) {
        var maxValue = maxValues[challengeName]
        _.each(values[challengeName], function(value, contenderName) {
            var percent = Math.round(100 * value / maxValue)
            var bar = resultMapper.resultCellFor(challengeName, contenderName).find(".value-bar");
            bar.css('height', percent + "%")
            bar.css('top', (100 - percent) + "%")
            bar.css('position', 'relative')
        })
    }
    return {showValue : showValue}
}
var valueVisualizer;

function initHandler(initMessage) {
    challengeMapper = new ChallengeMapper(initMessage);
    contenderMapper = new ContenderMapper(initMessage);
    resultMapper = new ResultMapper(initMessage);
    valueVisualizer = new ValueVisualizer(initMessage);
    Template.renderElements($('#contenders'), "contenders-name", initMessage.contenders, function(contenderName, element) {
        element.text(contenderName)
    })
    Template.renderElements($('#results'), "challenge-results", initMessage.challenges, function(challenge, challengeRow) {
        var cell = $('.challenge-name', challengeRow);
        cell.find(".name").text(challenge.name)
        cell.find(".ordinal").text("Tehtävä " + (initMessage.challenges.indexOf(challenge) + 1));
        challengeMapper.associate(challengeRow, challenge.name);
        challengeRow.addClass("not-started")
        Template.renderElements(challengeRow, "contender-result", initMessage.contenders, function(contenderName, contenderResultElement) {
            contenderMapper.associate(contenderResultElement, contenderName)
        })
    })
    Template.renderElements($('.total-results'), "contender-total", initMessage.contenders, function(contenderName, element) {
        contenderMapper.associate(element, contenderName)
    })
}
function challengeStartHandler(startMessage) {
    challengeMapper.rowFor(startMessage.challengeName).removeClass("not-started").addClass("current");
}

function contenderFailHandler(failMessage) {
    var resultCell = resultMapper.resultCellFor(failMessage.challengeName, failMessage.contenderName)
    resultCell.addClass("fail")
    resultCell.append('<img class="fail" src="images/fail_anim.gif"/>')
}

function contenderReadyHandler(readyMessage) {
    var resultCell = resultMapper.resultCellFor(readyMessage.challengeName, readyMessage.contenderName)
    resultCell.addClass("success");
    resultCell.find(".result .weight").text("Paino: " + readyMessage.weight);
    resultCell.find(".result .value").text(readyMessage.value);
    valueVisualizer.showValue(readyMessage)
}

function challengeEndHandler(endMessage) {
    challengeMapper.rowFor(endMessage.challengeName).removeClass("current").addClass("completed");
    _.each(endMessage.scores, function(score, contenderName) {
        var resultCell = resultMapper.resultCellFor(endMessage.challengeName, contenderName)
        resultCell.children(".score").text(score)
        incrementTotal(contenderName, score)
    })
    function toInt(text) {
        if (!text.trim()) {
            return 0;
        }
        return parseInt(text);
    }
    function incrementTotal(contenderName, score) {
        var cell = contenderMapper.totalScoreCellFor(contenderName);
        cell.text(score + toInt(cell.text()));
    }
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

