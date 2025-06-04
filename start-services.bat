@echo off
echo Starting microservices...

set SERVICES=auth-service user-service api-gateway product-service cart-service checkout-service order-service

REM Install ts-node and ts-node-dev globally
echo Installing global dependencies...
call npm install -g ts-node ts-node-dev

for %%s in (%SERVICES%) do (
    echo Starting %%s...
    cd services\%%s
    
    REM Install dependencies if not already installed
    if not exist node_modules (
        echo Installing dependencies for %%s...
        call npm install
    )
    
    REM Start the service
    start "%%s" cmd /c npm run dev
    
    REM Wait a moment before starting the next service
    timeout /t 3 > nul
    
    cd ..\..
)

echo All services started!
echo API Gateway should be available at: http://localhost:3000 