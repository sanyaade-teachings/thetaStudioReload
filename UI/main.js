var WebServer = require('./WebServer')

function StartWebServer(basePath, port, fun)
{
    var server = WebServer.create()
    server.setBasePath(basePath)
    server.start(port)
    fun(server)
}

exports.startWebServer = StartWebServer
