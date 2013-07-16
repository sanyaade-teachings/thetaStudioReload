(function(address)
{
    var url = 'http://' + address
    
    // Load socket.io
    var script = document.createElement('script')
    //script.type = 'text/javascript' // Not needed by HTML5
    script.src = url + ':4043/socket.io/socket.io.js'
    //console.log("socketio url: " + url + ':4043/socket.io/socket.io.js')
    script.onload = reloadHandler
    document.body.appendChild(script)
    
    // Will be run when socket.io is loaded.
    function reloadHandler()
    {
        var socket = io.connect(url + ':4043');
        //console.log('connection to server')
        socket.on('reload', function(data)
        {
            //console.log('got reload')
            socket.disconnect()
            window.location.href = data.url
            // socket.emit('my other event', { my: 'data' })
        })
    }
/* 
   The address is supplied at the end of the file 
   by the application, e.g:
   ("127.0.0.1") 
   TODO: Add port number params to avoid hard coding them.
*/
})