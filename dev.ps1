# PowerShell script for development tasks

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
Print-Message -Color $Blue -Message "    E-Commerce Microservices Development Tools"
Print-Message -Color $Blue -Message "=========================================================="
Print-Message -Color $Green -Message "This script helps with development tasks."

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

# Development options
Write-Host "`nSelect development option:" -ForegroundColor $Yellow
Write-Host "1) Start all services in development mode"
Write-Host "2) Start only API Gateway and essential services"
Write-Host "3) Start a specific service in development mode"
Write-Host "4) Run database migrations"
Write-Host "5) Generate API documentation"
Write-Host "6) Create a new microservice from template"
Write-Host "7) Exit"

$choice = Read-Host "Enter your choice (1-7)"

switch ($choice) {
    "1" {
        Print-Message -Color $Green -Message "`nStarting all services in development mode..."
        docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
        Print-Message -Color $Green -Message "`nAll services started in development mode!"
        Print-Message -Color $Blue -Message "`nAccess points:"
        Print-Message -Color $Yellow -Message "API Gateway:   http://localhost:3000"
        Print-Message -Color $Yellow -Message "Storefront:    http://localhost:3100"
        Print-Message -Color $Yellow -Message "Admin Panel:   http://localhost:3101"
        Print-Message -Color $Yellow -Message "CMS Admin:     http://localhost:3016/admin"
    }
    "2" {
        Print-Message -Color $Green -Message "`nStarting API Gateway and essential services..."
        docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d redis postgres api-gateway auth-service user-service product-service
        Print-Message -Color $Green -Message "`nAPI Gateway and essential services started!"
        Print-Message -Color $Blue -Message "`nAccess points:"
        Print-Message -Color $Yellow -Message "API Gateway:   http://localhost:3000"
    }
    "3" {
        Write-Host "`nAvailable services:" -ForegroundColor $Yellow
        Write-Host "1) api-gateway"
        Write-Host "2) auth-service"
        Write-Host "3) user-service"
        Write-Host "4) product-service"
        Write-Host "5) cart-service"
        Write-Host "6) checkout-service"
        Write-Host "7) order-service"
        Write-Host "8) payment-service"
        Write-Host "9) shipping-service"
        Write-Host "10) inventory-service"
        Write-Host "11) company-service"
        Write-Host "12) pricing-service"
        Write-Host "13) admin-service"
        Write-Host "14) wishlist-service"
        Write-Host "15) review-service"
        Write-Host "16) notification-service"
        Write-Host "17) cms-service"
        Write-Host "18) storefront"
        Write-Host "19) admin-panel"
        
        $serviceChoice = Read-Host "Enter the service number to start (1-19)"
        
        switch ($serviceChoice) {
            "1" { $service = "api-gateway" }
            "2" { $service = "auth-service" }
            "3" { $service = "user-service" }
            "4" { $service = "product-service" }
            "5" { $service = "cart-service" }
            "6" { $service = "checkout-service" }
            "7" { $service = "order-service" }
            "8" { $service = "payment-service" }
            "9" { $service = "shipping-service" }
            "10" { $service = "inventory-service" }
            "11" { $service = "company-service" }
            "12" { $service = "pricing-service" }
            "13" { $service = "admin-service" }
            "14" { $service = "wishlist-service" }
            "15" { $service = "review-service" }
            "16" { $service = "notification-service" }
            "17" { $service = "cms-service" }
            "18" { $service = "storefront" }
            "19" { $service = "admin-panel" }
            default {
                Print-Message -Color $Red -Message "Invalid choice"
                exit 1
            }
        }
        
        Print-Message -Color $Green -Message "`nStarting $service in development mode..."
        Set-Location -Path "./services/$service"
        npm run dev
    }
    "4" {
        Print-Message -Color $Green -Message "`nRunning database migrations..."
        # First ensure the database is up
        docker compose up -d postgres
        
        Write-Host "`nSelect service for migrations:" -ForegroundColor $Yellow
        Write-Host "1) All services"
        Write-Host "2) auth-service"
        Write-Host "3) user-service"
        Write-Host "4) product-service"
        Write-Host "5) Return to main menu"
        
        $migrationChoice = Read-Host "Enter your choice (1-5)"
        
        switch ($migrationChoice) {
            "1" {
                Print-Message -Color $Green -Message "`nRunning migrations for all services..."
                $services = @("auth-service", "user-service", "product-service", "cart-service", "checkout-service", "order-service", "payment-service")
                foreach ($svc in $services) {
                    Print-Message -Color $Yellow -Message "Running migrations for $svc..."
                    cd "./services/$svc"
                    npm run migration:run
                    cd "../.."
                }
            }
            "2" {
                cd "./services/auth-service"
                npm run migration:run
                cd "../.."
            }
            "3" {
                cd "./services/user-service"
                npm run migration:run
                cd "../.."
            }
            "4" {
                cd "./services/product-service"
                npm run migration:run
                cd "../.."
            }
            "5" {
                # Return to main menu
            }
            default {
                Print-Message -Color $Red -Message "Invalid choice"
            }
        }
    }
    "5" {
        Print-Message -Color $Green -Message "`nGenerating API documentation..."
        
        Write-Host "`nSelect service for API documentation:" -ForegroundColor $Yellow
        Write-Host "1) All services"
        Write-Host "2) api-gateway"
        Write-Host "3) auth-service"
        Write-Host "4) user-service"
        Write-Host "5) product-service"
        Write-Host "6) Return to main menu"
        
        $docsChoice = Read-Host "Enter your choice (1-6)"
        
        switch ($docsChoice) {
            "1" {
                Print-Message -Color $Green -Message "`nGenerating documentation for all services..."
                $services = @("api-gateway", "auth-service", "user-service", "product-service")
                foreach ($svc in $services) {
                    Print-Message -Color $Yellow -Message "Generating documentation for $svc..."
                    cd "./services/$svc"
                    npm run docs
                    cd "../.."
                }
            }
            "2" {
                cd "./services/api-gateway"
                npm run docs
                cd "../.."
            }
            "3" {
                cd "./services/auth-service"
                npm run docs
                cd "../.."
            }
            "4" {
                cd "./services/user-service"
                npm run docs
                cd "../.."
            }
            "5" {
                cd "./services/product-service"
                npm run docs
                cd "../.."
            }
            "6" {
                # Return to main menu
            }
            default {
                Print-Message -Color $Red -Message "Invalid choice"
            }
        }
    }
    "6" {
        $serviceName = Read-Host "Enter the name of the new microservice (e.g., 'email-service')"
        
        if ([string]::IsNullOrWhiteSpace($serviceName)) {
            Print-Message -Color $Red -Message "Service name cannot be empty"
            exit 1
        }
        
        Print-Message -Color $Green -Message "`nCreating new microservice: $serviceName..."
        
        # Copy from template service (auth-service as base)
        Copy-Item -Path "./services/auth-service" -Destination "./services/$serviceName" -Recurse
        
        # Update package.json
        $packageJsonPath = "./services/$serviceName/package.json"
        $packageJson = Get-Content -Path $packageJsonPath | ConvertFrom-Json
        $packageJson.name = "@ecom/$serviceName"
        $packageJson.description = "Microservice for $serviceName functionality"
        $packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path $packageJsonPath
        
        Print-Message -Color $Green -Message "`nMicroservice created successfully at ./services/$serviceName"
        Print-Message -Color $Yellow -Message "Remember to update the following:"
        Print-Message -Color $Yellow -Message "1. Update the docker-compose.yml file to include your service"
        Print-Message -Color $Yellow -Message "2. Update the API Gateway to route to your new service"
        Print-Message -Color $Yellow -Message "3. Customize the entity models and routes"
    }
    "7" {
        Print-Message -Color $Green -Message "`nExiting..."
        exit 0
    }
    default {
        Print-Message -Color $Red -Message "`nInvalid choice. Exiting..."
        exit 1
    }
}

# Display service status
Print-Message -Color $Yellow -Message "`nService Status:"
docker compose ps

Print-Message -Color $Green -Message "`nDevelopment process completed!" 