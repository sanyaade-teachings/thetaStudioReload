# Definitions of build paths.
# Author: Mikael Kindborg
# Copyright (c) 2013 Mikael Kindborg
# License: Apache Version 2.0

def distPackageName
	"HyperReload"
end

def distCopyright
	"Copyright (c) 2013 Mikael Kindborg"
end

def root
	"../../"
end

# Destination folder for distribution packages.
def pathDist
	root + distPackageName + "_" + version + "/"
end

# Destination temporary folder for application code.
def pathDistSource
	pathDist + "source/"
end

# Source of main HyperReload application code.
def pathSourceHyper
	root + "HyperReload/"
end

# Source file for package.json.
def pathSourcePackageJson
	root + "HyperReload/hyper/build/package-template.json"
end

# Source of main demo apps.
def pathSourceDemo
	root + "HyperReload/demo/"
end

# Source of initial project list.
def pathSourceProjectList
	"./project-list-template.json"
end

# Source of documentation files.
def pathSourceDoc
	"./documentation/"
end

def pathNodeWebkitLinux32
	root + "node-webkit-bin-0.8.0/node-webkit-v0.8.0-linux-ia32/"
end

def pathNodeWebkitLinux64
	root + "node-webkit-bin-0.8.0/node-webkit-v0.8.0-linux-x64/"
end

def pathNodeWebkitWin
	root + "node-webkit-bin-0.8.0/node-webkit-v0.8.0-win-ia32/"
end

def pathNodeWebkitMac
	root + "node-webkit-bin-0.8.0/node-webkit-v0.8.0-osx-ia32/"
end

def buildPostProcess
	# Copy license file.
	FileUtils.copy_entry(
		"LICENSE.md",
		pathDistSource + "LICENSE.md")
end
