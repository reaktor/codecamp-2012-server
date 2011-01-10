var VisualizationServer = require('./visualizationserver').VisualizationServer,
    StaticContentServer = require('./staticcontentserver').StaticContentServer,
    RoundRunner = require('./roundrunner').RoundRunner,
    BookKeeper = require('./bookkeeper').BookKeeper,
    HttpServer = require('./httpserver').HttpServer;

var Main = function(config, round) {
    var started
    function start() {
        if (!started) {
            started = true;
            RoundRunner(config, round, visualizationServer.sendEvent, new BookKeeper());
        }
    }

    var staticContentServer = new StaticContentServer();
    var httpServer = new HttpServer(config.server.port, staticContentServer.requestHandler)
    var visualizationServer = new VisualizationServer(httpServer, start)
    return {
        start : start,
        stop : function() { httpServer.close() }
    };
}
exports.Main = Main