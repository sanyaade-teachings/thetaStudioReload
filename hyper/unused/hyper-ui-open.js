/*
File: hyper-ui-open.js
Description: UI functionality.
Author: Mikael Kindborg
Copyright (c) 2013 Mikael Kindborg
*/

// Code below is split into two parts, one for the UI
// and one for ther server. This is to prepare for an
// eventual headless version of Hyper. Code currently
// contains serveral dependencies, however.

/*** Modules used ***/

var FS = require('fs')
var PATH = require('path')
var OS = require('os')
var GUI = require('nw.gui')
var FILEUTIL = require('../server/fileutil.js')
var SETTINGS = require('../../settings.js')

/*** Globals ***/

// Global object that holds globally available functions.
var hyper = {}

// UI-related functions.
hyper.UI = {}

/*** UI setup ***/

;(function()
{
	var mWorkbenchWindow = null

	function setupUI()
	{
		setUIActions()
		setWindowActions()
	}

	function setUIActions()
	{
		var button = null

		// Workbench button action.
		button = $('#button-workbench')
		button && button.click(function()
		{
			if (mWorkbenchWindow && !mWorkbenchWindow.closed)
			{
				// Bring existing window to front.
				mWorkbenchWindow.focus()
			}
			else
			{
				// Create new window.
				/*mWorkbenchWindow = GUI.Window.open('hyper-workbench.html', {
					//position: 'mouse',
					width: 901,
					height: 600,
					focus: true
				})*/
				mWorkbenchWindow = window.open(
					'hyper-workbench.html',
					'workbench',
					'resizable=1,width=800,height=600')
				mWorkbenchWindow.moveTo(50, 50)
				mWorkbenchWindow.focus()
				// Establish contact. Not needed/used.
				mWorkbenchWindow.postMessage({ message: 'hyper.hello' }, '*')
			}
		})

		// Run button action.
		button = $('#button-run')
		button && button.click(function()
		{
			var path = $('#path-to-main-html-file').val()
			hyper.runAppGuard(path)

		})

		// Message handler.
		window.addEventListener('message', receiveMessage, false)

		// Display of file monitor counter.
		setInterval(function() {
			hyper.UI.displayNumberOfMonitoredFiles() },
			1500)
	}

	function setWindowActions()
	{
		// Listen to main window's close event
		GUI.Window.get().on('close', function()
		{
			GUI.App.quit()
		})
	}

	function receiveMessage(event)
	{
		//console.log('Main got : ' + event.data.message)
		if ('eval' == event.data.message)
		{
			hyper.SERVER.evalJS(event.data.code)
		}
	}

	hyper.UI.displayIpAddress = function(ip, port)
	{
		document.querySelector('#connect-address').innerHTML = ip + ':' + port
	}

	hyper.UI.displayConnectedCounter = function()
	{
		document.querySelector('#connect-counter').innerHTML =
			hyper.SERVER.getNumberOfConnectedClients()
	}

	hyper.UI.displayNumberOfMonitoredFiles = function()
	{
		document.querySelector('#files-counter').innerHTML =
			hyper.SERVER.getNumberOfMonitoredFiles()
	}

	hyper.UI.setServerMessageFun = function()
	{
		// Set server message callback to forward message to the Workbench.
		hyper.SERVER.setMessageCallbackFun(function(msg)
		{
			// TODO: Send string do JSON.stringify on msg.
			if (mWorkbenchWindow)
			{
				mWorkbenchWindow.postMessage(msg, '*')
			}
		})
	}

	setupUI()
})()

/*** Server setup ***/

;(function()
{
	var SERVER = require('../server/hyper-server.js')
	hyper.SERVER = SERVER

	var mApplicationBasePath = process.cwd()
	var mRunAppGuardFlag = false
	var mOpenExternalBrowser = true
	var mConnectedCounterTimer = 0

	function setupServer()
	{
		// Start server tasks.
		SERVER.startServers()
		SERVER.setTraverseNumDirectoryLevels(
			SETTINGS.NumberOfDirecoryLevelsToTraverse)
		SERVER.fileSystemMonitor()

		// TODO: Consider moving these calls to a function in hyper.UI.
		hyper.UI.setServerMessageFun()
		displayServerIpAddress()

		SERVER.setConnenctedCallbackFun(clientConnectedCallback)
		SERVER.setDisconnenctedCallbackFun(clientDisconnectedCallback)
	}

	function displayServerIpAddress()
	{
		SERVER.getWebServerIpAndPort(function(ip, port) {
			hyper.UI.displayIpAddress(ip, port)
		})
	}

	// The Run button in the UI has been clicked.
	// Clicking too fast can cause muliple windows
	// to open. Guard against this case.
	hyper.runAppGuard = function(path)
	{
		if (mRunAppGuardFlag) { return }
		mRunAppGuardFlag = true
		hyper.runApp(path)
	}

	// The Run button in the UI has been clicked.
	hyper.runApp = function(path)
	{
		// Prepend base path if this is not an absolute path.
		if (!FILEUTIL.isPathAbsolute(path))
		{
			path = mApplicationBasePath + '/' + path
		}

		console.log('runApp: ' + path)

		SERVER.setAppPath(path)

		if (mOpenExternalBrowser)
		{
			// Open a local browser automatially if no clients are connected.
			// This is done so that something will happen when you first try
			// out Hyper by clicking the buttons in the user interface.
			GUI.Shell.openExternal(SERVER.getAppFileURL())

			/* This was used with iframe loading (hyper-client.html)
			GUI.Shell.openExternal(
				SERVER.getServerBaseURL() +
				'#' +
				SERVER.getAppFileName())
			*/
		}
		else
		{
			// Otherwise, load the requested file on connected clients.
			SERVER.runApp()
		}
	}

	function clientConnectedCallback(numberOfConnectedClients)
	{
		mRunAppGuardFlag = false
		mOpenExternalBrowser = false

		clearTimeout(mConnectedCounterTimer)
		mConnectedCounterTimer = setTimeout(function() {
			hyper.UI.displayConnectedCounter() },
			1000)
	}

	function clientDisconnectedCallback(numberOfConnectedClients)
	{
		if (0 == numberOfConnectedClients)
		{
			mOpenExternalBrowser = true
		}

		clearTimeout(mConnectedCounterTimer)
		mConnectedCounterTimer = setTimeout(function() {
			hyper.UI.displayConnectedCounter() },
			1000)
	}

	setupServer()
})()
