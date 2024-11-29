# Function to load .env file into environment variables
function Load-EnvFile {
    param (
        [string]$FilePath
    )

    if (-not (Test-Path $FilePath)) {
        Write-Error ".env file not found: $FilePath"
        exit 1
    }

    Get-Content $FilePath | ForEach-Object {
        if ($_ -match '^\s*([^#].*?)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim())
        }
    }
}

# Set error handling
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Change to the script's directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

# Load the .env file
$envFilePath = Join-Path $ScriptDir '.env'
Load-EnvFile -FilePath $envFilePath

# Use environment variables in the script
$sourcePath = [Environment]::GetEnvironmentVariable('SOURCE_PATH')
$destinationPath = [Environment]::GetEnvironmentVariable('DESTINATION_PATH')
$myrepo = [Environment]::GetEnvironmentVariable('REPO_URL')
$nodeCommand = [Environment]::GetEnvironmentVariable('NODE_COMMAND')

# Validate environment variables
if (-not $sourcePath) {
    Write-Error "SOURCE_PATH is not defined in the .env file."
    exit 1
}

if (-not $destinationPath) {
    Write-Error "DESTINATION_PATH is not defined in the .env file."
    exit 1
}

if (-not $myrepo) {
    Write-Error "REPO_URL is not defined in the .env file."
    exit 1
}

if (-not $nodeCommand) {
    Write-Error "NODE_COMMAND is not defined in the .env file."
    exit 1
}

# Check for required commands
$requiredCommands = @('git', 'hugo')
foreach ($cmd in $requiredCommands) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "$cmd is not installed or not in PATH."
        exit 1
    }
}

# Step 1: Check if Git is initialized, and initialize if necessary
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..."
    git init
    git remote add origin $myrepo
} else {
    Write-Host "Git repository already initialized."
    $remotes = git remote
    if (-not ($remotes -contains 'origin')) {
        Write-Host "Adding remote origin..."
        git remote add origin $myrepo
    }
}

# Step 2: Sync posts from Obsidian to Hugo content folder using Robocopy
Write-Host "Syncing posts from Obsidian..."

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source path does not exist: $sourcePath"
    exit 1
}

if (-not (Test-Path $destinationPath)) {
    Write-Error "Destination path does not exist: $destinationPath"
    exit 1
}

# Use Robocopy to mirror the directories
$robocopyOptions = @('/MIR', '/Z', '/W:5', '/R:3')
$robocopyResult = robocopy $sourcePath $destinationPath @robocopyOptions

if ($LASTEXITCODE -ge 8) {
    Write-Error "Robocopy failed with exit code $LASTEXITCODE"
    exit 1
}

# Step 3: Process Markdown files with node script(js) to handle image links
Write-Host "Processing image links in Markdown files..."
if (-not (Test-Path "images.js")) {
    Write-Error "JavaScript file images.js not found."
    exit 1
}

# Execute the node script
try {
    & $nodeCommand images.js
} catch {
    Write-Error "Failed to process image links."
    exit 1
}

# Step 4: Build the Hugo site
Write-Host "Building the Hugo site..."
try {
    hugo --minify
} catch {
    Write-Error "Hugo build failed."
    exit 1
}

# Step 5: Add changes to Git
Write-Host "Staging changes for Git..."
$hasChanges = (git status --porcelain) -ne ""
if (-not $hasChanges) {
    Write-Host "No changes to stage."
} else {
    git add .
}

# Step 6: Commit changes with a dynamic message
$commitMessage = "New Blog Post on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$hasStagedChanges = (git diff --cached --name-only) -ne ""
if (-not $hasStagedChanges) {
    Write-Host "No changes to commit."
} else {
    Write-Host "Committing changes..."
    git commit -m "$commitMessage"
}

# Step 7: Push all changes to the main branch
Write-Host "Deploying to GitHub Master..."
try {
    git push origin master
} catch {
    Write-Error "Failed to push to Master branch."
    exit 1
}

# Step 8: Push the public folder to the prod branch using subtree split and force push
Write-Host "Deploying to GitHub prod..."

# Check if the temporary branch exists and delete it
$branchExists = git branch --list "prod-deploy"
if ($branchExists) {
    git branch -D prod-deploy
}

# Perform subtree split
try {
    git subtree split --prefix public -b prod-deploy
} catch {
    Write-Error "Subtree split failed."
    exit 1
}

# Push to prod branch with force
try {
    git push origin prod-deploy:production --force
} catch {
    Write-Error "Failed to push to prod branch."
    git branch -D prod-deploy
    exit 1
}

# Delete the temporary branch
git branch -D prod-deploy

Write-Host "All done! Site synced, processed, committed, built, and deployed."
