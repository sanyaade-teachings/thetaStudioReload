# Definitions of build paths.
# Author: Mikael Kindborg

def distPackageName
	"HyperReload"
end

# Destination folder for distribution packages.
def pathDist
	"../../" + distPackageName + "_" + version + "/"
end

# Destination temporary folder for application code.
def pathDistSource
	pathDist + "source/"
end

# Source of main HyperReload application code.
def pathSourceHyper
	"../../HyperReload/"
end

# Source file for package.json.
def pathSourcePackageJson
	"./package-template.json"
end

# Source of main demo apps.
def pathSourceDemo
	"../../HyperReload/demo/"
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
	"../../node-webkit-bin/node-webkit-v0.8.0-linux-ia32/"
end

def pathNodeWebkitLinux64
	"../../node-webkit-bin/node-webkit-v0.8.0-linux-x64/"
end

def pathNodeWebkitWin
	"../../node-webkit-bin/node-webkit-v0.8.0-win-ia32/"
end

def pathNodeWebkitMac
	"../../node-webkit-bin/node-webkit-v0.8.0-osx-ia32/"
end

def buildPostProcess
	# Copy license file.
	FileUtils.copy_entry(
		"LICENSE.md",
		pathDistSource + "LICENSE.md")
end
