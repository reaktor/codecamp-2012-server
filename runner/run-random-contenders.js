var util = require('util'),
    cont = require('../test/contender'),
    config = require('./config').config;

config.contenders.forEach(function(contenderConfig) {
    var contender = cont.ContenderWhichReturnsNFirstItemsFromChallenge(1);
    contender.port = contenderConfig.port;
    contender.start();
});

