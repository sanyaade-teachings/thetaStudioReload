/*
File: file-util.js
Description: File helper functions.
Author: Mikael Kindborg
Copyright (c) 2013 Mikael Kindborg
*/

var PATH = require('path')

exports.isPathAbsolute = function(path)
{
	// Check for Linux/OS X and Windows.
	return (path[0] === PATH.sep) || (path[1] === ':')
}

exports.fileIsHTML = function(path)
{
	var pos = path.lastIndexOf('.')
	var extension = path.substring(pos).toLowerCase()
	return (extension === '.html' || extension === '.htm')
}
