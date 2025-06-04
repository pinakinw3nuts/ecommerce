#!/bin/bash

# Color definitions
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
  echo -e "${1}${2}${NC}"
}

# Function to check if Docker is running
check_docker() {
  if ! docker info > /dev/null 2>&1; then
    print_message "${RED}" "Error: Docker is not running. Please start Docker first."
    exit 1
  fi
}

# Function to check if Docker Compose is installed
check_docker_compose() {
  if ! docker compose version > /dev/null 2>&1; then
    print_message "${RED}" "Error: Docker Compose is not installed or not in PATH."
    exit 1
  fi
}

# Welcome message
print_message "${BLUE}" "=========================================================="
print_message "${BLUE}" "    E-Commerce Microservices Deployment"
print_message "${BLUE}" "=========================================================="
print_message "${GREEN}" "This script will build and deploy all microservices."

# Check prerequisites
print_message "${YELLOW}" "\nChecking prerequisites..."
check_docker
check_docker_compose
print_message "${GREEN}" "Prerequisites satisfied."

# Check if .env file exists
if [ ! -f .env ]; then
  print_message "${YELLOW}" "\nNo .env file found. Creating from env.example..."
  cp env.example .env
  print_message "${GREEN}" ".env file created. Please review and update values as needed."
else
  print_message "${GREEN}" ".env file already exists."
fi

# Build and deploy options
echo -e "\n${YELLOW}Select deployment option:${NC}"
echo "1) Build and deploy all services (full deployment)"
echo "2) Deploy only API Gateway and essential services"
echo "3) Deploy only frontend applications"
echo "4) Stop all services and clean up"
echo "5) Rebuild a specific service"
echo "6) Exit"

read -p "Enter your choice (1-6): " choice

case $choice in
  1)
    print_message "${GREEN}" "\nBuilding and deploying all services..."
    docker compose build
    docker compose up -d
    print_message "${GREEN}" "\nAll services deployed successfully!"
    print_message "${BLUE}" "\nAccess points:"
    print_message "${YELLOW}" "API Gateway:   http://localhost:3000"
    print_message "${YELLOW}" "Storefront:    http://localhost:3100"
    print_message "${YELLOW}" "Admin Panel:   http://localhost:3101"
    print_message "${YELLOW}" "CMS Admin:     http://localhost:3016/admin"
    ;;
  2)
    print_message "${GREEN}" "\nDeploying API Gateway and essential services..."
    docker compose up -d redis postgres api-gateway auth-service user-service product-service
    print_message "${GREEN}" "\nAPI Gateway and essential services deployed successfully!"
    print_message "${BLUE}" "\nAccess points:"
    print_message "${YELLOW}" "API Gateway:   http://localhost:3000"
    ;;
  3)
    print_message "${GREEN}" "\nDeploying frontend applications..."
    docker compose up -d storefront admin-panel
    print_message "${GREEN}" "\nFrontend applications deployed successfully!"
    print_message "${BLUE}" "\nAccess points:"
    print_message "${YELLOW}" "Storefront:    http://localhost:3100"
    print_message "${YELLOW}" "Admin Panel:   http://localhost:3101"
    ;;
  4)
    print_message "${YELLOW}" "\nStopping all services and cleaning up..."
    docker compose down
    print_message "${GREEN}" "\nAll services stopped successfully!"
    ;;
  5)
    echo -e "\n${YELLOW}Available services:${NC}"
    echo "1) api-gateway"
    echo "2) auth-service"
    echo "3) user-service"
    echo "4) product-service"
    echo "5) cart-service"
    echo "6) checkout-service"
    echo "7) order-service"
    echo "8) payment-service"
    echo "9) shipping-service"
    echo "10) inventory-service"
    echo "11) company-service"
    echo "12) pricing-service"
    echo "13) admin-service"
    echo "14) wishlist-service"
    echo "15) review-service"
    echo "16) notification-service"
    echo "17) cms-service"
    echo "18) storefront"
    echo "19) admin-panel"
    
    read -p "Enter the service number to rebuild (1-19): " service_choice
    
    case $service_choice in
      1) service="api-gateway" ;;
      2) service="auth-service" ;;
      3) service="user-service" ;;
      4) service="product-service" ;;
      5) service="cart-service" ;;
      6) service="checkout-service" ;;
      7) service="order-service" ;;
      8) service="payment-service" ;;
      9) service="shipping-service" ;;
      10) service="inventory-service" ;;
      11) service="company-service" ;;
      12) service="pricing-service" ;;
      13) service="admin-service" ;;
      14) service="wishlist-service" ;;
      15) service="review-service" ;;
      16) service="notification-service" ;;
      17) service="cms-service" ;;
      18) service="storefront" ;;
      19) service="admin-panel" ;;
      *) 
        print_message "${RED}" "Invalid choice"
        exit 1
        ;;
    esac
    
    print_message "${GREEN}" "\nRebuilding and redeploying ${service}..."
    docker compose build ${service}
    docker compose up -d ${service}
    print_message "${GREEN}" "\n${service} rebuilt and redeployed successfully!"
    ;;
  6)
    print_message "${GREEN}" "\nExiting..."
    exit 0
    ;;
  *)
    print_message "${RED}" "\nInvalid choice. Exiting..."
    exit 1
    ;;
esac

# Display service status
print_message "${YELLOW}" "\nService Status:"
docker compose ps

print_message "${GREEN}" "\nDeployment process completed!" 