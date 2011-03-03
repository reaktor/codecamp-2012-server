var Connector = function() {
    var socket = new io.Socket();
    var handlers = []
    socket.on('connect', function() {
        console.log("Connected to server")
    })
    socket.on('disconnect', function() {
        console.log("Disconnect from server")
    })
    socket.on('message', function(messageString) {
        var message = JSON.parse(messageString);
        console.log("Message from server: " + message.message)
        handlers.forEach(function(handler) {handler(message)})
    });
    socket.connect();
    return {
        addHandler : function(handler) {handlers.push(handler)},
        send : function(message) {socket.send(message)}
    }
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
        if (message.message == 'init') {
            handler(message);
        } else {
            queue.push(message)
        }
    }
}

var Router = function(connector, handlers) {
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
    connector.addHandler(wrap(onMessage))
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
            if (initMessage.contenders[i].name == contenderName) {
                return i;
            }
        }
    }
    function associate(element, contender) {
        element.addClass('contender-' + contenderId(contender.name))
        if (contender.rabbit) {
          element.addClass('rabbit')
        }
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
    var minValues = {}
    function showValue(message) {
        if (!values[message.challengeName]) {
            values[message.challengeName] = {}
        }
        values[message.challengeName][message.contenderName] = message.value;
        if (!maxValues[message.challengeName] || message.value > maxValues[message.challengeName]) {
            maxValues[message.challengeName] = message.value;
        }
        if (!minValues[message.challengeName] || message.value < minValues[message.challengeName]) {
            minValues[message.challengeName] = message.value;
        }
        updateGraphs(message.challengeName);
    }
    function updateGraphs(challengeName) {
        var maxValue = Math.max(maxValues[challengeName], 1)
        _.each(values[challengeName], function(value, contenderName) {
            var minValue = _.size(values[challengeName]) == 1 ? 0 : minValues[challengeName]
            var scale = Math.max((maxValue - minValue), 1)
            var percent = Math.round(100 * (value - minValue) / scale) + 10
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
    Template.renderElements($('#contenders'), "contenders-name", initMessage.contenders, function(contender, element) {
        element.text(contender.name)
        contenderMapper.associate(element, contender)
    })
    Template.renderElements($('#results'), "challenge-results", initMessage.challenges, function(challenge, challengeRow) {
        var cell = $('.challenge-name', challengeRow);
        cell.find(".name").text(challenge.name)
        cell.find(".ordinal").text("Tehtävä " + (initMessage.challenges.indexOf(challenge) + 1));
        challengeMapper.associate(challengeRow, challenge.name);
        challengeRow.addClass("not-started")
        Template.renderElements(challengeRow, "contender-result", initMessage.contenders, function(contender, contenderResultElement) {
            contenderMapper.associate(contenderResultElement, contender)
        })
    })
    Template.renderElements($('.total-results'), "contender-total", initMessage.contenders, function(contender, element) {
        contenderMapper.associate(element, contender)
    })
}

function roundStartHandler(startMessage) {
    $('body').attr("id", "competition")
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
    setTimeout(function() {
        // This removes weight etc. data from completed results:
        //challengeMapper.rowFor(endMessage.challengeName).removeClass("current").addClass("completed");
    }, 5000)
    _.each(endMessage.scores, function(score, contenderName) {
        var resultCell = resultMapper.resultCellFor(endMessage.challengeName, contenderName)
        resultCell.children(".score").text(score)
    })
    _.each(endMessage.cumulativeScores, function(score, contenderName) {
        console.log("Score for " + contenderName)
        var cell = contenderMapper.totalScoreCellFor(contenderName);
        cell.text(score)
    })
}

function roundEndHandler(roundEndMessage) {
    _.each(roundEndMessage.ranking, function(rank, contenderName) {
        var cell = contenderMapper.totalScoreCellFor(contenderName);
        cell.addClass("rank-" + rank)
    })
}

var handlers = {
    init : initHandler,
    roundStart : roundStartHandler,
    challengeStart : challengeStartHandler,
    contenderFail : contenderFailHandler,
    contenderReady : contenderReadyHandler,
    challengeEnd : challengeEndHandler,
    roundEnd : roundEndHandler
};
$(function() {
    var connector = new Connector()
    var router = new Router(connector, handlers)
    $('#splash-image').click(function() {
        $('body').attr("id", "countdown")
        $('body').append('<img id="countdown-image" class="fullscreen-image" src="images/countdown_anim.gif"/>')
        setTimeout(function() {
            connector.send("start")
        }, 5000)
    });
})

