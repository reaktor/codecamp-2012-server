var inspect = require('util').inspect,
    _ = require('underscore')


var argsOnly = _.rest(_.without(process.argv, 'node'))
var itemCount = parseInt(argsOnly[0]),
    challengeName = argsOnly[1],
    timeout = parseInt(argsOnly[2]),
    capacity = parseInt(argsOnly[3]),
    challengeCount = parseInt(argsOnly[4])

var round = {"displayName":"Generated round","challenges":generateChallenges(challengeCount)}

function generateChallenges(count) {
    var challenges = []
    for (var c = 0; c < count; c++) {
        challenges.push(
        {
             "name": challengeName + c,
             "timeout": timeout,
             "contents": generateItems(itemCount),
             "capacity":capacity
         })
    }
    return challenges
}

function generateItems(count) {
    var items = []
    for (var id = 1; id <= count; id++) {
        items.push({ id: id, weight: Math.round(Math.random() * 1000), value: Math.round(Math.random() * 100)})
    }
    return items
}
console.log(JSON.stringify(round))