/*
File: hyper-server.js
Description: HyperReload server functionality.
Author: Mikael Kindborg

License:

Copyright (c) 2013 Mikael Kindborg

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/*** Modules used ***/

var OS = require('os')
var SOCKETIO = require('socket.io')
var FS = require('fs')
var PATH = require('path')
var FILEUTIL = require('./fileutil.js')
var WEBSERVER = require('./webserver')
var SETTINGS = require('../settings/settings.js')

/*********************************/
/***	   Server code		   ***/
/*********************************/

/*** Server variables ***/

var mWebServer
var mIO
var mBasePath
var mAppPath
var mAppFile
var mIpAddress
var mMessageCallback = null
var mClientConnectedCallback = null
var mReloadCallback = null

/*** Server functions ***/

/**
 * NOT USED.
 *
 * Internal.
 *
 * Version of webserver hook function used for serving iframe version.
 */
/*
function webServerHookFunForIframe(request, response, path)
{
	// When the root is requested, we send the document with an
	// iframe that will load application pages.
	if (path == '/')
	{
		var page = FS.readFileSync('./hyper/server/hyper-client.html', {encoding: 'utf8'})
		mWebServer.writeRespose(response, page, 'text/html')
		return true
	}
	else
	{
		return false
	}
}
*/

/**
 * Internal.
 *
 * Version of the webserver hook function that inserts the reloader
 * script on each HTML page requested.
 */
function webServerHookFunForScriptInjection(request, response, path)
{
	// Update the server address on every request (overkill but simple).
	// Note: If connecting using 'localhost' or '127.0.0.1' this
	// will break existing wifi connections! This should be fixed and/or
	// documented.
	mIpAddress = request.socket.address().address

	if (path == '/')
	{
		return serveRootRequest(request, response)
	}
	else if (path == '/hyper.reloader')
	{
		return serveReloaderScript(response)
	}
	else if (SETTINGS.ServeCordovaJsFiles &&
		(path == '/cordova.js' ||
		path == '/cordova_plugins.js' ||
		path.indexOf('/plugins/') == 0))
	{
		return serveCordovaFile(request, response, path)
	}
	else if (mBasePath && FILEUTIL.fileIsHTML(path))
	{
		return serveHtmlFileWithScriptInjection(request, response, path)
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
 * Serve root file.
 */
function serveRootRequest(request, response)
{
	// Root path is requested, send the current page if set.
	if (mAppPath)
	{
		console.log('@@@ serving mAppPath: ' + mAppPath)
		return serveHtmlFile(
			request,
			response,
			mAppPath)
	}
	// Otherwise send the connect page.
	else
	{
		return serveHtmlFile(
			request,
			response,
			'./hyper/server/hyper-connect.html')
	}
}

/**
 * Internal.
 *
 * Serve reloader script.
 */
function serveReloaderScript(response)
{
	var script = FILEUTIL.readFileSync('./hyper/server/hyper-reloader.js')
	if (script)
	{
		script = script.replace(
			'__SOCKET_IO_PORT_INSERTED_BY_SERVER__',
			SETTINGS.SocketIoPort)
		mWebServer.writeRespose(response, script, 'application/javascript')
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
 * Serve HTML file. Will insert reloader script.
 */
function serveHtmlFileWithScriptInjection(request, response, path)
{
	var filePath = mBasePath + path.substr(1)
	return serveHtmlFile(
		request,
		response,
		filePath)
}

/**
 * Internal.
 *
 * Serve Cordova JavaScript file for the platform making the request.
 */
function serveCordovaFile(request, response, path)
{
	// If we are inside a cordova project, we use the
	// files in that project.
	// Folder structure:
	//   www <-- mBasePath (root of running app)
	//     index.html
	//   platforms
	//     android
	//       assets
	//         www
	//           cordova.js
	//           cordova_plugins.js
	//           plugins
	//     ios
	//       www
	//         cordova.js
	//         cordova_plugins.js
	//         plugins

	// Platform flags (boolean values)
	var isAndroid = request['headers']['user-agent'].indexOf('Android') > 0
	var isIOS = !isAndroid

	// Path to Cordova file in current project.
	// Note that mBasePath ends with path separator.
	var androidCordovaAppPath =
		mBasePath +
		'..' + PATH.sep +
		'platforms' + PATH.sep +
		'android' + PATH.sep +
		'assets' + PATH.sep +
		'www' + path
	var iosCordovaAppPath =
		mBasePath +
		'..' + PATH.sep +
		'platforms' + PATH.sep +
		'ios' + PATH.sep +
		'www' + path

	// Path to Cordova file in HyperReload library.
	var androidCordovaLibPath = './hyper/libs-cordova/android' + path
	var iosCordovaLibPath = './hyper/libs-cordova/ios' + path

	/*
	console.log('@@@ mBasePath: ' + mBasePath)
	console.log('@@@ androidCordovaAppPath: ' + androidCordovaAppPath)
	console.log('@@@ iosCordovaAppPath: ' + iosCordovaAppPath)
	console.log('@@@ androidCordovaLibPath: ' + androidCordovaLibPath)
	console.log('@@@ iosCordovaLibPath: ' + iosCordovaLibPath)
	*/

	if (isAndroid)
	{
		if (serveJsFile(response, androidCordovaAppPath)) { return true }
		if (serveJsFile(response, androidCordovaLibPath)) { return true }
		return false
	}

	if (isIOS)
	{
		if (serveJsFile(response, iosCordovaAppPath)) { return true }
		if (serveJsFile(response, iosCordovaLibPath)) { return true }
		return false
	}

	return false
}

/**
 * Internal.
 *
 * If file exists, serve it and return true, otherwise return false.
 * Insert the reloader script if file exists.
 */
function serveHtmlFile(request, response, path)
{
	var content = FILEUTIL.readFileSync(path)
	if (content)
	{
		content = insertReloaderScript(content, request)
		mWebServer.writeRespose(response, content, 'text/html')
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
 * If file exists, serve it and return true, otherwise return false.
 */
function serveJsFile(response, path)
{
	var content = FILEUTIL.readFileSync(path)
	if (content)
	{
		mWebServer.writeRespose(response, content, 'application/javascript')
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
 * Return script tags for reload functionality.
 */
function createReloaderScriptTags(address)
{
	return '' +
		'<script src="http://' + address +
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
 */
function insertReloaderScript(file, request)
{
	var host = request.headers.host
	var address = host.substr(0, host.indexOf(':'))
	//console.log('address ' + address)
	var script = createReloaderScriptTags(address)

	// Is there a template tag? In that case, insert script there.
	var hasTemplateTag = (-1 != file.indexOf('<!--hyper.reloader-->'))
	if (hasTemplateTag)
	{
		return file.replace('<!--hyper.reloader-->', script)
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
function getIpAddress(fun)
{
	fun(ensureIpAddress(mIpAddress))
}

/**
 * External.
 */
function getIpAddresses(fun)
{
	mWebServer.getIpAddresses(function(addresses)
	{
		fun(addresses)
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
	mReloadCallback && mReloadCallback()
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
 * Callback form: fun()
 */
function setClientConnenctedCallbackFun(fun)
{
	mClientConnectedCallback = fun
}

/**
 * External.
 */
function startServers()
{
	console.log('Starting servers')

	if (SETTINGS.ServerDiscoveryEnabled)
	{
		startUDPServer(SETTINGS.ServerDiscoveryPort || 4088)
	}

	startSocketIoServer()

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
 *
 * Callback form: fun()
 */
function setReloadCallbackFun(fun)
{
	mReloadCallback = fun
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
		mMessageCallback({ message: 'hyper.log', logMessage: message })
	}
}

/**
 * Internal.
 */
function displayJsResult(result)
{
	if (mMessageCallback)
	{
		mMessageCallback({ message: 'hyper.result', result: result })
	}
}

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
function startSocketIoServer()
{
	//mIO = SOCKETIO.listen(SETTINGS.SocketIoPort, {log: false})
	mIO = SOCKETIO.listen(SETTINGS.SocketIoPort)

	mIO.set('log level', 1)
	mIO.set('close timeout', 60 * 60 * 24)
	mIO.set('transports', ['xhr-polling'])
	mIO.set('browser client minification', true)
	mIO.set('polling duration', 5)

	// Handle socket connections.
	mIO.sockets.on('connection', function(socket)
	{
		// Debug logging.
		console.log('Client connected')

		socket.on('disconnect', function ()
		{
			// Debug logging.
			console.log('Client disconnected')
		})

		socket.on('hyper.client-connected', function(data)
		{
			// Debug logging.
			console.log('hyper.client-connected')

			mClientConnectedCallback && mClientConnectedCallback()
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
}

/**
 * Experimental.
 */
function startUDPServer(port)
{
	// Send info about this server back to the client.
	function sendServerInfo(info)
	{
		var serverData =
		{
			name: OS.hostname(),
			port: SETTINGS.WebServerPort
		}

		var message = new Buffer(JSON.stringify(serverData))

		server.send(
			message,
			0,
			message.length,
			info.port,
			info.address,
			function(err, bytes)
			{
			}
		)
	}

	// Create server socket.
	var DATAGRAM = require('dgram')
	var server = DATAGRAM.createSocket('udp4')

	// Set handler for incoming messages.
	server.on('message', function (msg, info)
	{
		if (msg == 'hyper.whoIsThere')
		{
			sendServerInfo(info)
		}
	})

	// Set handler for incoming messages.
	server.on('listening', function ()
	{
		// Not used: var address = server.address()
		console.log('UDP server listening')
	})

	// Bind server socket to port.
	server.bind(port)
}

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
					//console.log('***** File has changed ***** ' + files[i])
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
/***	  Module exports	   ***/
/*********************************/

exports.startServers = startServers
exports.getIpAddress = getIpAddress
exports.getIpAddresses = getIpAddresses
exports.setAppPath = setAppPath
exports.getAppFileName = getAppFileName
exports.getAppFileURL = getAppFileURL
exports.getServerBaseURL = getServerBaseURL
exports.runApp = runApp
exports.reloadApp = reloadApp
exports.evalJS = evalJS
exports.setMessageCallbackFun = setMessageCallbackFun
exports.setClientConnenctedCallbackFun = setClientConnenctedCallbackFun
exports.setReloadCallbackFun = setReloadCallbackFun
exports.setTraverseNumDirectoryLevels = setTraverseNumDirectoryLevels
exports.getNumberOfMonitoredFiles = getNumberOfMonitoredFiles
exports.fileSystemMonitor = fileSystemMonitor
