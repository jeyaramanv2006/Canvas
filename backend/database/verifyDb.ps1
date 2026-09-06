Add-Type -AssemblyName System.Data

$dbPath = "c:\Users\Jeyaraman\OneDrive\Desktop\My-Projects\canvas\backend\data\canvas.db"
$jsonPath = "c:\Users\Jeyaraman\OneDrive\Desktop\My-Projects\canvas\frontend\src\data\masterSchools.js"

# Let's verify canvas.db directory exists
$dbDir = [System.IO.Path]::GetDirectoryName($dbPath)
if (-not (Test-Path $dbDir)) {
    New-Item -ItemType Directory -Path $dbDir -Force
}

Write-Host "Database path: $dbPath"
