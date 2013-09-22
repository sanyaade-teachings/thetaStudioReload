// Load socket.io and open a connection to the server.
;(function(address, loadSocketIoFlag)
{
	var hyper = {}
	
    if (!window.hyper)
    {
        window.hyper = hyper
    }
    
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
        hyper.IoSocket.emit('jsResult', result)
    }
    
    // Log to UI.
    hyper.log = function(message)
    {
        hyper.IoSocket.emit('log', message)
    }
    
    // Called from native code.
    hyper.nativeConsoleMessageCallBack = function(message)
    {
        hyper.IoSocket.emit('log', message)
    }
    
    /*
    // Replace console.log
    window.console.log = function(message)
    {
        hyper.log(message)
    }
    */
    
    var url = 'http://' + address
       
    function connect()
    {
        var socket = io.connect(url + ':4043')
        hyper.IoSocket = socket
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
                hyper.sendJsResult(result)
            }
            catch (err)
            {
                hyper.sendJsResult(err)
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
