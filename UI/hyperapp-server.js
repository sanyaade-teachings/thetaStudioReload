/*
File: server.js
Description: HyperApp server functionality.
Author: Mikael Kindborg
*/

/*** Modules used ***/

var WEBSERVER = require('./webserver')
var SOCKETIO = require('socket.io')
var FS = require('fs')

/*********************************/
/***       Server code         ***/
/*********************************/

/*** Server variables ***/

var mWebServer
var mIO
var mBasePath
var mAppPath
var mAppFile
var mIpAddress
var mWebServerPort = 4042    
var mSocketIoPort = 4043

/*** Server functions ***/

/**
 * Internal.
 */
function startWebServer(basePath, port, fun)
{
    var server = WEBSERVER.create()
    server.setBasePath(basePath)
    server.start(port)
    fun(server)
}

/**
 * Internal.
 */
function webServerHookFun(request, response, path)
{
	console.log(path)
	if (path == '/connect')
	{
		//console.log('client connection request')
		var page = FS.readFileSync('./connect.html', {encoding: 'utf8'})
		mWebServer.writeRespose(response, page, 'text/html')
		return true
	}
	else if (path == '/reloader')
	{
		var script = FS.readFileSync('./reloader-template.js', {encoding: 'utf8'})
		script += '("' + mIpAddress + '", true)'
		mWebServer.writeRespose(response, script, 'application/javascript')
		return true
	}
	else if (path == '/' + mAppFile)
	{
		var script = FS.readFileSync('./reloader-template.js', {encoding: 'utf8'})
		var scriptBegin = '<' + 'script' + '>\n'
		var scriptBeginSrc = '<' + 'script src='
		var scriptEnd = '</' + 'script' + '>\n'
		script =
			scriptBeginSrc +
			'"http://' + mIpAddress + ':4043/socket.io/socket.io.js">' +
			scriptEnd +
			scriptBegin +
			script + '("' + mIpAddress + '", false)' +
			scriptEnd
		var file = FS.readFileSync(mBasePath + mAppFile, {encoding: 'utf8'})
		file = insertReloaderScript(file, script)
		mWebServer.writeRespose(response, file, 'text/html')
		return true
	}
	else
	{
		return false
	}
}

// Insert the script at the template tag, if no template tag is
// found, insert at alternative locations in the document.
// TODO: Experimental and non-general code, improve and clean up.
function insertReloaderScript(file, script)
{
	// Is there a template tag?
	var hasTemplateTag = (-1 != file.indexOf('<!--hyperapp.reloader-->'))
	if (hasTemplateTag)
	{
		return file.replace('<!--hyperapp.reloader-->', script)
	}
	
	// Fallback: Insert last in head.
	// TODO: Rewrite to use regular expressions to capture more cases.
	var pos = file.indexOf('</head>')
	if (pos > -1)
	{
		return file.replace('</head>', script + '</head>')
	}
	
	// Fallback: Insert first in body.
	// TODO: Rewrite to use regular expressions to capture more cases.
	pos = file.indexOf('<body>')
	if (pos > -1)
	{
		return file.replace('<body>', script + '<body>')
	}
	
	// Fallback: Insert last in body.
	// TODO: Rewrite to use regular expressions to capture more cases.
	pos = file.indexOf('</body>')
	if (pos > -1)
	{
		return file.replace('</body>', script + '</body>')
	}
}

/**
 * External.
 */
function startServers()
{
	//mIO = SOCKETIO.listen(mSocketIoPort, {log: false})
	mIO = SOCKETIO.listen(mSocketIoPort)

	mIO.set('log level', 1)
	
	// Handle socket connections.
	mIO.sockets.on('connection', function(socket) 
	{
		console.log("Client connected")
		
		socket.on('logMessage', function(data)
		{
			displayLogMessage(data)
		})
		
		socket.on('evalResult', function(data)
		{
			displayEvalResult(data)
		})
		
		// Closure that holds socket connection.
		/*(function(socket)
		{
			//mSockets.push_back(socket)
			//socket.emit('news', { hello: 'world' });
			socket.on('unregister', function(data)
			{
				mSockets.remove(socket)
			})
		})(socket)*/
	})

	// Start web server.
	startWebServer(mBasePath, mWebServerPort, function(server)
	{
		mWebServer = server
		mWebServer.getIpAddress(function(address) {
			mIpAddress = address
		})
		mWebServer.setHookFun(webServerHookFun)
	})
}

/**
 * External.
 */
function getWebServerIpAndPort(fun)
{
	mWebServer.getIpAddress(function(address) {
		fun(address, mWebServerPort)
	})
}

/**
 * External.
 */
function setAppPath(appPath)
{
	if (appPath != mAppPath)
	{
		mAppPath = appPath
		var pos = mAppPath.lastIndexOf('/') + 1
		mBasePath = mAppPath.substr(0, pos)
		mAppFile = mAppPath.substr(pos)
		mWebServer.setBasePath(mBasePath)
	}
}

/**
 * External.
 */
function sendReload()
{
	//console.log("sending reload")
	mIO.sockets.emit('reload', {url: 'http://' + mIpAddress + ':4042/' + mAppFile})
}

function sendEvalJS(code)
{
	mIO.sockets.emit('evaljs', code)
}

function displayLogMessage(message)
{
	console.log('LOG: ' + message)
}

function displayEvalResult(result)
{
	console.log('EVALRES: ' + result)
}

// Display version info.
//document.querySelector('#info').innerHTML = 'node.js ' + process.version


/*********************************/
/*** Hot reload on file update ***/
/*********************************/

/*** File traversal variables ***/

var mLastReloadTime = Date.now()
var mTraverseNumDirecoryLevels = 0

/*** File traversal functions ***/

/**
 * External.
 */
function setTraverseNumDirectoryLevels(levels)
{
	mTraverseNumDirecoryLevels = levels
}

/**
 * External.
 */
function fileSystemMonitor()
{
	var filesUpdated = fileSystemMonitorWorker(mBasePath, mTraverseNumDirecoryLevels)
	if (filesUpdated)
	{
		sendReload()
		setTimeout(fileSystemMonitor, 1000)
	}
	else
	{
		setTimeout(fileSystemMonitor, 500)
	}
}

/**
 * Internal.
 * Return true if a file ahs been updated, otherwise false.
 */
function fileSystemMonitorWorker(path, level)
{
	if (!path) { return false }
	try
	{
		var files = FS.readdirSync(path)
		for (var i in files)
		{
			try
			{
				var stat = FS.statSync(path + files[i])
				var t = stat.mtime.getTime()
				//console.log(files[i] + ": " + stat.mtime)
				if (stat.isFile() && t > mLastReloadTime)
				{
					mLastReloadTime = Date.now()
					return true
				}
				else if (stat.isDirectory() && level > 0)
				{
					//console.log('decending into: ' + path + files[i])
					return fileSystemMonitorWorker(path + files[i] + "/", level - 1)
				}
			}
			catch(err2)
			{
				//console.log('***** ERROR ****** ' + err)
			}
		}
	}
	catch(err1)
	{
	}
	return false
}

/*console.log(mBasePath)
var files = FS.readdirSync(mBasePath)
for (var i in files)
{
	console.log(files[i])
}*/

/*********************************/
/***      Module exports       ***/
/*********************************/

exports.startServers = startServers
exports.getWebServerIpAndPort = getWebServerIpAndPort
exports.setAppPath = setAppPath
exports.sendReload = sendReload

exports.setTraverseNumDirectoryLevels = setTraverseNumDirectoryLevels
exports.fileSystemMonitor = fileSystemMonitor
