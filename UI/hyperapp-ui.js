// Code below is split into two parts, one for the UI 
// and one for ther server. This is to prepare for an
// eventual headless version of HyperApp. Code currently
// contains serveral dependencies, however.

// Global object that holds globally available functions.
var hyperapp = {}

// UI-related functions.
hyperapp.UI = {}

// UI setup.
;(function()
{
	var mWorkbenchWindow = null
	var mDocumentationWindow = null
	
	function setupUI()
	{
		styleUI()
		setUIActions()
		setUpFileDrop()
	}
	
	function styleUI()
	{
		// Apply jQuery UI button style.
		//$('button').button()
		
		// Set layout properties.
		/*
		$('body').layout(
		{ 
			west: { size: 400 },
			center: { maskContents: true },
			fxName: 'none'
		})
		*/
	}
	
	function setUIActions()
	{
		// Workbench button action.
		$('#button-workbench').click(function()
		{
			if (mWorkbenchWindow && !mWorkbenchWindow.closed)
			{
				// Bring existing window to front.
				mWorkbenchWindow.focus()
			}
			else
			{
				// Create new window.
				mWorkbenchWindow = window.open(
					'hyperapp-workbench.html', 
					'workbench',
					'resizable=1,width=800,height=600')
				mWorkbenchWindow.moveTo(50, 50)
				// Establish contact. Not needed/used.
				mWorkbenchWindow.postMessage({ message: 'hello' }, '*')
			}
		})
		
		// Documentation button action.
		$('#button-documentation').click(function()
		{
			if (mDocumentationWindow && !mDocumentationWindow.closed)
			{
				// Bring existing window to front.
				mDocumentationWindow.focus()
			}
			else
			{
				// Create new window.
				mDocumentationWindow = window.open(
					'https://github.com/divineprog/hyperapp', 
					'documentation',
					'resizable=1,width=800,height=600')
				mDocumentationWindow.moveTo(50, 50)
			}
		})
		
		// Reorder of project list by drag and drop.
		$(function() 
		{
			$('#project-list').sortable(
			{
				stop: function() 
				{
					updateProjectList()
				}
			})
			$('#project-list').disableSelection()
		})
		
		// Message handler.
		window.addEventListener('message', receiveMessage, false)
	}
	
	function receiveMessage(event)
	{
		console.log('Main got : ' + event.data.message)
		if ('eval' == event.data.message)
		{
			hyperapp.SERVER.sendEvalJS(event.data.code)
		}
	}
	
	function setUpFileDrop()
	{
		var originalDropTaget = null
		
		// Block change page on drop.
		window.ondragover = function(e) { e.preventDefault(); return false }
		window.ondragend = function(e) { e.preventDefault(); return false }
		window.ondrop = function(e) { e.preventDefault(); return false }

		// Set up drop handling using a drop target overlay area.
		var dropTarget = $('#panel-page')
		dropTarget.on('dragenter', function(e) 
		{
			e.stopPropagation()
			e.preventDefault()
			$('#drag-overlay').show();
		})
		$('#drag-overlay').on('dragleave dragend', function(e) 
		{
			e.stopPropagation()
			e.preventDefault()
			$('#drag-overlay').hide();
		})
		$('#drag-overlay').on('drop', function(e) 
		{
			e.stopPropagation()
			e.preventDefault()
			$('#drag-overlay').hide();
			handleFileDrop(e.originalEvent.dataTransfer.files)
		})
	}
	
	function handleFileDrop(files)
	{
		// Debug print.
		/*for (var i = 0; i < files.length; ++i) 
		{
			console.log(files[i].path);
		}*/
		
		if (files.length > 0)
		{
			var path = files[0].path
			if (fileIsHTML(path))
			{
				hyperapp.SERVER.setAppPath(path)
				hyperapp.addProject(path)
				createProjectEntry(path)
			}
			else
			{
				alert('Only HTML files (extension .html or .htm) can be used')
			}
		}
	}
	
	function fileIsHTML(path)
	{
		var pos = path.lastIndexOf('.')
		var extension = path.substring(pos).toLowerCase()
		return (extension == '.html' || extension == '.htm')
	}
	
	function createProjectEntry(path)
	{
		// Template for project items.
		var html = 
			'<div class="ui-state-default ui-corner-all">'
				+ '<button '
				+	'type="button" '
				+	'class="button-open btn btn-success" '
				+	'onclick="hyperapp.openFileFolder(\'__PATH1__\')">'
				+	'Open'
				+ '</button>'
				+ '<button '
				+	'type="button" '
				+	'class="button-run btn btn-primary" '
				+	'onclick="hyperapp.runApp(\'__PATH2__\')">'
				+	'Run'
				+ '</button>'
				+ '<h4>__NAME__</h4>'
				+ '<p>__PATH3__</p>'
				+ '<button '
				+	'type="button" '
				+	'class="close button-delete" '
				+	'onclick="hyperapp.UI.deleteEntry(this)">'
				+	'&times;'
				+ '</button>'
			+ '</div>'
		
		// Get name of project, use title tag as first choise.
		var data = hyperapp.FS.readFileSync(path, {encoding: 'utf8'})
		var name = getTagContent(data, 'title')
		if (!name)
		{
			name = getNameFromPath(path)
		}
		
		// Replace fields in template.
		html = html.replace('__PATH1__', path)
		html = html.replace('__PATH2__', path)
		html = html.replace('__PATH3__', path)
		html = html.replace('__NAME__', name)
		
		// Create element.
		var element = $(html)
		//console.log(html)
		
		// Insert element first in list.
		$('#project-list').prepend(element)
	}
	
	function getTagContent(data, tag)
	{
		var tagStart = '<' + tag + '>'
		var tagEnd = '</' + tag + '>'
		var pos1 = data.indexOf(tagStart)
		if (-1 === pos1) { return null }
		var pos2 = data.indexOf(tagEnd)
		if (-1 === pos2) { return null }
		return data.substring(pos1 + tagStart.length, pos2)
	}
	
	// Use last part of path as name.
	// E.g. '/home/apps/HelloWorld/index.html' -> 'HelloWorld/index.html'
	// Use full path as fallback.
	function getNameFromPath(path)
	{
		var pos = path.lastIndexOf('/')
		if (-1 === pos) { return path }
		pos = path.lastIndexOf('/', pos - 1)
		if (-1 === pos) { return path }
		return path.substring(pos + 1)
	}
	
	// Project list has been reordered/changed, save new list.
	function updateProjectList()
	{
		var projects = []
		var elements = $('#project-list > div')
		elements.each(function(index, element)
		{
			var path = $(element).find('p').text()
			if (path != '')
			{
				projects.push(path)
			}
		})
		hyperapp.setProjectList(projects)
	}
	
	hyperapp.UI.displayIpAddress = function(ip, port)
	{
		document.querySelector('#ip-address').innerHTML = ip
		document.querySelector('#connect-address').innerHTML = 
			'http://' + ip + ':' + port + '/connect'
	}
	
	hyperapp.UI.displayProjectList = function(projectList)
	{
		for (var i = projectList.length - 1; i > -1; --i)
		{
			var path = projectList[i]
			createProjectEntry(path)
		}
	}

	hyperapp.UI.setServerMessageFun = function()
	{
		// Server message callback.
		hyperapp.SERVER.setMessageCallbackFun(function(msg)
		{
			if (mWorkbenchWindow) { mWorkbenchWindow.postMessage(msg, '*') }
		})
	}
	
	hyperapp.UI.deleteEntry = function(obj)
	{
		console.log($(obj).parent())
		$(obj).parent().remove()
		updateProjectList()
	}
	
	setupUI()
})()

// Server set up.
// TODO: Remove hard coded port numbers below and
// in reload.js.
;(function()
{
	var SERVER = require('./hyperapp-server.js')
	var FS = require('fs')

	hyperapp.SERVER = SERVER     
	hyperapp.FS = FS

	var mProjectListFile = './project-list.json'
	var mProjectList = []
	var mApplicationBasePath = process.cwd()

	function setupServer()
	{
		// Start server tasks.
		SERVER.startServers()
		SERVER.setTraverseNumDirectoryLevels(3)
		SERVER.fileSystemMonitor()
		
		// Populate the UI.
		// TODO: Consider moving these calls to a function in hyperapp.UI.
		readProjectList()
		hyperapp.UI.displayProjectList(mProjectList)
		hyperapp.UI.setServerMessageFun()
		displayServerIpAddress()
	}
	
	function displayServerIpAddress()
	{
		SERVER.getWebServerIpAndPort(function(ip, port) {
			hyperapp.UI.displayIpAddress(ip, port)
		})
	}
	
	hyperapp.runApp = function(path)
	{
		// Prepend base path if needed.
		if (path.substring(0,1) != "/")
		{
			path = mApplicationBasePath + '/' + path
		}
		
		console.log('runApp: ' + path)
		
		SERVER.setAppPath(path)
		SERVER.sendReload()
	}
	
	// TODO: Should saved apps belong to the UI, rather than to the server?
	function readProjectList()
	{
		if (FS.existsSync(mProjectListFile))
		{
			var json = FS.readFileSync(mProjectListFile, {encoding: 'utf8'})
			mProjectList = JSON.parse(json)
		}
	}

	// TODO: Should saved apps belong to the UI, rather than to the server?
	function saveProjectList()
	{
		var json = JSON.stringify(mProjectList)
		FS.writeFileSync(mProjectListFile, json, {encoding: 'utf8'})
	}
	
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
            
            var command = 'nautilus "' + folderPath + '"'
            console.log(exec(command, puts))
/*
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
        }
        catch(err) 
        {
            console.log("ERROR in openFolder: " + err)
        }
    }
    
	// TODO: Simplify, use updateProjectList instead.
	hyperapp.addProject = function(path)
	{
		mProjectList.unshift(path)
		saveProjectList()
	}
	
	hyperapp.setProjectList = function(list)
	{
		mProjectList = list
		saveProjectList()
	}
	
	hyperapp.openFileFolder = function(path) 
	{
		// Prepend base path if needed.
		if (path.substring(0,1) != "/")
		{
			path = mApplicationBasePath + '/' + path
		}
		
		// Drop filename part of path.
		var pos = path.lastIndexOf('/')
		var folderPath = path.substring(0, pos)
		openFolder(folderPath)
    }
    
	// Display Node.js version info. Not used.
	//document.querySelector('#info').innerHTML = 'node.js ' + process.version
	
	setupServer()
})()
