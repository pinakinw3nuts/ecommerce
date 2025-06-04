# PowerShell script for deploying the API Gateway with all microservices

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

# Function to check if Docker is running
function Check-Docker {
    try {
        docker info | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to check if Docker Compose is installed
function Check-DockerCompose {
    try {
        docker compose version | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Welcome message
Print-Message -Color $Blue -Message "=========================================================="
Print-Message -Color $Blue -Message "    API Gateway Deployment with Microservices"
Print-Message -Color $Blue -Message "=========================================================="
Print-Message -Color $Green -Message "This script will deploy the API Gateway with all microservices."

# Check prerequisites
Print-Message -Color $Yellow -Message "`nChecking prerequisites..."
if (-not (Check-Docker)) {
    Print-Message -Color $Red -Message "Error: Docker is not running. Please start Docker first."
    exit 1
}
if (-not (Check-DockerCompose)) {
    Print-Message -Color $Red -Message "Error: Docker Compose is not installed or not in PATH."
    exit 1
}
Print-Message -Color $Green -Message "Prerequisites satisfied."

# Check if .env file exists
if (-not (Test-Path -Path ".env")) {
    Print-Message -Color $Yellow -Message "`nNo .env file found. Creating from env.example..."
    Copy-Item -Path "env.example" -Destination ".env"
    Print-Message -Color $Green -Message ".env file created. Please review and update values as needed."
} else {
    Print-Message -Color $Green -Message ".env file already exists."
}

# Ask user for deployment type
Write-Host "`nSelect deployment type:" -ForegroundColor $Yellow
Write-Host "1) Production deployment (optimized for performance)"
Write-Host "2) Development deployment (with hot-reloading and debugging)"
Write-Host "3) Exit"

$deployType = Read-Host "Enter your choice (1-3)"

switch ($deployType) {
    "1" {
        Print-Message -Color $Green -Message "`nPreparing production deployment..."
        
        Print-Message -Color $Yellow -Message "`nStep 1: Building API Gateway..."
        docker compose build api-gateway
        if ($LASTEXITCODE -ne 0) {
            Print-Message -Color $Red -Message "Error building API Gateway. Please check logs."
            exit 1
        }
        
        Print-Message -Color $Yellow -Message "`nStep 2: Building required infrastructure (Redis, PostgreSQL)..."
        docker compose up -d redis postgres
        if ($LASTEXITCODE -ne 0) {
            Print-Message -Color $Red -Message "Error starting infrastructure. Please check logs."
            exit 1
        }
        
        Print-Message -Color $Yellow -Message "`nStep 3: Building and starting core services..."
        $coreServices = @("auth-service", "user-service", "product-service", "cart-service", "order-service", "payment-service")
        foreach ($service in $coreServices) {
            Print-Message -Color $Yellow -Message "Building and starting $service..."
            docker compose build $service
            docker compose up -d $service
            Start-Sleep -Seconds 2
        }
        
        Print-Message -Color $Yellow -Message "`nStep 4: Starting API Gateway..."
        docker compose up -d api-gateway
        if ($LASTEXITCODE -ne 0) {
            Print-Message -Color $Red -Message "Error starting API Gateway. Please check logs."
            exit 1
        }
        
        Print-Message -Color $Yellow -Message "`nStep 5: Building and starting remaining services..."
        $remainingServices = @(
            "checkout-service", "shipping-service", "inventory-service", 
            "company-service", "pricing-service", "admin-service", 
            "wishlist-service", "review-service", "notification-service", "cms-service"
        )
        foreach ($service in $remainingServices) {
            Print-Message -Color $Yellow -Message "Building and starting $service..."
            docker compose build $service
            docker compose up -d $service
            Start-Sleep -Seconds 2
        }
        
        Print-Message -Color $Green -Message "`nAll services have been deployed successfully!"
    }
    "2" {
        Print-Message -Color $Green -Message "`nPreparing development deployment..."
        
        Print-Message -Color $Yellow -Message "`nStep 1: Building required infrastructure (Redis, PostgreSQL)..."
        docker compose up -d redis postgres
        
        Print-Message -Color $Yellow -Message "`nStep 2: Building and starting API Gateway in development mode..."
        docker compose -f docker-compose.yml -f docker-compose.dev.yml build api-gateway
        docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d api-gateway
        
        Print-Message -Color $Yellow -Message "`nStep 3: Building and starting core services in development mode..."
        $coreServices = @("auth-service", "user-service", "product-service")
        foreach ($service in $coreServices) {
            Print-Message -Color $Yellow -Message "Building and starting $service..."
            docker compose -f docker-compose.yml -f docker-compose.dev.yml build $service
            docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d $service
            Start-Sleep -Seconds 2
        }
        
        Print-Message -Color $Yellow -Message "`nStep 4: Starting developer tools..."
        docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d pgadmin redis-commander
        
        Print-Message -Color $Green -Message "`nDevelopment environment has been set up successfully!"
    }
    "3" {
        Print-Message -Color $Green -Message "`nExiting..."
        exit 0
    }
    default {
        Print-Message -Color $Red -Message "`nInvalid choice. Exiting..."
        exit 1
    }
}

# Show service status
Print-Message -Color $Yellow -Message "`nService Status:"
docker compose ps

# Show access information
Print-Message -Color $Blue -Message "`nAccess Points:"
Print-Message -Color $Yellow -Message "API Gateway:   http://localhost:3000"
Print-Message -Color $Yellow -Message "Storefront:    http://localhost:3100"
Print-Message -Color $Yellow -Message "Admin Panel:   http://localhost:3101"
Print-Message -Color $Yellow -Message "CMS Admin:     http://localhost:3016/admin"

if ($deployType -eq "2") {
    Print-Message -Color $Yellow -Message "PgAdmin:       http://localhost:8080 (Email: admin@example.com, Password: admin123)"
    Print-Message -Color $Yellow -Message "Redis Commander: http://localhost:8081"
}

Print-Message -Color $Green -Message "`nDeployment completed successfully!"
Print-Message -Color $Yellow -Message "To view logs for a specific service, run: docker compose logs -f service-name" 