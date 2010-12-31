var io = require('socket.io')

exports.VisualizationServer = function(httpServer, startFunction) {
    var messages = [];

    // (JSON -> Unit) -> Unit
    var sendInitMessages = function(client) {
        console.log("Visualization client connected.");
        messages.forEach(function(message) {
            client.send(JSON.stringify((message)))
            console.log("Sent: " + message.message);
        })
    }

    var socket = io.listen(httpServer);
    socket.on('connection', function(client) {
        client.on('message', function(message) {
            console.log("Received: " + inspect(message));
            if (message == "start") {
                startFunction()
            }
        })
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