var _ = require('underscore'),
    FailedResult = require('./result').FailedResult,
    AcceptedResult = require('./result').AcceptedResult

// { contents: [Item], capacity: Int } -> Challenge
exports.Challenge = function(challenge) {
    // Int -> Item
    var itemById = function(id) {
        return _.detect(challenge.contents, function(item) {
            return item.id == id;
        });
    }
    // [Item] -> (Item -> Int) -> Int
    var sum = function(items, f) {
        return _.reduce(items, function(acc, item) {
            return acc + f(item)
        }, 0);
    }
    // [ItemId] -> Result
    var determineResult = function(itemIds) {
        if (!_.isArray(itemIds))  return new FailedResult()
        if (!_.isEqual(_.uniq(itemIds), itemIds)) return new FailedResult()
        var chosenItems = itemIds.map(itemById);
        if (chosenItems.length != _.compact(chosenItems).length) return new FailedResult()
        var weight = sum(chosenItems, function(i) { return i.weight });
        if (weight > challenge.capacity) {
            return new FailedResult()
        } else {
            var value = sum(chosenItems, function(i) {
                return i.value
            });
            return new AcceptedResult(value, weight)
        }
    }
    return {
        name: challenge.name,
        timeout: challenge.timeout,
        resultFor: determineResult,
        toString: function() { return challenge.name },
        toJSON : function() {return JSON.stringify(challenge)}
    }
}