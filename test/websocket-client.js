var WebSocketImpl = require('websocket-client').WebSocket

exports.WebSocketClient = function(port) {
    return new WebSocketImpl('ws://localhost:' + port + '/socket.io/websocket')
}

exports.sendMessage = function(port, message) {
    var ws = exports.WebSocketClient(port);
    ws.send(message);
    ws.close();
}
