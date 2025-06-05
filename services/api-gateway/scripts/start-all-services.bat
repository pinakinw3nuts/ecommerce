@echo off
echo Starting all microservices in separate windows...

cd %~dp0\..\..\..

REM Start API Gateway
cd services\api-gateway
start powershell -NoExit "pnpm run dev"
cd ..\..

REM Start Auth Service
cd services\auth-service
start powershell -NoExit "pnpm run dev"
cd ..\..

REM Start User Service
cd services\user-service
start powershell -NoExit "pnpm run dev"
cd ..\..

REM Start Product Service
cd services\product-service
start powershell -NoExit "pnpm run dev"
cd ..\..

REM Start Cart Service
cd services\cart-service
start powershell -NoExit "pnpm run dev"
cd ..\..

REM Start Checkout Service
cd services\checkout-service
start powershell -NoExit "pnpm run dev"
cd ..\..

REM Start Order Service
cd services\order-service
start powershell -NoExit "pnpm run dev"
cd ..\..

REM Start Payment Service
cd services\payment-service
start powershell -NoExit "pnpm run dev"
cd ..\..

REM Start Shipping Service
cd services\shipping-service
start powershell -NoExit "pnpm run dev"
cd ..\..

REM Start Inventory Service
cd services\inventory-service
start powershell -NoExit "pnpm run dev"
cd ..\..

REM Start Company Service
cd services\company-service
start powershell -NoExit "pnpm run dev"
cd ..\..

REM Start Pricing Service
cd services\pricing-service
start powershell -NoExit "pnpm run dev"
cd ..\..

REM Start Admin Service
cd services\admin-service
start powershell -NoExit "pnpm run dev"
cd ..\..

REM Start Wishlist Service
cd services\wishlist-service
start powershell -NoExit "pnpm run dev"
cd ..\..

REM Start Review Service
cd services\review-service
start powershell -NoExit "pnpm run dev"
cd ..\..

REM Start Notification Service
cd services\notification-service
start powershell -NoExit "pnpm run dev"
cd ..\..

REM Start CMS Service
cd services\cms-service
start powershell -NoExit "pnpm run dev"
cd ..\..

echo All services started. Run 'npm run check:ports' to verify. 