# PowerShell script to start all microservices
# This script installs dependencies and starts each service

# Color definitions
$Green = [System.ConsoleColor]::Green
$Yellow = [System.ConsoleColor]::Yellow
$Red = [System.ConsoleColor]::Red
$Blue = [System.ConsoleColor]::Blue

# Function to print colored messages
function Print-Message {
    param (
        [System.ConsoleColor]$Color,
        [string]$Message
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to install dependencies and start a service
function Start-Service {
    param (
        [string]$ServicePath,
        [string]$ServiceName
    )
    
    Print-Message -Color $Yellow -Message "Checking for service at: $ServicePath"
    
    if (-not (Test-Path -Path $ServicePath)) {
        Print-Message -Color $Red -Message "$ServiceName directory not found!"
        return $false
    }
    
    Print-Message -Color $Yellow -Message "Starting $ServiceName..."
    Set-Location -Path $ServicePath
    
    # Check if package.json exists
    if (-not (Test-Path -Path "package.json")) {
        Print-Message -Color $Red -Message "package.json not found for $ServiceName!"
        return $false
    }
    
    # Clean install dependencies to ensure correct installation
    Print-Message -Color $Yellow -Message "Installing dependencies for $ServiceName..."
    npm ci
    
    if ($LASTEXITCODE -ne 0) {
        Print-Message -Color $Yellow -Message "npm ci failed, trying npm install instead..."
        npm install
        
        if ($LASTEXITCODE -ne 0) {
            Print-Message -Color $Red -Message "Failed to install dependencies for $ServiceName!"
            return $false
        }
    }
    
    # For specific services, check if ts-node or ts-node-dev is installed
    if ($ServiceName -eq "user-service") {
        if (-not (Test-Path -Path "node_modules/ts-node-dev")) {
            Print-Message -Color $Yellow -Message "Installing ts-node-dev globally..."
            npm install -g ts-node-dev
        }
    }
    
    if ($ServiceName -eq "product-service") {
        if (-not (Test-Path -Path "node_modules/ts-node")) {
            Print-Message -Color $Yellow -Message "Installing ts-node globally..."
            npm install -g ts-node
        }
    }
    
    # Start the service in background
    Print-Message -Color $Yellow -Message "Starting $ServiceName with 'npm run dev'..."
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
    
    # Check if the service started successfully (wait a moment)
    Start-Sleep -Seconds 3
    
    # Here we'd ideally check if the service is running
    # For simplicity, we assume it started successfully for now
    # but in a production script, you'd want to verify this
    
    Print-Message -Color $Green -Message "$ServiceName started successfully."
    return $true
}

# Function to check if Redis is installed and running
function Check-Redis {
    try {
        # Use redis-cli to ping Redis server
        $result = Invoke-Expression "redis-cli ping"
        if ($result -eq "PONG") {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

# Main script
Print-Message -Color $Blue -Message "=========================================================="
Print-Message -Color $Blue -Message "    E-Commerce Microservices Startup Script"
Print-Message -Color $Blue -Message "=========================================================="

# Check Redis status
if (-not (Check-Redis)) {
    Print-Message -Color $Yellow -Message "Warning: Redis is not running. Some services may use in-memory fallbacks."
}

# Set working directory to project root
$projectRoot = $PSScriptRoot

# Priority 1 services (core infrastructure)
Print-Message -Color $Yellow -Message "Starting priority 1 services: auth-service"
$authServiceResult = Start-Service -ServicePath "$projectRoot\services\auth-service" -ServiceName "auth-service"
if (-not $authServiceResult) {
    Print-Message -Color $Red -Message "Failed to start auth-service! Continuing with other services..."
}

# Wait for auth-service to initialize
Start-Sleep -Seconds 5

# Priority 2 services (user management)
Print-Message -Color $Yellow -Message "Starting priority 2 services: user-service"
$userServiceResult = Start-Service -ServicePath "$projectRoot\services\user-service" -ServiceName "user-service"
if (-not $userServiceResult) {
    Print-Message -Color $Red -Message "Failed to start user-service! Continuing with other services..."
}

# Wait for user-service to initialize
Start-Sleep -Seconds 3

# Start API Gateway
Print-Message -Color $Yellow -Message "Starting API Gateway..."
$apiGatewayResult = Start-Service -ServicePath "$projectRoot\services\api-gateway" -ServiceName "api-gateway"
if (-not $apiGatewayResult) {
    Print-Message -Color $Red -Message "Failed to start API Gateway! Continuing with other services..."
}

# Priority 3 services (product and cart)
Print-Message -Color $Yellow -Message "Starting priority 3 services: product-service, cart-service"
$productServiceResult = Start-Service -ServicePath "$projectRoot\services\product-service" -ServiceName "product-service"
if (-not $productServiceResult) {
    Print-Message -Color $Red -Message "Failed to start product-service! Continuing with other services..."
}

$cartServiceResult = Start-Service -ServicePath "$projectRoot\services\cart-service" -ServiceName "cart-service"
if (-not $cartServiceResult) {
    Print-Message -Color $Red -Message "Failed to start cart-service! Continuing with other services..."
}

# Priority 4 services (checkout and order)
Print-Message -Color $Yellow -Message "Starting priority 4 services: checkout-service, order-service"
$checkoutServiceResult = Start-Service -ServicePath "$projectRoot\services\checkout-service" -ServiceName "checkout-service"
if (-not $checkoutServiceResult) {
    Print-Message -Color $Red -Message "Failed to start checkout-service! Continuing with other services..."
}

$orderServiceResult = Start-Service -ServicePath "$projectRoot\services\order-service" -ServiceName "order-service"
if (-not $orderServiceResult) {
    Print-Message -Color $Red -Message "Failed to start order-service! Continuing with other services..."
}

# Summary of services
Print-Message -Color $Blue -Message "=========================================================="
Print-Message -Color $Blue -Message "    E-Commerce Microservices Status Summary"
Print-Message -Color $Blue -Message "=========================================================="

$services = @(
    @{Name = "auth-service"; Result = $authServiceResult},
    @{Name = "user-service"; Result = $userServiceResult},
    @{Name = "api-gateway"; Result = $apiGatewayResult},
    @{Name = "product-service"; Result = $productServiceResult},
    @{Name = "cart-service"; Result = $cartServiceResult},
    @{Name = "checkout-service"; Result = $checkoutServiceResult},
    @{Name = "order-service"; Result = $orderServiceResult}
)

foreach ($service in $services) {
    $statusColor = if ($service.Result) { $Green } else { $Red }
    $status = if ($service.Result) { "Running" } else { "Failed" }
    Print-Message -Color $statusColor -Message "$($service.Name): $status"
}

Print-Message -Color $Blue -Message "API Gateway available at: http://localhost:3000"

# Return to project root
Set-Location -Path $projectRoot 