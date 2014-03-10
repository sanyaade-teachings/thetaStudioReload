// OLD CODE for executing commands.
// node-webkit has great support for this.

// Check: https://github.com/jjrdn/node-open
function openFolder(folderPath)
{
	try
	{
		var exec = require('child_process').exec;

		function puts(error, stdout, stderr)
		{
			//console.log('stdout: ' + stdout);
			//console.log('stderr: ' + stderr);
			//console.log('error: ' + error);
		}

		var isLinux = (OS.platform() === "linux")
		var isMac = (OS.platform() === "darwin")
		var isWindows = (OS.platform() === "win32")

		if (isLinux)
		{
			var command = 'nautilus "' + folderPath + '"'
			exec(command, puts)
		}
		else if (isMac)
		{
			var command = 'open "' + folderPath + '"'
			exec(command, puts)
		}
		else if (isWindows)
		{
			var command = 'explorer "' + folderPath + '"'
			exec(command, puts)
		}
		else
		{
			console.log('@@@ openFolder: Unknown platform: ' + OS.platform())
		}
	}
	catch (err)
	{
		console.log("ERROR in openFolder: " + err)
	}
}


/* TODO: DELETE
var darwin = vars.globals.localPlatform.indexOf("darwin") >= 0;
var linux = vars.globals.localPlatform.indexOf("linux") >=0;
if (darwin) {
	var command =
		"open "
		+ this.fixPathsUnix(vars.globals.rootWorkspacePath)
		+ vars.globals.fileSeparator
		+ this.fixPathsUnix(projectFolder)
		+ "/LocalFiles"
		;
} else if (linux) {
	var commandStat = fs.statSync("/usr/bin/nautilus");
	if(commandStat.isFile()) {
	  var command =
		  "nautilus "
		  + this.fixPathsUnix(vars.globals.rootWorkspacePath)
		  + vars.globals.fileSeparator
		  + this.fixPathsUnix(projectFolder)
		  + "/LocalFiles &"
		  ;
	} else {
	  var command =
		  "dolphin "
		  + this.fixPathsUnix(vars.globals.rootWorkspacePath)
		  + vars.globals.fileSeparator
		  + this.fixPathsUnix(projectFolder)
		  + "/LocalFiles &"
		  ;
	}
} else {
	var command =
		"explorer \""
		+ vars.globals.rootWorkspacePath
		+ vars.globals.fileSeparator
		+ projectFolder
		+ "\\LocalFiles\"";
}
*/
