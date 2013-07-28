;(function(address)
{
    if (!window.comikit)
    {
		window.comikit = {}
	}
	
	window.comikit.sendEvalResult = function(result)
	{
		comikit.IoSocket.emit('evalResult', result)
	}
	
	window.comikit.sendLogMessage = function(message)
	{
		comikit.IoSocket.emit('logMessage', message)
	}
	/*
	window.console.log = function(message)
	{
		window.comikit.sendLogMessage(message)
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
        window.comikit.IoSocket = socket
        //console.log('connection to server')
        socket.on('reload', function(data)
        {
            socket.disconnect()
            window.location.href = data.url
            // socket.emit('my other event', { my: 'data' })
        })
        socket.on('evaljs', function(data)
        {
            try
            {
				var result = eval(data)
				window.comikit.sendEvalResult(result)
			}
			catch (err)
			{
				window.comikit.sendEvalResult(err)
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
