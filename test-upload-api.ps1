# Test EML Upload API
# Get login token first
$loginUrl = "http://localhost/karting/api/auth/login"
$uploadUrl = "http://localhost/karting/api/sessions/upload-eml"

# Login credentials (adjust as needed)
$loginBody = @{
    email = "maxvanlierop05@gmail.com"
    password = "password123"
} | ConvertTo-Json

Write-Host "1. Logging in..." -ForegroundColor Cyan
try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✓ Login successful. Token: $($token.Substring(0,20))..." -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Yellow
    exit 1
}

# Get all EML files
$emlFiles = Get-ChildItem -Path "C:\Users\TheMaksoo\Downloads\karting\data-importer\eml-samples" -Recurse -Include *.eml | Select-Object -First 3

Write-Host "`n2. Testing upload with $($emlFiles.Count) files..." -ForegroundColor Cyan

foreach ($file in $emlFiles) {
    Write-Host "`n--- Testing: $($file.Name) ---" -ForegroundColor Yellow
    
    try {
        # Create multipart form data
        $boundary = [System.Guid]::NewGuid().ToString()
        $fileBin = [System.IO.File]::ReadAllBytes($file.FullName)
        $enc = [System.Text.Encoding]::GetEncoding("iso-8859-1")
        
        $bodyLines = @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"$($file.Name)`"",
            "Content-Type: application/octet-stream",
            "",
            $enc.GetString($fileBin),
            "--$boundary--"
        ) -join "`r`n"
        
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        $response = Invoke-RestMethod -Uri $uploadUrl -Method POST -Headers $headers -Body $bodyLines -ContentType "multipart/form-data; boundary=$boundary"
        
        Write-Host "✓ SUCCESS" -ForegroundColor Green
        Write-Host "  Track: $($response.track.name)" -ForegroundColor White
        Write-Host "  Session Date: $($response.data.session_date)" -ForegroundColor White
        Write-Host "  Laps: $($response.data.laps_count)" -ForegroundColor White
        Write-Host "  Drivers: $($response.data.drivers_detected)" -ForegroundColor White
        
        if ($response.warnings) {
            Write-Host "  Warnings: $($response.warnings -join ', ')" -ForegroundColor Yellow
        }
        
        if ($response.duplicate.exists) {
            Write-Host "  ⚠ DUPLICATE: Already uploaded as '$($response.duplicate.original_file)'" -ForegroundColor Magenta
        }
        
    } catch {
        Write-Host "✗ FAILED" -ForegroundColor Red
        $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
        
        if ($errorBody.errors) {
            Write-Host "  Errors:" -ForegroundColor Red
            foreach ($err in $errorBody.errors) {
                Write-Host "    - $err" -ForegroundColor Red
            }
        }
        
        if ($errorBody.message) {
            Write-Host "  Message: $($errorBody.message)" -ForegroundColor Red
        }
        
        if ($errorBody.error_details) {
            Write-Host "  Details: $($errorBody.error_details | ConvertTo-Json -Compress)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nTest complete!" -ForegroundColor Green
