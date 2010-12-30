/**
 * Message queue for the integration tests.
 */
var WebSocket = require('websocket-client').WebSocket,
    assert = require('assert'),
    util = require('util'),
    _ = require('underscore');

// int -> (JSONObject -> Unit) -> WebSocketMessageCollector
var WebSocketMessageCollector = function(port, handler) {
    var ws = new WebSocket('ws://localhost:' + port + '/socket.io/websocket');
    ws.onmessage = function(message) {
        /*
         * The messages are prefixed with a header that contains the size of the actual payload, e.g.
         *
         * ~m~24~m~{"message":"roundStart"}
         *
         * Since we just want the JSON from the message, it's easy to find the
         * first curly brace and go from there.
         */
        var data = message.data;
        var jsonStart = data.indexOf('{');
        if(jsonStart >= 0) {
            var jsonString = data.substring(jsonStart)
            var jsonObject = JSON.parse(jsonString)
            handler(jsonObject)
        }
    };
    ws.onerror = function(error) {
        console.log("Can't connect to test web server! " + error)
    };

    return {
        close: ws.close
    }
};

// int -> TestMessageQueue
var TestMessageQueue = function(port) {
    var Waiter = function(callback) {
        function sendTimeOutMessageIfNotDelivered() {
            if (_.contains(waiters, callback)) {
                waiters = _.without(waiters, callback);
                callback("Timed out")
            }
        }
        function deliver(message) {
            clearTimeout(timeout)
            callback(message)
        }
        var timeout = setTimeout(sendTimeOutMessageIfNotDelivered(), 5000);
        return {
            deliver: deliver
        }
    };

    var messages = []
    var waiters = []

    function receiveMessage(message) {
        messages.push(message)
        deliverIfPossible();
    }

    function waitForMessage(callback) {
        waiters.push(new Waiter(callback))
        deliverIfPossible();
    }

    function deliverIfPossible() {
        if(messages.length > 0 && waiters.length > 0) {
            waiters.shift().deliver(messages.shift());
        }
    }

    var messageCollector = new WebSocketMessageCollector(port, receiveMessage);

    return {
        waitForMessage: waitForMessage,
        close: messageCollector.close
    };
}

// TestMessageQueue -> MessageBatcher
var MessageBatcher = function(queue) {
    var messages;

    // int -> ([Message] -> Unit)
    function waitForMessages(count, callback) {
        messages = []
        _.times(count, function() {
            queue.waitForMessage(function(message) {
                messages.push(message);
                if (messages.length == count) callback(messages)
            })
        })
    }
    
    return {
        waitForMessages : waitForMessages
    }
}

exports.TestMessageQueue = TestMessageQueue
exports.MessageBatcher = MessageBatcher
