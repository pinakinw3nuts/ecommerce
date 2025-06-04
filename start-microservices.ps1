# Simple script to start microservices
Write-Host "Starting microservices..."

# Setup
$projectRoot = $PSScriptRoot
$services = @(
    "auth-service", 
    "user-service", 
    "api-gateway", 
    "product-service", 
    "cart-service", 
    "checkout-service", 
    "order-service"
)

# Install and start each service
foreach ($service in $services) {
    $servicePath = "$projectRoot\services\$service"
    
    Write-Host "Starting $service..."
    Set-Location -Path $servicePath
    
    # Install dependencies
    if (-not (Test-Path -Path "node_modules")) {
        Write-Host "Installing dependencies for $service..."
        npm install
    }
    
    # Special handling for specific services
    if ($service -eq "user-service") {
        if (-not (Test-Path -Path "node_modules\ts-node-dev")) {
            Write-Host "Installing ts-node-dev globally..."
            npm install -g ts-node-dev
        }
    }
    
    if ($service -eq "product-service") {
        if (-not (Test-Path -Path "node_modules\ts-node")) {
            Write-Host "Installing ts-node globally..."
            npm install -g ts-node
        }
    }
    
    # Start the service
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
    Write-Host "$service started."
    
    # Wait a bit before starting the next service
    Start-Sleep -Seconds 3
}

# Return to project root
Set-Location -Path $projectRoot
Write-Host "All services started." 