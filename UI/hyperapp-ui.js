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
		
		$(function() 
		{
			$('#project-list').sortable()
			$('#project-list').disableSelection()
		})
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
	
	function setUIActions()
	{
		// Workbench button action.
		$('#button-workbench').click(function()
		{
			var workbench = window.open(
				'hyperapp-workbench.html', 
				'workbench',
				'resizable=1,width=800,height=600')
			workbench.moveTo(0, 0)
		})
		
		// Documentation button action.
		$('#button-documentation').click(function()
		{
			console.log('hello')
			createProjectEntry('')
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
		var entry = '<div class="ui-state-default ui-corner-all">'
		var html = 
			'<button ' +
				'type="button" ' +
				'class="button-run btn btn-primary" ' +
				'onclick="hyperapp.runApp(\'__PATH1__\')">' +
				'Run App' +
			'</button>' +
			'<h4>__NAME__</h4>' +
			'<p>__PATH2__</p>'
		
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
		html = html.replace('__NAME__', name)
		
		// Create element.
		var element = $(entry)
		console.log(html)
		element.html(html)
		
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

	function setupServer()
	{
		SERVER.startServers()
		SERVER.setTraverseNumDirectoryLevels(3)
		SERVER.fileSystemMonitor()
		readProjectList()
		hyperapp.UI.displayProjectList(mProjectList)
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
		SERVER.setAppPath(path)
		SERVER.sendReload()
	}
	
	function setAppPath(appPath)
	{
		SERVER.setAppPath(appPath)
		//FS.writeFileSync(mProjectListFile, appPath, {encoding: 'utf8'})
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
	
	hyperapp.addProject = function(path)
	{
		mProjectList.unshift(path)
		saveProjectList()
	}
	
	// Display Node.js version info. Not used.
	//document.querySelector('#info').innerHTML = 'node.js ' + process.version

	setupServer()
})()
