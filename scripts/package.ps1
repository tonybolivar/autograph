$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

$manifest = Get-Content -Raw -Path (Join-Path $root 'manifest.json') | ConvertFrom-Json
$version = $manifest.version
$staging = Join-Path $root ".package\autograph-$version"
$zipPath = Join-Path $root "autograph-$version.zip"

if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
New-Item -ItemType Directory -Force -Path $staging | Out-Null

$include = @('manifest.json', 'src', 'icons')
foreach ($item in $include) {
    $src = Join-Path $root $item
    if (-not (Test-Path $src)) { throw "Missing required path: $item" }
    Copy-Item -Recurse -Force $src (Join-Path $staging $item)
}

$logosDir = Join-Path $root 'logos'
if (Test-Path $logosDir) {
    Copy-Item -Recurse -Force $logosDir (Join-Path $staging 'logos')
}

Get-ChildItem -Recurse -Path $staging -Include '*.log', '.DS_Store', 'Thumbs.db', '*.zip' -Force -ErrorAction SilentlyContinue |
    Remove-Item -Force -ErrorAction SilentlyContinue

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    $files = Get-ChildItem -Recurse -File -Path $staging
    foreach ($file in $files) {
        $rel = $file.FullName.Substring($staging.Length + 1).Replace('\', '/')
        [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal)
    }
}
finally {
    $zip.Dispose()
}

Remove-Item -Recurse -Force $staging

Write-Output "Built $zipPath"
Write-Output "Version: $version"
Write-Output "Size:    $([math]::Round((Get-Item $zipPath).Length / 1KB, 1)) KB"
