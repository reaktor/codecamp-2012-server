var mannapuuro = require('../src/mannapuuro'),
        inspect = require('util').inspect,
        _ = require('underscore'),
        readJson = require('../src/config').readJson;

var argsOnly = _.rest(_.without(process.argv, 'node'))

config = readJson(argsOnly[0], "config/config.json");
round = readJson(argsOnly[1], "config/round-config.json");

new mannapuuro.Main(config, round);