var http = http = require('http')

exports.HttpServer = function(port, handler) {
    var server = http.createServer(handler);
    server.listen(port);
    console.log('Result server running on port ' + port);
    return server;
}
