// (Boolean, Int) -> Result
exports.Result = function(ok, value, weight) {
    return { ok: ok, value: value, weight: weight }
}
