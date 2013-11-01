/*
File: hyper-reloader.js
Description: This code is loaded by the server
when the reloader script is requested.
Author: Mikael Kindborg
Copyright (c) 2013 Mikael Kindborg
*/

;window.hyper = (function(hyper, socketIoPort)
{
	// Connection notifications.
	hyper.isConnected = false
	hyper.onConnectedFun = null
	hyper.onConnected = function(fun)
	{
		if (hyper.isConnected)
		{
			// Already connected.
			fun()
		}
		else
		{
			// Call when connected.
			hyper.onConnectedFun = fun
		}
	}

	// Send result of evaluating JS to the UI.
	hyper.sendJsResult = function(result)
	{
		hyper.IoSocket.emit('hyper.result', result)
	}

	// Log to remote HyperReload Workbench window.
	hyper.rlog = function(message)
	{
		hyper.IoSocket.emit('hyper.log', message)
	}

	// If you want, you can set hyper.log to console.log in your code.
	hyper.log = hyper.log || hyper.rlog

	// Called from native code. NOT USED.
	hyper.nativeConsoleMessageCallBack = function(message)
	{
		hyper.log(message)
	}

	window.onerror = function(msg, url, linenumber)
	{
		// Strip off hostname from url.
		var pos = url.indexOf('//', 0)
		pos = url.indexOf('/', pos + 2)
		var file = url.substring(pos + 1)
		hyper.log('[ERR] ' + msg + ' [' + file + ': ' + linenumber + ']')
		return true
	}

	var baseUrl = 'http://' + window.location.hostname

	function connect()
	{
		var socket = io.connect(
			baseUrl + ':' + socketIoPort,
			{ 'sync disconnect on unload': true })
		hyper.IoSocket = socket
		socket.on('hyper.run', function(data)
		{
			socket.disconnect()
			window.location.replace(data.url)
		})
		socket.on('hyper.reload', function(data)
		{
			socket.disconnect()
			window.location.reload(true)
		})
		socket.on('hyper.eval', function(data)
		{
			try
			{
				var result = eval(data)
				hyper.sendJsResult(result)
			}
			catch (err)
			{
				hyper.sendJsResult('[ERR] ' + err)
			}
		})
		socket.on('connect', function()
		{
			hyper.isConnected = true
			if (hyper.onConnectedFun)
			{
				hyper.onConnectedFun()
			}
		})
	}

	// Initiate connection sequence.
	connect()

	return hyper

})(window.hyper || {}, __SOCKET_IO_PORT_INSERTED_BY_SERVER__);
