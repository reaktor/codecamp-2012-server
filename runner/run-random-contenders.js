var util = require('util'),
    cont = require('../test/contender'),
    readJson = require('../src/config').readJson;
config = readJson('config/config.json')

function startContender(contender, contenderConfig) {
    contender.port = contenderConfig.port;
    contender.start();
}

startContender(cont.ContenderWhichReturnsNFirstItemsFromChallenge(1), config.contenders[0]);
startContender(cont.RandomContender(), config.contenders[1]);
startContender(cont.RandomContender(), config.contenders[2]);
startContender(cont.ContenderWithEmptyResponse(13000), config.contenders[3]);