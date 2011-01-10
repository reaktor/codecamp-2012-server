exports.Contender = function(contender) {
    return {
        toString: function() { return contender.name },
        isRabbit: function() { return contender.rabbit },
        name: contender.name,
        host: contender.host,
        port: contender.port
    }
}