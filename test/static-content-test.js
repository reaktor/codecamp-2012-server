/**
 * Integration test for the static content server.
 */
var vows = require('vows'),
    http = require('http'),
    assert = require('assert'),
    fs = require('fs'),
    TestServer = require('./test-server').TestServer,
    extractContent = require('../src/contentextractor').extractContent;

var testServer = new TestServer()

// Path -> (String -> Unit)
function fetchOverHttp(path, callback) {
    var httpClient = http.createClient(testServer.config.server.port, 'localhost');
    var request = httpClient.request('GET', path, {host: 'localhost'});
    request.connection.setTimeout(1000);
    request.on('response', function (response) {
        response.setEncoding('utf8');
        extractContent(response, function(content) {
            callback(content);
        });
    });
    request.end();
}

var staticContent = {
    "When requesting static file" : {
        "from existing file" : {
            topic: function() {
                fetchOverHttp("/index.html", this.callback)
            },

            'file is served' : function(content, _) {
                assert.equal(content, fs.readFileSync('html/index.html').toString());
            }
        },
        "from non-existing file" : {
            topic: function() {
                fetchOverHttp("/trolololo.html", this.callback)
            },

            'client is served with 404' : function(content, _) {
                assert.equal(content, "404 Not Found\n");
            }
        }
    },
    "When requesting Socket.io library" : {
        topic: function() {
            fetchOverHttp("/socket.io/socket.io.js", this.callback)
        },

        "client-side library is served" : function(libraryContent, _) {
            assert.isTrue(libraryContent.indexOf("Socket.IO client") > 0);
        }
    }
};

vows.describe('Serving static content from server')
        .addBatch(staticContent)
        .addBatch(testServer.tearDownBatch())
        .export(module);
