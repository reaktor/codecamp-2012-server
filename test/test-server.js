/**
 * An easy interface for using the server in tests.
 */
var round = require('./test-round-config').round,
    Main = require('../src/mannapuuro').Main;

var currentServerPort = 10000;

// [Contender] -> Configuration
function createConfigFor(contenders) {
    var port = currentServerPort++;
    var contenderConfigs = contenders.map(function(c) {
        return c.config()
    });
    return { contenders: contenderConfigs, server: { port: port }, scoring : [10, 6, 4, 3, 2, 1] }
}

// [Contender]? -> TestServer
var TestServer = function(optionalContenders) {
    var contenders = optionalContenders || []
    var config = createConfigFor(contenders);
    var main = new Main(config, round);
    main.start()

    function tearDownBatch() {
        return {
            'After tests' : {
                'Shut down server' : function() {
                    console.log("Shutting down server..")
                    main.close();
                },

                'Shut down contenders' : function() {
                    contenders.forEach(function(c) { c.server.close(); });
                }
            }
        }
    }

    return {
        tearDownBatch: tearDownBatch,
        config: config,
        round: round
    }
}

exports.TestServer = TestServer