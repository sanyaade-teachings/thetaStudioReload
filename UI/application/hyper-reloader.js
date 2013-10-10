/*
File: hyper-reloader.js
Description: This code is loaded by the server 
when the reloader script is requested.
Author: Mikael Kindborg
Copyright (c) 2013 Mikael Kindborg
*/

;window.hyper = (function(socketIoPort)
{
	var hyper = {}
    
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
    
    // Log to UI.
    hyper.log = function(message)
    {
        hyper.IoSocket.emit('hyper.log', message)
    }
    
    // Called from native code.
    hyper.nativeConsoleMessageCallBack = function(message)
    {
        hyper.log(message)
    }
    
    /*
    // Replace console.log
    window.console.log = function(message)
    {
        hyper.log(message)
    }
    */

    var baseUrl = 'http://' + window.location.hostname
       
    function connect()
    {
        var socket = io.connect(baseUrl + ':' + socketIoPort)
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
})(__SOCKET_IO_PORT_INSERTED_BY_SERVER__)
