/*
File: hyper-reloader.js
Description: This code is loaded by the server
when the reloader script is requested.
Author: Mikael Kindborg
Copyright (c) 2013 Mikael Kindborg
*/

;window.hyper = (function(hyper, socketIoPort)
{
	// Measure page load time in a way that works on all platforms.
	hyper.documentLoadTime = Date.now()
	document.addEventListener('load', function(event)
	{
		hyper.log("Page loaded")
		hyper.documentLoadTime = Date.now() - hyper.documentLoadTime
  	})

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
			// If this page took long to load, show a message
			// when reloading.
			;(hyper.documentLoadTime > 800) && hyper.showMessage('Loading')
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
			socket.emit('hyper.client-connected', null)
			hyper.isConnected = true
			if (hyper.onConnectedFun)
			{
				hyper.onConnectedFun()
			}
		})
	}

	/**
	 * Displays a message box similar to a Toast on Android.
	 */
	hyper.showMessage = function(message, id, duration)
	{
		var toast = document.createElement('div')
		var width = Math.min(
			message.length * 16,
			window.innerWidth - 40)
		var left = ((window.innerWidth - width) / 2) - 10 //padding

		toast.id = id || 'hyper-message'
		toast.style.width = width + 'px'
		toast.style.position = 'absolute'
		toast.style.left = left + 'px'
		toast.style.bottom = '40px'
		toast.style.padding = '10px 20px'
		toast.style.borderRadius = '8px'
		toast.style.MozBorderRadius = '8px'
		toast.style.WebkitBorderRadius = '8px'
		toast.style.background = '#FFFFFF'
		toast.style.border = '1px solid #000000'
		toast.style.fontFamily = 'sans-serif'
		toast.style.fontSize = '18px'
		toast.style.fontWeight = 'bold'
		toast.style.color = '#000000'
		toast.style.textAlign = 'center'
		toast.style.visibility = 'visible'
		toast.style.zIndex = '9000000'
		toast.innerHTML = message

		document.body.appendChild(toast)

		if (duration)
		{
			setTimeout(
				function()
				{
					document.body.removeChild(toast)
				},
				duration)
		}
	}

	/**
	 * Hides the message box.
	 */
	hyper.hideMessage = function(id)
	{
		var toast  = document.getElementById(id || 'hyper-message')
		document.body.removeChild(toast)
	}

	// Initiate connection sequence.
	connect()

	return hyper

})(window.hyper || {}, __SOCKET_IO_PORT_INSERTED_BY_SERVER__);
