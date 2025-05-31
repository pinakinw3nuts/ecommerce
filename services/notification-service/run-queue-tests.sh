#!/bin/bash

echo "Starting Redis for tests..."
docker-compose up -d redis

echo "Waiting for Redis to be ready..."
sleep 3

echo "Running email queue tests..."
npm run test -- src/tests/queues/emailQueue.test.ts

echo "Tests completed, stopping Redis container..."
docker-compose stop redis

echo "Done!" 