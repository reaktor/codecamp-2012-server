var mannapuuro = require('../src/mannapuuro'),
        inspect = require('util').inspect,
        _ = require('underscore'),
        exists = require('path').exists,
        fs = require('fs');

var argsOnly = _.rest(_.without(process.argv, 'node'))

function readJson(fileLocation, defaultFileLocation) {
    return JSON.parse(fs.readFileSync(fileLocation || defaultFileLocation))
}

config = readJson(argsOnly[0], "config/config.json");
round = readJson(argsOnly[1], "config/round-config.json");

new mannapuuro.Main(config, round);