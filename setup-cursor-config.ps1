# Script to create Cursor MCP configuration file
$configDir = Join-Path $env:USERPROFILE ".cursor"
$configPath = Join-Path $configDir "mcp.json"

# Get the directory where this script is located
if ($PSScriptRoot) {
    $scriptDir = $PSScriptRoot
} else {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}

# Create .cursor directory if it doesn't exist
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    Write-Host "Created directory: $configDir"
}

# Resolve absolute paths relative to script directory
$serverPath = (Resolve-Path (Join-Path $scriptDir "mcp\playwright-browser\src\server.js")).Path
$cwd = (Resolve-Path (Join-Path $scriptDir "mcp\playwright-browser")).Path

# Server configuration
$config = @{
    mcpServers = @{
        "playwright-browser" = @{
            command = "node"
            args = @($serverPath)
            cwd = $cwd
        }
    }
} | ConvertTo-Json -Depth 10

# Write configuration file
Set-Content -Path $configPath -Value $config -Encoding UTF8

Write-Host "`nConfiguration file created successfully!"
Write-Host "Location: $configPath"
Write-Host "`nPlease restart Cursor for the changes to take effect.`n"
