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
        if (!_.isArray(itemIds))  return new FailedResult("not an array")
        if (!_.isEqual(_.uniq(itemIds), itemIds)) return new FailedResult("duplicate items")
        var chosenItems = itemIds.map(itemById);
        if (chosenItems.length != _.compact(chosenItems).length) return new FailedResult("dups")

        var dimensions = challenge.capacity.length
        var weights = _.map(_.range(0, dimensions), function(d) {
          return sum(chosenItems, function(i) { return i.weight[d] })
        })
        for (var d = 0; d < dimensions; d = d+1) {
            if (!checkCapacity(chosenItems, 
                               function(i) { return i.weight[d] }, 
                               function() { return challenge.capacity[d] } )) {
              return new FailedResult("constraint failed " + d)
            }
        }
        
        var value = sum(chosenItems, function(i) { return i.value })
        return new AcceptedResult(value, weights)
    }
    // [ItemId] -> (ItemId -> Int) -> (() -> Int) -> Bool
    var checkCapacity = function(chosenItems, weightF, capacityF) {
        var weight = sum(chosenItems, function(i) { return weightF(i) });
        if (weight > capacityF()) {
            return false
        } else {
            return true
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