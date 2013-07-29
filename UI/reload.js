;(function(address)
{
    if (!window.hyperapp)
    {
		window.hyperapp = {}
	}
	
	window.hyperapp.sendEvalResult = function(result)
	{
		hyperapp.IoSocket.emit('evalResult', result)
	}
	
	window.hyperapp.sendLogMessage = function(message)
	{
		hyperapp.IoSocket.emit('logMessage', message)
	}
	
	window.hyperapp.nativeConsoleMessageCallBack = function(message)
	{
		hyperapp.IoSocket.emit('logMessage', message)
	}
	
	/*
	window.console.log = function(message)
	{
		window.hyperapp.sendLogMessage(message)
	}
	*/
	
	var url = 'http://' + address
		
    // Load socket.io
    function loadSocketIo()
    {
		var script = document.createElement('script')
		//script.type = 'text/javascript' // Not needed by HTML5
		script.src = url + ':4043/socket.io/socket.io.js'
		//console.log("socketio url: " + url + ':4043/socket.io/socket.io.js')
		script.onload = reloadHandler
		document.body.appendChild(script)
	}
	
    // Will be run when socket.io library is loaded.
    function reloadHandler()
    {
        var socket = io.connect(url + ':4043')
        window.hyperapp.IoSocket = socket
        //console.log('connection to server')
        socket.on('reload', function(data)
        {
            socket.disconnect()
            window.location.replace(data.url)
            // socket.emit('my other event', { my: 'data' })
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
        displayConnectedMessage()
    }
    
    function displayConnectedMessage()
    {
		var element = document.querySelector('#connect-status')
		if (element)
		{
			element.innerHTML = 'Connected'
		}
	}
	
    loadSocketIo()
/* 
   The address is supplied at the end of the file 
   by the application, e.g:
   ("127.0.0.1") 
   TODO: Add port number params to avoid hard coding them.
*/
})
