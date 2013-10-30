#######################################################
# Build a distribution package of HyperReload.        #
#                                                     #
# Note that paths must be defined in a file           #
# named "buildPlugin.rb".                             #
#                                                     #
# This script is experimental and undocumented,       #
# and is not needed to run HyperReload. The easiest   #
# way to run Hyper is by downloading node-webkit,     #
# see instructions in the README.md file.             #
#                                                     #
# Author: Mikael Kindborg                             #
#######################################################

require "fileutils"
require "pathname"

#######################################################
#               BUILD PROCESS OVERVIEW                #
#######################################################

# Copy files from the HyperOpen repository into the
# destination folder named <dist>_<version>
#
# Do some processing of the files.
#
# Create directories for binary dists and copy
# the code there and also copy node-webkit
# binary files there.
#
# Zip distribution directories.

#######################################################
#                 GLOBAL VARIABLES                    #
#######################################################

def version
	$VersionString
end

load "buildPlugin.rb"

#######################################################
#                  BUILD FUNCTIONS                    #
#######################################################

def buildCreateDistDir
	fileDelete(pathDist)
	fileCreateCleanPath(pathDistSource)
end

def buildCopyHyperToDistDir
	puts "Copying Hyper to dist dir"

	FileUtils.copy_entry(
		pathSourceHyper + "application/",
		pathDistSource + "application/")
	FileUtils.copy_entry(
		pathSourceDoc,
		pathDistSource + "documentation/")
	FileUtils.copy_entry(
		pathSourceDemo,
		pathDistSource + "demo/")
	FileUtils.copy_entry(
		pathSourceProjectList,
		pathDistSource + "project-list.json")
	FileUtils.copy_entry(
		pathSourceHyper + "settings.js",
		pathDistSource + "settings.js")
	FileUtils.copy_entry(
		pathSourceHyper + "node_modules/",
		pathDistSource + "node_modules/")

	# Copy license file.
	FileUtils.copy_entry(
		pathSourceHyper + "license/",
		pathDistSource + "license/")

	# Create package.json for this version.
	content = fileReadContent(pathSourcePackageJson)
	content = content.gsub("__VERSION__", version)
	fileSaveContent(pathDistSource + "package.json", content)

	# Delete hidden OS X files.
	fileDeleteAll(pathDist + "**/.DS_Store")
end

def buildDistBinaries
	puts "Building binary packages"

	puts "Building Linux32"
	buildDistBinaryLinux32

	puts "Building Linux64"
	buildDistBinaryLinux64

	puts "Building Mac"
	buildDistBinaryMac

	puts "Building Win"
	buildDistBinaryWin

	# Delete hidden OS X files.
	fileDeleteAll(pathDist + "**/.DS_Store")
end

def buildDistBinaryLinux32
	buildDistBinaryLinux(
		pathDistSource,
		pathDist + distPackageName + "_Linux_32_" + version + "/",
		pathNodeWebkitLinux32)
end

def buildDistBinaryLinux64
	buildDistBinaryLinux(
		pathDistSource,
		pathDist + distPackageName + "_Linux_64_" + version + "/",
		pathNodeWebkitLinux64)
end

def buildDistBinaryLinux(sourcePath, targetPath, sourceBin)

	# Copy JavaScript/HTML files.
	FileUtils.copy_entry(sourcePath, targetPath)

	# Copy files.
	FileUtils.copy_entry(
		sourceBin + "nw",
		targetPath + distPackageName)
	FileUtils.copy_entry(
		sourceBin + "nw.pak",
		targetPath + "nw.pak")
	FileUtils.copy_entry(
		sourceBin + "libffmpegsumo.so",
		targetPath + "libffmpegsumo.so")
end

def buildDistBinaryMac

	sourcePath = pathDistSource
	targetPath = pathDist + distPackageName + "_Mac_" + version + "/"
	sourceBin = pathNodeWebkitMac

	# Copy JavaScript/HTML files.
	FileUtils.copy_entry(sourcePath, targetPath)

	# Copy files.
	FileUtils.copy_entry(
		sourceBin + "node-webkit.app",
		targetPath + distPackageName + ".app")
end

def buildDistBinaryWin

	sourcePath = pathDistSource
	targetPath = pathDist + distPackageName + "_Win_" + version + "/"
	sourceBin = pathNodeWebkitWin

	# Copy JavaScript/HTML files.
	FileUtils.copy_entry(sourcePath, targetPath)

	# Copy files.
	FileUtils.copy_entry(
		sourceBin + "nw.exe",
		targetPath + distPackageName + ".exe")
	FileUtils.copy_entry(
		sourceBin + "nw.pak",
		targetPath + "nw.pak")
	FileUtils.copy_entry(
		sourceBin + "ffmpegsumo.dll",
		targetPath + "ffmpegsumo.dll")
	FileUtils.copy_entry(
		sourceBin + "icudt.dll",
		targetPath + "icudt.dll")
	FileUtils.copy_entry(
		sourceBin + "libEGL.dll",
		targetPath + "libEGL.dll")
	FileUtils.copy_entry(
		sourceBin + "libGLESv2.dll",
		targetPath + "libGLESv2.dll")
end

def buildZippedBinaries
end

# Build distribution package.
def buildDist
	puts "Building " + distPackageName + " version " + version
	buildCreateDistDir
	buildCopyHyperToDistDir
	buildPostProcess
	buildDistBinaries
	buildZippedBinaries
	puts "Build done"
end

#######################################################
#                    FILE HELPERS                     #
#######################################################

def fileReadContent(filePath)
	# File.open(filePath, "rb") { |f| f.read.force_encoding("UTF-8") }
	File.open(filePath, "rb") { |f| f.read }
end

def fileSaveContent(destFile, content)
	File.open(destFile, "wb") { |f| f.write(content) }
end

def fileDelete(path)
	if File.exists? path then
		FileUtils.remove_entry(path, true)
	end
end

def fileCreateCleanPath(path)
	pathName = Pathname.new(path)
	pathName.mkpath()
		begin
	pathName.rmtree()
	rescue
		puts "Cannot delete: " + pathName.to_s
	end
	pathName.mkpath()
end

# Example: fileDeleteAll(pathDist + "**/.DS_Store")
def fileDeleteAll(globPath)
	Pathname.glob(globPath).each do |path|
		puts "Deleting " + path.to_s
		file = path.to_s
		File.delete file
	end
end

def fileSubstString(path, fromString, toString)
	content = fileReadContent(path)
	content = content.gsub(fromString, toString)
	fileSaveContent(path, content)
end

#######################################################
#                 START BUILD PROCESS                 #
#######################################################

if (ARGV.size == 1)
	$VersionString = ARGV[0]
	buildDist
else
	puts "Usage:"
	puts "	ruby build.rb <version>"
	puts "Example:"
	puts "	ruby build.rb 0.1.0"
end
