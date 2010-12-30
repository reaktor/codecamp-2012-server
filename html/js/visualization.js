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
var Router = function(handlers) {
    function onMessage(message) {
        var handler = handlers[message.message];
        if (handler) {
            handler(message);
        }
    }

    new Connector(onMessage)
};
var initMessage;
function challengeId(challengeName) {
    for (i in initMessage.challenges) {
        if (initMessage.challenges[i].name == challengeName) {
            return i;
        }
    }
}
function initHandler(message) {
    initMessage = message;
    Template.renderElements($('#teams'), "team-name", initMessage.contenders, function(teamName, element) {
        element.text(teamName)
    })
    Template.renderElements($('#results'), "challenge-results", initMessage.challenges, function(challenge, challengeRow) {
        $('.challenge-name', challengeRow).text(challenge.name)
        challengeRow.addClass('challenge-' + challengeId(challenge.name))
        Template.renderElements(challengeRow, "team-result", initMessage.contenders, function(teamName, contenderResultElement) {
        })
    })
}
function challengeStartHandler(startMessage) {
    var id = challengeId(startMessage.challengeName);
    $('.challenge-results.challenge-' + id).addClass("current");
    $('.challenge-results:not(.challenge-' + id + ')').removeClass("current");
}

var handlers = {
    init : initHandler,
    challengeStart : challengeStartHandler
};
$(function() {
    new Router(handlers)
})

