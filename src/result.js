// (Boolean, Int) -> Result
Result = function(ok, value, weight) {
    return { ok: ok, value: value, weight: weight }
}
exports.AcceptedResult = function(value, weight) {
    return Result(true, value, weight);
}
exports.FailedResult = function() {
    return Result(false, 0, [0]);
}
