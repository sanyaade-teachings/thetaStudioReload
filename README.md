# HyperReload

HyperReload is a lightweight tool for rapid development of mobile apps in JavaScript.

## What it does

Edit your HTML/CSS/JS on your desktop machine, save the edited file, and the changes are automatically reloaded on connected clients. This saves you from rebuild, deploy and restart your mobile application every time a code change is made. The result is a much faster workflow when coding HTML/CSS/JS.

Any number of clients can connect. You can connect from any browser (desktop or mobile), or you can connect from a mobile WebView widget of a native app (this should work on all mobile platforms that supports a Web widget, Android, iOS, Windows Phone, Firefox OS, Tizen, etc).

## How to get started

Go to [hyperreload.com](http://hyperreload.com) to find download packages and a tutorial on how to get started.

## Building from source

HyperReload uses [node-webkit](https://github.com/rogerwang/node-webkit) as its runtime (an amazing piece of software).

There is no actual build step, you can clone the source, then run using node-webkit. The HyperReload runnable is in the UI directory.

## Documentation and site structure

[Documentation and downloads](http://hyperreload.com) are on [hyperreload.com](http://hyperreload.com).

Documentation will also be available in the "Documentation" window in HyperReload.

[Design documents and developer documentation](https://github.com/divineprog/HyperReload/wiki) is on the GitHub wiki (still in its infancy).

The [issue tracker](https://github.com/divineprog/HyperReload/issues) is here on GitHub.

An [experimental forum](https://github.com/divineprog/HyperReload-Forum/issues) is also here on GitHub. (Using the GitHub issue tracker, perhaps this is less than ideal, will look into creating a proper forum.)

<!--
## Components

HyperApp consists of two applications:

* The HyperApp UI desktop application
* The HyperApp mobile client application (optional, under development, not finished)

You need to include this code in your main HTML application file to enable the automatic reload functionality:

    <script src="/reloader"></script>
    
This will load code that listens to reload events from the HyperApp UI.

## Getting started

### 1. Run the HyperApp UI desktop application

Run the HyperApp UI program on your desktop machine. This will start a local web server and listen for file updates, notifying clients when files are saved. 

Note: This application is written using node-webkit. For now, you need to install node-webkit manually, and launch the application. See the UI/runme Linux script for an example opf how to luanch the application.

### 2. Connect from the browser/device

Connect from a web browser by entering the URL displayed in the HyperApp UI. For example:

    http://192.168.43.226:4042/connect
    
Connect from a WebView widget in a mobile app. For example, on Android you use code like this:

	WebView mWebView = new WebView(this);
	mWebView.getSettings().setJavaScriptEnabled(true);
	setWebViewClient(new WebViewClient());
    mWebView.loadUrl("http://192.168.43.226:4042/connect");

Make sure the WebView has JavaScript enabled, and that it has a WebViewClient (otherwise, URLs opened from within the WebView will be opened in en external browser, rather than in the WebView itself).

### 3. Enter the path of the mobile app main HTML file

When connected, enter the path to the main HTML file of your project in the HyperApp UI. 

Then press the **Run** button, and the app will be loaded onto the connected device(s). 

When editing and saving files in the project, the app will be automatically reloaded on the connected client(s). (Note that directory traversal is currently limited to two levels, this will be configurable in the UI, for now, update this manually in UI/index.html if you need deeper traversal.)

### 4. Structure of the main HTML file

For HyperApp to work, you need to have a main HTML file. This is the file you want to be reloaded when a file in the project is updated. (Saving any file in the same directory or subdirectory will reload this file.)

For the reload mechanism to work, you need to include a script in the main HTML file that installs the reloader script. Here is a simple example:

	<!DOCTYPE html>
	<html>
	<head>
	  <meta charset="utf-8">
	  <title>Hello World</title>
	</head>
	<body>
        <h1>Hello World</h1>
	    <script src="/reloader"></script>
	</body>
	</html>

It is recommened to put the reloader script last in the body element.
-->

## Roadmap

Note that the HyperApp project is under development, with ongoing changes/updates. 
Estimated stable release September 30, 2013.

An Android client app is also under development (will be followed by additional platforms). Currently the Android client app is unstable.

<!--
With the HyperApp mobile application (under development) you get additional functionlity:

* Quick-connect to the running HyperApp UI
* Get console error messages displayed in the HyperApp UI (Android)
* No need to build the application, just install from the app store (forthcoming)
-->
