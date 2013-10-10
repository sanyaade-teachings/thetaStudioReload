/*
File: hyper-server.js
Description: HyperReload server functionality.
Author: Mikael Kindborg
Copyright (c) 2013 Mikael Kindborg
*/

/*** Modules used ***/

var WEBSERVER = require('./webserver')
var SOCKETIO = require('socket.io')
var FS = require('fs')
var PATH = require('path')
var FILEUTIL = require('./fileutil.js')
var SETTINGS = require('../settings.js')

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
var mMessageCallback = null
var mNumberOfConnectedClients = 0
var mConnectedCallback = null
var mDisconnectedCallback = null

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
 * NOT USED.
 *
 * Internal.
 *
 * Version of webserver hook function used for serving iframe version.
 */
function webServerHookFunForIframe(request, response, path)
{
	// When the root is requested, we send the document with an
	// iframe that will load application pages.
	if (path == '/')
	{
		var page = FS.readFileSync('./application/hyper-client.html', {encoding: 'utf8'})
		mWebServer.writeRespose(response, page, 'text/html')
		return true
	}
	else
	{
		return false
	}
}

/**
 * Internal.
 *
 * Version of the webserver hook function that inserts the reloader 
 * script on each HTML page requested.
 */
function webServerHookFunForScriptInjection(request, response, path)
{
	//console.log('webServerHookFun path: ' + path)
	if (path == '/')
	{
		// If the root path is requested, send the connect page.
		var file = FS.readFileSync('./application/hyper-connect.html', {encoding: 'utf8'})
		file = insertReloaderScript(file)
		mWebServer.writeRespose(response, file, 'text/html')
		return true
	}
	else if (path == '/hyper.reloader')
	{
		// Send reloader script.
		var script = FS.readFileSync('./application/hyper-reloader.js', {encoding: 'utf8'})
		script = script.replace(
			'__SOCKET_IO_PORT_INSERTED_BY_SERVER__',
			SETTINGS.SocketIoPort)
		mWebServer.writeRespose(response, script, 'application/javascript')
		return true
	}
	else if (FILEUTIL.fileIsHTML(path))
	{
		// Insert reloader script into HTML page.
		var filePath = mBasePath + path.substr(1)
		var file = FS.readFileSync(filePath, {encoding: 'utf8'})
		file = insertReloaderScript(file)
		mWebServer.writeRespose(response, file, 'text/html')
		return true
	}
	else
	{
		// Use default processing for all other pages.
		return false
	}
}

/**
 * Internal.
 * 
 * Return script tags for reload functionality.
 */
function createReloaderScriptTags()
{
	return '' +
		'<script src="http://' + mIpAddress + 
		':' + SETTINGS.SocketIoPort + 
		'/socket.io/socket.io.js"></script>' +
		'<script src="/hyper.reloader"></script>'
}

/**
 * Internal.
 * 
 * Insert the script at the template tag, if no template tag is
 * found, insert at alternative locations in the document.
 *
 * It is desirable to have script tags inserted as early as possible,
 * to enable hyper.log and error reportning during document loading.
 *
 * TODO: Experimentalcode, can be improved.
 */
function insertReloaderScript(file)
{
	var script = createReloaderScriptTags()

	// Is there a template tag? In that case, insert script there.
	var hasTemplateTag = (-1 != file.indexOf('<!--hyper.reloader-->'))
	if (hasTemplateTag)
	{
		return file.replace('<!--hyper.reloader-->', script)
	}
	
	// Insert before title tag.
	var pos = file.indexOf('<title>')
	if (pos > -1)
	{
		return file.replace('<title>', script + '<title>')
	}

	// Insert after title tag.
	var pos = file.indexOf('</title>')
	if (pos > -1)
	{
		return file.replace('</title>', '</title>' + script)
	}
	
	// Insert last in head.
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
		return file.replace('<body>', '<body>' + script)
	}
	
	// Insert last in body.
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
	console.log('starServer')
	//mIO = SOCKETIO.listen(SETTINGS.SocketIoPort, {log: false})
	mIO = SOCKETIO.listen(SETTINGS.SocketIoPort)

	mIO.set('log level', 1)
	
	// Handle socket connections.
	mIO.sockets.on('connection', function(socket) 
	{
		++mNumberOfConnectedClients
	
		if (mConnectedCallback)
		{
			mConnectedCallback(mNumberOfConnectedClients)
		}

		// Debug logging.
		console.log('Client connected')
		console.log('mNumberOfConnectedClients: ' + mNumberOfConnectedClients)
		
		socket.on('disconnect', function ()
		{
			--mNumberOfConnectedClients

			if (mDisconnectedCallback)
			{
				mDisconnectedCallback(mNumberOfConnectedClients)
			}
			
			// Debug logging.
			console.log('Client disconnected')
			console.log('mNumberOfConnectedClients: ' + mNumberOfConnectedClients)
        })
    
		socket.on('hyper.log', function(data)
		{
			displayLogMessage(data)
		})
		
		socket.on('hyper.result', function(data)
		{
			//console.log('data result type: ' + (typeof data))
			//console.log('data result : ' + data)
			
			// Functions cause a cloning error.
			if (typeof data == 'function')
			{
				data = typeof data
			}
			displayJsResult(data)
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
	startWebServer(mBasePath, SETTINGS.WebServerPort, function(server)
	{
		mWebServer = server
		mWebServer.getIpAddress(function(address)
		{
			mIpAddress = ensureIpAddress(address)
		})
		mWebServer.setHookFun(webServerHookFunForScriptInjection)
	})
}

/**
 * External.
 */
function getWebServerIpAndPort(fun)
{
	mWebServer.getIpAddress(function(address)
	{
		fun(ensureIpAddress(address), SETTINGS.WebServerPort)
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
		var pos = mAppPath.lastIndexOf(PATH.sep) + 1
		mBasePath = mAppPath.substr(0, pos)
		mAppFile = mAppPath.substr(pos)
		mWebServer.setBasePath(mBasePath)
	}
}

/**
 * External.
 * Return the name of the main HTML file of the application.
 */
function getAppFileName()
{
	return mAppFile
}

/**
 * External.
 */
function getAppFileURL()
{
	return 'http://' + mIpAddress + ':' + SETTINGS.WebServerPort + '/' + mAppFile
}

/**
 * External.
 */
function getServerBaseURL()
{
	return 'http://' + mIpAddress + ':' + SETTINGS.WebServerPort + '/'
}

/**
 * External.
 * Reloads the main HTML file of the current app.
 */
function runApp()
{
	mIO.sockets.emit('hyper.run', {url: getAppFileURL()})
}

/**
 * External.
 * Reloads the currently visible page of the browser.
 */
function reloadApp()
{
	mIO.sockets.emit('hyper.reload', {})
}

/**
 * External.
 */
function evalJS(code)
{
	mIO.sockets.emit('hyper.eval', code)
}

/**
 * External.
 * 
 * Callback form: fun(object)
 */
function setMessageCallbackFun(fun)
{
	mMessageCallback = fun
}

/**
 * External.
 * 
 * Callback form: fun(numberOfConnectedClients)
 */
function setConnenctedCallbackFun(fun)
{
	mConnectedCallback = fun
}

/**
 * External.
 * 
 * Callback form: fun(numberOfConnectedClients)
 */
function setDisconnenctedCallbackFun(fun)
{
	mDisconnectedCallback = fun
}

/**
 * External.
 */
function getNumberOfConnectedClients()
{
	return mNumberOfConnectedClients
}

/**
 * Internal.
 */
function ensureIpAddress(address)
{
	return address || '127.0.0.1'
}

/**
 * Internal.
 */
function displayLogMessage(message)
{
	if (mMessageCallback)
	{
		mMessageCallback({ message: 'log', logMessage: message })
	}
}

/**
 * Internal.
 */
function displayJsResult(result)
{
	if (mMessageCallback)
	{
		mMessageCallback({ message: 'jsResult', result: result })
	}
}

// Display version info.
//document.querySelector('#info').innerHTML = 'node.js ' + process.version


/*********************************/
/*** Hot reload on file update ***/
/*********************************/

/*** File traversal variables ***/

var mLastReloadTime = Date.now()
var mTraverseNumDirecoryLevels = 0
var mFileCounter = 0
var mNumberOfMonitoredFiles = 0

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
function getNumberOfMonitoredFiles()
{
	return mNumberOfMonitoredFiles
}

/**
 * External.
 */
function fileSystemMonitor()
{
	mFileCounter = 0
	var filesUpdated = fileSystemMonitorWorker(
		mBasePath,
		mTraverseNumDirecoryLevels)
	if (filesUpdated)
	{
		reloadApp()
		setTimeout(fileSystemMonitor, 1000)
	}
	else
	{
		mNumberOfMonitoredFiles = mFileCounter
		setTimeout(fileSystemMonitor, 500)
	}
}

/**
 * Internal.
 * Return true if a file ahs been updated, otherwise false.
 */
function fileSystemMonitorWorker(path, level)
{
	//console.log('fileSystemMonitorWorker path:level: ' + path + ':' + level)
	if (!path) { return false }
	try
	{
		/*var files = FS.readdirSync(path)
		for (var i in files)
		{
			console.log(path + files[i])
		}
		return false*/
		
		var files = FS.readdirSync(path)
		for (var i in files)
		{
			try
			{
				var stat = FS.statSync(path + files[i])
				var t = stat.mtime.getTime()

				if (stat.isFile())
				{
					++mFileCounter
				}

				//console.log('Checking file: ' + files[i] + ': ' + stat.mtime)
				if (stat.isFile() && t > mLastReloadTime)
				{
					console.log('***** File has changed ***** ' + files[i])
					mLastReloadTime = Date.now()
					return true
				}
				else if (stat.isDirectory() && level > 0)
				{
					//console.log('Decending into: ' + path + files[i])
					var changed = fileSystemMonitorWorker(
						path + files[i] + PATH.sep,
						level - 1)
					if (changed) { return true }
				}
			}
			catch (err2)
			{
				console.log('***** ERROR2 fileSystemMonitorWorker ****** ' + err2)
			}
		}
	}
	catch(err1)
	{
		console.log('***** ERROR1 fileSystemMonitorWorker ****** ' + err1)
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
exports.getAppFileName = getAppFileName
exports.getAppFileURL = getAppFileURL
exports.getServerBaseURL = getServerBaseURL
exports.runApp = runApp
exports.reloadApp = reloadApp
exports.evalJS = evalJS
exports.setMessageCallbackFun = setMessageCallbackFun
exports.setConnenctedCallbackFun = setConnenctedCallbackFun
exports.setDisconnenctedCallbackFun = setDisconnenctedCallbackFun
exports.getNumberOfConnectedClients = getNumberOfConnectedClients
exports.setTraverseNumDirectoryLevels = setTraverseNumDirectoryLevels
exports.getNumberOfMonitoredFiles = getNumberOfMonitoredFiles
exports.fileSystemMonitor = fileSystemMonitor
