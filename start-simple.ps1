# PowerShell script for starting the simplified e-commerce platform

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
Print-Message -Color $Blue -Message "    Simple E-Commerce Platform Starter"
Print-Message -Color $Blue -Message "=========================================================="
Print-Message -Color $Green -Message "This script starts the simplified e-commerce platform."

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
    if (Test-Path -Path "env.example") {
        Copy-Item -Path "env.example" -Destination ".env"
        Print-Message -Color $Green -Message ".env file created. Please review and update values as needed."
    } else {
        Print-Message -Color $Yellow -Message "No env.example found. Creating basic .env file..."
        @"
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=ecommerce

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3100,http://localhost:3101
"@ | Out-File -FilePath ".env" -Encoding UTF8
        Print-Message -Color $Green -Message ".env file created with default values."
    }
} else {
    Print-Message -Color $Green -Message ".env file already exists."
}

# Startup options
Write-Host "`nSelect startup option:" -ForegroundColor $Yellow
Write-Host "1) Start in production mode"
Write-Host "2) Start in development mode (with hot reload)"
Write-Host "3) Start only backend services"
Write-Host "4) Stop all services"
Write-Host "5) View logs"
Write-Host "6) Exit"

$choice = Read-Host "Enter your choice (1-6)"

switch ($choice) {
    "1" {
        Print-Message -Color $Green -Message "`nStarting in production mode..."
        docker-compose -f docker-compose.simple.yml up -d --build
        Print-Message -Color $Green -Message "`n✅ All services started in production mode!"
        Print-Message -Color $Blue -Message "`nAccess points:"
        Print-Message -Color $Yellow -Message "Storefront:    http://localhost:3100"
        Print-Message -Color $Yellow -Message "Admin Panel:   http://localhost:3101"
        Print-Message -Color $Yellow -Message "API:           http://localhost:3000"
        Print-Message -Color $Yellow -Message "API Docs:      http://localhost:3000/docs"
        Print-Message -Color $Yellow -Message "Health Check:  http://localhost:3000/health"
    }
    "2" {
        Print-Message -Color $Green -Message "`nStarting in development mode..."
        docker-compose -f docker-compose.simple.yml -f docker-compose.dev.yml up -d --build
        Print-Message -Color $Green -Message "`n✅ All services started in development mode!"
        Print-Message -Color $Blue -Message "`nAccess points:"
        Print-Message -Color $Yellow -Message "Storefront:    http://localhost:3100"
        Print-Message -Color $Yellow -Message "Admin Panel:   http://localhost:3101"
        Print-Message -Color $Yellow -Message "API:           http://localhost:3000"
        Print-Message -Color $Yellow -Message "API Docs:      http://localhost:3000/docs"
        Print-Message -Color $Yellow -Message "Health Check:  http://localhost:3000/health"
        Print-Message -Color $Green -Message "`n💡 Hot reload is enabled - changes will be reflected automatically!"
    }
    "3" {
        Print-Message -Color $Green -Message "`nStarting only backend services..."
        docker-compose -f docker-compose.simple.yml up -d postgres redis api
        Print-Message -Color $Green -Message "`n✅ Backend services started!"
        Print-Message -Color $Blue -Message "`nAccess points:"
        Print-Message -Color $Yellow -Message "API:           http://localhost:3000"
        Print-Message -Color $Yellow -Message "API Docs:      http://localhost:3000/docs"
        Print-Message -Color $Yellow -Message "Health Check:  http://localhost:3000/health"
    }
    "4" {
        Print-Message -Color $Yellow -Message "`nStopping all services..."
        docker-compose -f docker-compose.simple.yml down
        Print-Message -Color $Green -Message "`n✅ All services stopped!"
    }
    "5" {
        Write-Host "`nSelect service to view logs:" -ForegroundColor $Yellow
        Write-Host "1) All services"
        Write-Host "2) API only"
        Write-Host "3) Storefront only"
        Write-Host "4) Admin panel only"
        Write-Host "5) Database only"
        
        $logChoice = Read-Host "Enter your choice (1-5)"
        
        switch ($logChoice) {
            "1" { docker-compose -f docker-compose.simple.yml logs -f }
            "2" { docker-compose -f docker-compose.simple.yml logs -f api }
            "3" { docker-compose -f docker-compose.simple.yml logs -f storefront }
            "4" { docker-compose -f docker-compose.simple.yml logs -f admin }
            "5" { docker-compose -f docker-compose.simple.yml logs -f postgres }
            default { Print-Message -Color $Red -Message "Invalid choice." }
        }
    }
    "6" {
        Print-Message -Color $Blue -Message "`nGoodbye!"
        exit 0
    }
    default {
        Print-Message -Color $Red -Message "Invalid choice. Please run the script again."
        exit 1
    }
}

Print-Message -Color $Blue -Message "`n=========================================================="
Print-Message -Color $Green -Message "Setup complete! Your e-commerce platform is ready."
Print-Message -Color $Blue -Message "==========================================================" 