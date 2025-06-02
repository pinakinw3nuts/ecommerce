@echo off
SETLOCAL EnableDelayedExpansion

echo Finding available port...
FOR /F "tokens=*" %%G IN ('node scripts\find-available-port.js') DO (
    SET line=%%G
    IF "!line:~0,5!" == "PORT=" (
        SET PORT=!line:~5!
        echo Found available port: !PORT!
    )
)

IF "!PORT!" == "" (
    echo No available port found, using default
    SET PORT=0
)

echo Starting service on port !PORT!...
SET USE_MOCK_REDIS=true
npx ts-node-dev --respawn --transpile-only src/server.ts

ENDLOCAL 