# Test batch upload of all EML files
$API_URL = "http://localhost:8080/api"
$TOKEN = ""

# First, login to get token
Write-Host "Logging in..." -ForegroundColor Cyan
$loginBody = @{
    email = "maxvanlierop05@gmail.com"
    password = "12345678"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body $loginBody -ContentType "application/json"

$TOKEN = $loginResponse.access_token
Write-Host "Logged in successfully" -ForegroundColor Green
Write-Host ""

# Get all tracks to find IDs
Write-Host "Fetching tracks..." -ForegroundColor Cyan
$tracksHeaders = @{
    "Authorization" = "Bearer $TOKEN"
    "Accept" = "application/json"
}
$tracks = Invoke-RestMethod -Uri "$API_URL/tracks" -Method GET -Headers $tracksHeaders

Write-Host "Available tracks:" -ForegroundColor Yellow
foreach ($track in $tracks.data) {
    Write-Host "  - $($track.name) (ID: $($track.id)) - $($track.city), $($track.country)" -ForegroundColor White
}
Write-Host ""

# Find all EML files in all subdirectories
$emlPath = "C:\laragon\www\karting\data-importer\eml-samples"
Write-Host "Scanning for EML, PDF, and TXT files in: $emlPath" -ForegroundColor Cyan

$allFiles = Get-ChildItem -Path $emlPath -Recurse -Include *.eml,*.pdf,*.txt
Write-Host "Found $($allFiles.Count) files to process" -ForegroundColor Yellow
Write-Host ""

# Group files by folder (track)
$filesByFolder = $allFiles | Group-Object { $_.Directory.Name }

foreach ($folderGroup in $filesByFolder) {
    $folderName = $folderGroup.Name
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "Processing folder: $folderName" -ForegroundColor Cyan
    Write-Host "Files in folder: $($folderGroup.Count)" -ForegroundColor Yellow
    Write-Host ""
    
    # Try to match folder name to track with better matching logic
    $matchingTrack = $null
    $folderLower = $folderName.ToLower()
    
    # Define folder to track mappings
    $trackMappings = @{
        "de voltage" = "De Voltage"
        "elche" = "Fastkart Elche"
        "fastkart elche" = "Fastkart Elche"
        "experience factory antwerp" = "Experience Factory Antwerp"
        "circuit park berghem" = "Circuit Park Berghem"
        "berghem" = "Circuit Park Berghem"
        "goodwill karting" = "Goodwill Karting"
        "goodwill" = "Goodwill Karting"
        "lot66" = "Lot66"
        "lot 66" = "Lot66"
        "gilesias" = "Racing Center Gilesias"
        "racing center gilesias" = "Racing Center Gilesias"
    }
    
    # Check if we have a direct mapping
    if ($trackMappings.ContainsKey($folderLower)) {
        $targetTrackName = $trackMappings[$folderLower]
        foreach ($track in $tracks.data) {
            if ($track.name -eq $targetTrackName) {
                $matchingTrack = $track
                break
            }
        }
    }
    
    # Fallback to partial matching
    if (-not $matchingTrack) {
        foreach ($track in $tracks.data) {
            if ($track.name -like "*$folderName*" -or $folderName -like "*$($track.name)*") {
                $matchingTrack = $track
                break
            }
        }
    }
    
    if ($matchingTrack) {
        Write-Host "Matched to track: $($matchingTrack.name) (ID: $($matchingTrack.id))" -ForegroundColor Green
        
        # Upload all files in batch
        try {
            $form = @{}
            $form['track_id'] = $matchingTrack.id
            
            # Add all files
            $fileIndex = 0
            foreach ($file in $folderGroup.Group) {
                $form["files[$fileIndex]"] = Get-Item $file.FullName
                $fileIndex++
                Write-Host "  Adding: $($file.Name)" -ForegroundColor White
            }
            
            Write-Host ""
            Write-Host "Uploading batch..." -ForegroundColor Cyan
            
            $headers = @{
                "Authorization" = "Bearer $TOKEN"
                "Accept" = "application/json"
            }
            $uploadResponse = Invoke-RestMethod -Uri "$API_URL/upload/batch" -Method POST -Headers $headers -Form $form
            
            Write-Host "Upload successful!" -ForegroundColor Green
            Write-Host "  Total laps imported: $($uploadResponse.data.total_laps)" -ForegroundColor Yellow
            Write-Host "  Total drivers: $($uploadResponse.data.total_drivers)" -ForegroundColor Yellow
            Write-Host "  Files processed: $($uploadResponse.data.files_processed)" -ForegroundColor Yellow
            
            if ($uploadResponse.data.results) {
                Write-Host ""
                Write-Host "  Individual file results:" -ForegroundColor White
                foreach ($result in $uploadResponse.data.results) {
                    Write-Host "    - $($result.file_name): $($result.laps_imported) laps" -ForegroundColor Gray
                }
            }
            
        }
        catch {
            Write-Host "Upload failed for $folderName" -ForegroundColor Red
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        
    }
    else {
        Write-Host "No matching track found for folder: $folderName" -ForegroundColor Yellow
        Write-Host "  Skipping files in this folder" -ForegroundColor Gray
    }
    
    Write-Host ""
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Batch upload test complete!" -ForegroundColor Green
