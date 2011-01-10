exports.Contender = function(contender) {
    return {
        toString: function() { return contender.name },
        name: contender.name,
        host: contender.host,
        port: contender.port
    }
}