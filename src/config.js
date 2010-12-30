var exists = require('path').exists,
    fs = require('fs');

exports.readJson = function (fileLocation, defaultFileLocation) {
    return JSON.parse(fs.readFileSync(fileLocation || defaultFileLocation))
}
