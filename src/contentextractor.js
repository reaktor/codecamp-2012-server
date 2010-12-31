exports.extractContent = function(response, contentHandler, encoding) {
    if (encoding) response.setEncoding(encoding);
    var content = "";
    response.on('data', function (chunk) {
        content += chunk;
    });
    response.on('end', function() {
        contentHandler(content)
    });
}

