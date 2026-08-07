param(
  [string]$OutputPath = "dist\Breeze-SMP-Event-Engine.mcaddon"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$behaviorPack = Join-Path $root "behavior_packs\breeze_smp_event_engine"
$resourcePack = Join-Path $root "resource_packs\breeze_smp_event_engine"
$output = Join-Path $root $OutputPath
$staging = Join-Path $root "dist\.mcaddon-staging"

if (!(Test-Path (Join-Path $behaviorPack "manifest.json")) -or !(Test-Path (Join-Path $resourcePack "manifest.json"))) {
  throw "Both pack manifests are required before packaging."
}

if (Test-Path $staging) { Remove-Item -LiteralPath $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging -Force | Out-Null
Copy-Item -LiteralPath $behaviorPack -Destination (Join-Path $staging "Breeze-SMP-Event-Engine_BP") -Recurse
Copy-Item -LiteralPath $resourcePack -Destination (Join-Path $staging "Breeze-SMP-Event-Engine_RP") -Recurse

$outputDirectory = Split-Path -Parent $output
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
if (Test-Path $output) { Remove-Item -LiteralPath $output -Force }
$temporaryZip = "$output.zip"
if (Test-Path $temporaryZip) { Remove-Item -LiteralPath $temporaryZip -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $temporaryZip -Force
Move-Item -LiteralPath $temporaryZip -Destination $output -Force
Remove-Item -LiteralPath $staging -Recurse -Force
Write-Output "Created $output"
