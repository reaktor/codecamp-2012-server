var util = require('util'),
    cont = require('../test/contender'),
    readJson = require('../src/config').readJson;
config = readJson('config/config.json')

function startContender(contender, contenderConfig) {
    contender.port = contenderConfig.port;
    contender.start();
}

startContender(cont.RandomContender().setDelay(1000), config.contenders[0]);
startContender(cont.RandomContender().setDelay(2000), config.contenders[1]);
startContender(cont.RandomContender().setDelay(5000), config.contenders[2]);
startContender(cont.RandomContender().setDelay(3000), config.contenders[3]);
