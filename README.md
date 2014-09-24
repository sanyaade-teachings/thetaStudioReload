# HyperReload

HyperReload is a lightweight tool for rapid development of mobile apps in JavaScript.

## What it does

Edit your HTML/CSS/JS on your desktop machine, save the edited file, and the changes are automatically reloaded on connected clients. This saves you from rebuild, deploy and restart your mobile application every time a code change is made. The result is a much faster workflow when coding HTML/CSS/JS.

Any number of clients can connect. You can connect from any browser (desktop or mobile), or you can connect from a mobile WebView widget of a native app (this should work on all mobile platforms that supports a Web widget, Android, iOS, Windows Phone, Firefox OS, Tizen, etc).

## Getting started

HyperReload uses [node-webkit](https://github.com/rogerwang/node-webkit) as its runtime (an amazing piece of software).

To run HyperReload, there is no need to do an actual build, just clone the source, then run using node-webkit. Just place the node-webkit [executable files](https://github.com/rogerwang/node-webkit) in the same folder as package.json and launch the node-webkit executable file.

## How to use HyperReload

### 1. Launch the HyperReload desktop application

When you run HyperReload on your desktop machine, it will start a local web server and listen for file updates, notifying connected clients to reload when files are saved.

### 2. Connect from the browser/device

Connect from a web browser on a mobile device or laptop/desktop machine by entering the URL displayed in the HyperReload window. For example:

    http://192.168.0.101:4042

You can also connect from a WebView widget in a mobile app. For example, on Android you use code like this:

	WebView mWebView = new WebView(this);
	mWebView.getSettings().setJavaScriptEnabled(true);
	setWebViewClient(new WebViewClient());
    mWebView.loadUrl("http://192.168.0.101:4042");

Make sure the WebView has JavaScript enabled, and that it has a WebViewClient (otherwise, URLs opened from within the WebView will be opened in en external browser, rather than in the WebView itself).

### 3. Click "Run"

When connected, click the **Run** button of the project you wish to launch, and the app will be loaded onto the connected device(s).

When editing and saving files in the project, the app will be automatically reloaded on the connected client(s). (Note that directory traversal is limited to three levels, this can be configured in the file settings.js, if you need deeper traversal.)

### 4. Create new projects using drag and drop

To create a new project entry, drag the main HTML file of our project into the HyperReload window. (This step assumes you have created a folder with an HTML file that has some basic content.)

### 5. Structure of the main HTML file

For HyperReload to work, you need to have a main HTML file. This is the file you want to be reloaded when a file in the project is updated. (Saving any file in the same directory or subdirectory will reload this file.)

For the reload mechanism to work, the server inserts a script tag in the main HTML file that installs the reloader script. This script will be inserted after the ending title tag, before the ending head tag, after the opening body tag, and before the ending body tag, in that order (first found tag will be used).

For example, for this file, the script tag would be inserted after the ending title tag:

	<!DOCTYPE html>
	<html>
	<head>
	  <meta charset="utf-8">
	  <title>Hello World</title><!-- script tag will be inserted here -->
	</head>
	<body>
        <h1>Hello World</h1>
	</body>
	</html>

## Building from source

Here is a script that can build stand-alone redistributable packages:

     hyper/build/buildHyper.rb

In addition, there is a script 'buildPlugin.rb' that you should copy and modify to customise the build (e.g. defining the name of the package to build).

buildPlugin.rb may include localConfig.rb, if it exists. Use it for non-version-controlled settings.

This script requires that a directory named 'node-webkit-bin-0.8.0' exists parallel to the HyperReload source dir. This directory contains the uncompressed node-webkit binaries. Note that depending on the version of node-webkit used, you must update the directory names and executabe names in the build script.

If you want to use a different version of node-webkit, replace "0.8.0" in this example with the number of your chosen version.
You must also change the function "nodeWebKitVersion" in buildPlugin.rb, or override it in localConfig.rb.

Folder structure:

    HyperReload
    node-webkit-bin-0.8.0
        node-webkit-v0.8.0-linux-ia32
            creadits.html
            libffmpegsumo.so
            nw
            nw.pak
            nwsnapshot
        node-webkit-v0.8.0-linux-x64
            ...
        node-webkit-v0.8.0-osx-ia32
            ...
        node-webkit-v0.8.0-win-ia32
            ...

## Documentation and issue tracker

Developer documentation and design documents are on the [GitHub wiki] (https://github.com/divineprog/HyperReload/wiki/_pages).

Use the [Github issue tracker](https://github.com/divineprog/HyperReload/issues) to report bugs, ask questions, and make suggestions (there are labels for different issue types you can use).

## Credits

HyperReload is based on several truly wonderful open-source projects, including:

* [node-webkit](https://github.com/rogerwang/node-webkit)
* [Node.js](http://nodejs.org/)
* [CodeMirror](http://codemirror.net/)
* [jQuery](http://jquery.com/)
* [Apache Cordova](http://cordova.apache.org/)

For a full listing of software used by HyperReload, see folder "license".

## License

HyperReload is licensed under the Apache license. You are welcome to contribute to the project and use the source code with your own projects.

See file LICENSE.md and folder "hyper/license" for full licensing information, including licenses for software used by HyperReload.

## Contact

Email: mikael@kindborg.com

<!--
, mikael.kindborg@evothings.com

[EvoThings](http://evothings.com) are a seasoned bunch of developers who enjoy connecting phones to other things. We love to improve, refurbish, evolve and augment buildings, vehicles and gadgets, and make them smarter.
-->

<!--
## Components

HyperApp consists of two applications:

* The HyperApp UI desktop application
* The HyperApp mobile client application (optional, under development, not finished)

### 3. Enter the path of the mobile app main HTML file

When connected, enter the path to the main HTML file of your project in the HyperApp UI.

Then press the **Run** button, and the app will be loaded onto the connected device(s).

When editing and saving files in the project, the app will be automatically reloaded on the connected client(s). (Note that directory traversal is currently limited to two levels, this will be configurable in the UI, for now, update this manually in UI/index.html if you need deeper traversal.)
-->

<!--
With the HyperApp mobile application (under development) you get additional functionlity:

* Quick-connect to the running HyperApp UI
* Get console error messages displayed in the HyperApp UI (Android)
* No need to build the application, just install from the app store (forthcoming)
-->
