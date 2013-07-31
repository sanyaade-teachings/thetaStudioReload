// Load socket.io and open a connection to the server.
;(function(address, loadSocketIoFlag)
{ 
    if (!window.hyperapp)
    {
        window.hyperapp = {}
    }
    
    // Connection notifications.
	window.hyperapp.isConnected = false
    window.hyperapp.onConnectedFun = null
    window.hyperapp.onConnected = function(fun)
    {
		if (window.hyperapp.isConnected)
		{
			// Already connected.
			fun()
		}
		else
		{
			// Call when connected.
			window.hyperapp.onConnectedFun = fun
		}
	}
	
	// Send result of evaluating JS to the UI.
    window.hyperapp.sendEvalResult = function(result)
    {
        hyperapp.IoSocket.emit('evalResult', result)
    }
    
    // Log to UI.
    window.hyperapp.log = function(message)
    {
        hyperapp.IoSocket.emit('logMessage', message)
    }
    
    // Called from native code.
    window.hyperapp.nativeConsoleMessageCallBack = function(message)
    {
        hyperapp.IoSocket.emit('logMessage', message)
    }
    
    /*
    // Replace console.log
    window.console.log = function(message)
    {
        window.hyperapp.log(message)
    }
    */
    
    var url = 'http://' + address
       
    function connect()
    {
        var socket = io.connect(url + ':4043')
        window.hyperapp.IoSocket = socket
        socket.on('reload', function(data)
        {
            socket.disconnect()
            window.location.replace(data.url)
        })
        socket.on('evaljs', function(data)
        {
            try
            {
                var result = eval(data)
                window.hyperapp.sendEvalResult(result)
            }
            catch (err)
            {
                window.hyperapp.sendEvalResult(err)
            } 
        })
        socket.on('connect', function()
        {
			window.hyperapp.isConnected = true
            if (window.hyperapp.onConnectedFun)
            {
				window.hyperapp.onConnectedFun()
			}
        })
    }
    
    // Load socket.io by inserting a script element.
    // Call fun when loaded.
    function loadSocketIoThen(fun)
    {
        var script = document.createElement('script')
        //script.type = 'text/javascript' // Not needed by HTML5
        script.src = url + ':4043/socket.io/socket.io.js'
        script.onload = fun
        document.body.appendChild(script)
    }
    
    if (loadSocketIoFlag)
    {
		// Load socket.io, then connect.
		loadSocketIoThen(connect)
	}
	else
	{
		// socket.io already loaded, connect directly.
		connect()
	}
	
    // Note: Arguments to this function block inserted by the server script.
})
