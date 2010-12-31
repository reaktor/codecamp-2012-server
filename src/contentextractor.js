exports.extractContent = function(response, contentHandler) {
    var content = "";
    response.on('data', function (chunk) {
        content += chunk;
    });
    response.on('end', function() {
        contentHandler(content)
    });
}

