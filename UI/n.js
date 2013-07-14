
var OS = require('os')

function GetIP()
{
    var interfaces = OS.networkInterfaces()
    console.log(interfaces)
    
    var addresses = [];
    for (var interfaceName in interfaces) {
        for (var i in interfaces[interfaceName]) {
            var address = interfaces[interfaceName][i];
            if (address.family == 'IPv4' && !address.internal) {
                addresses.push(address.address)
            }
        }
    }
    console.log(addresses)
}

GetIP()
