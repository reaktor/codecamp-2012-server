var http = http = require('http')

exports.HttpServer = function(port, handler) {
    var server = http.createServer(handler);
    server.listen(port, '127.0.0.1');
    console.log('Result server running on port ' + port);
    return server;
}
