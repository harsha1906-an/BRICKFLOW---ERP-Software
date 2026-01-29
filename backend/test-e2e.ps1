# E2E API Testing Script - PowerShell
# Real Estate ERP System

$baseUrl = "http://localhost:5001/api"
$adminToken = ""
$siteToken = ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " E2E API Testing - Real Estate ERP" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Test 1: Admin Login
Write-Host "`nTEST 1: Admin Login" -ForegroundColor Yellow

try {
    $loginBody = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post `
        -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    
    $adminToken = $response.data.token
    
    if ($adminToken) {
        Write-Host "✅ PASS: Admin login successful" -ForegroundColor Green
        Write-Host "Token: $($adminToken.Substring(0, [Math]::Min(20, $adminToken.Length)))..."
    } else {
        Write-Host "❌ FAIL: No token received" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL: Admin login failed - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Server may not be running on port 5001" -ForegroundColor Red
    exit 1
}

# Test 2: Get Projects (Basic Read Test)
Write-Host "`nTEST 2: Get Projects List" -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
    }
    
    $projects = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Get `
        -Headers $headers -ErrorAction Stop
    
    Write-Host "✅ PASS: Projects retrieved successfully" -ForegroundColor Green
    Write-Host "Total projects: $($projects.data.Count)"
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Create Project
Write-Host "`nTEST 3: Create New Project" -ForegroundColor Yellow

try {
    $projectBody = @{
        name = "E2E Test Project $(Get-Date -Format 'HHmmss')"
        location = "Test City"
        start_date = "2026-01-29"
        status = "ongoing"
    } | ConvertTo-Json

    $projectResponse = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Post `
        -Body $projectBody -ContentType "application/json" -Headers $headers
    
    $script:projectId = $projectResponse.data.id
    
    Write-Host "✅ PASS: Project created (ID: $projectId)" -ForegroundColor Green
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Create Material
Write-Host "`nTEST 4: Create Material" -ForegroundColor Yellow

try {
    $materialBody = @{
        name = "Test Cement E2E"
        unit = "bags"
    } | ConvertTo-Json

    $materialResponse = Invoke-RestMethod -Uri "$baseUrl/materials" -Method Post `
        -Body $materialBody -ContentType "application/json" -Headers $headers
    
    $script:materialId = $materialResponse.data.id
    
    Write-Host "✅ PASS: Material created (ID: $materialId)" -ForegroundColor Green
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Create Supplier
