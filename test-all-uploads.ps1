# Comprehensive EML/TXT/PDF Upload Test
$ErrorActionPreference = "Continue"

$loginUrl = "http://127.0.0.1:8000/api/auth/login"
$uploadUrl = "http://127.0.0.1:8000/api/sessions/upload-eml"

# Login
Write-Host "=== KARTING EML UPLOAD TEST ===" -ForegroundColor Cyan
Write-Host "Logging in..." -ForegroundColor Yellow

$loginBody = @{
    email = "maxvanlierop05@gmail.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login successful!`n" -ForegroundColor Green
} catch {
    Write-Host "Login FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get all test files
$files = Get-ChildItem -Path "C:\Users\TheMaksoo\Downloads\karting\data-importer\eml-samples" -Recurse -Include *.eml,*.txt,*.pdf

$results = @{
    Total = $files.Count
    Success = 0
    Failed = 0
    Duplicate = 0
    Errors = @()
}

Write-Host "Found $($files.Count) files to test`n" -ForegroundColor Cyan
Write-Host ("=" * 100) -ForegroundColor DarkGray

foreach ($file in $files) {
    $trackFolder = $file.Directory.Name
    $fileName = $file.Name
    
    Write-Host "`n[$trackFolder] $fileName" -ForegroundColor Yellow
    Write-Host ("  " + ("-" * 96)) -ForegroundColor DarkGray
    
    try {
        # Read file as bytes
        $fileContent = [System.IO.File]::ReadAllBytes($file.FullName)
        
        # Create multipart form
        $boundary = [System.Guid]::NewGuid().ToString()
        $LF = "`r`n"
        
        $bodyLines = (
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
            "Content-Type: application/octet-stream",
            "",
            [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileContent),
            "--$boundary--"
        ) -join $LF
        
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        $response = Invoke-RestMethod -Uri $uploadUrl -Method POST -Headers $headers -Body $bodyLines -ContentType "multipart/form-data; boundary=$boundary"
        
        if ($response.duplicate_file) {
            Write-Host "  DUPLICATE FILE: Already uploaded before" -ForegroundColor Magenta
            $results.Duplicate++
        }
        elseif ($response.success) {
            Write-Host "  SUCCESS" -ForegroundColor Green
            Write-Host "    Track: $($response.track.name)" -ForegroundColor White
            Write-Host "    Date: $($response.data.session_date)" -ForegroundColor White
            Write-Host "    Laps: $($response.data.laps_count)" -ForegroundColor White
            Write-Host "    Drivers: $($response.data.drivers_detected)" -ForegroundColor White
            
            if ($response.duplicate.exists) {
                Write-Host "    WARNING: Duplicate session (from '$($response.duplicate.original_file)')" -ForegroundColor Yellow
                $results.Duplicate++
            } else {
                $results.Success++
            }
            
            if ($response.warnings -and $response.warnings.Count -gt 0) {
                Write-Host "    Warnings:" -ForegroundColor Yellow
                foreach ($warn in $response.warnings) {
                    Write-Host "      - $warn" -ForegroundColor Yellow
                }
            }
        }
        else {
            Write-Host "  FAILED: Parse error" -ForegroundColor Red
            $results.Failed++
            if ($response.errors) {
                foreach ($err in $response.errors) {
                    Write-Host "    - $err" -ForegroundColor Red
                }
            }
            $results.Errors += "$fileName : $($response.errors -join ', ')"
        }
        
    } catch {
        Write-Host "  EXCEPTION" -ForegroundColor Red
        $results.Failed++
        
        $errorMsg = $_.Exception.Message
        
        if ($_.ErrorDetails.Message) {
            try {
                $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
                
                if ($errorBody.errors) {
                    Write-Host "    Errors:" -ForegroundColor Red
                    foreach ($err in $errorBody.errors) {
                        Write-Host "      - $err" -ForegroundColor Red
                    }
                    $errorMsg = $errorBody.errors -join ', '
                }
                
                if ($errorBody.message) {
                    Write-Host "    Message: $($errorBody.message)" -ForegroundColor Red
                    $errorMsg = $errorBody.message
                }
                
                if ($errorBody.error_details) {
                    Write-Host "    Details: File=$($errorBody.error_details.file) Line=$($errorBody.error_details.line)" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "    Raw error: $($_.ErrorDetails.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "    $errorMsg" -ForegroundColor Red
        }
        
        $results.Errors += "$fileName : $errorMsg"
    }
}

# Summary
Write-Host "`n" -NoNewline
Write-Host ("=" * 100) -ForegroundColor DarkGray
Write-Host "`n=== TEST SUMMARY ===" -ForegroundColor Cyan
Write-Host "Total Files:      $($results.Total)" -ForegroundColor White
Write-Host "Successful:       $($results.Success)" -ForegroundColor Green
Write-Host "Duplicates:       $($results.Duplicate)" -ForegroundColor Yellow
Write-Host "Failed:           $($results.Failed)" -ForegroundColor Red

if ($results.Errors.Count -gt 0) {
    Write-Host "`n=== ERRORS ===" -ForegroundColor Red
    foreach ($err in $results.Errors) {
        Write-Host "  - $err" -ForegroundColor Red
    }
}

Write-Host "`nTest Complete!" -ForegroundColor Cyan
