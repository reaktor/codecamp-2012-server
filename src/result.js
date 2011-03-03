// (Boolean, Int) -> Result
Result = function(ok, value, weight, message) {
    return { ok: ok, value: value, weight: weight, message: message }
}
exports.AcceptedResult = function(value, weight) {
    return Result(true, value, weight, "");
}
exports.FailedResult = function(message) {
    return Result(false, 0, [0], message);
}
