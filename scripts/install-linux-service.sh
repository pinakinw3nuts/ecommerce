#!/bin/bash

# Storage Sync Linux Service Installer

# Get the absolute path of the project
PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)

# Service name
SERVICE_NAME="storage-sync"

echo "Installing $SERVICE_NAME service..."

# Create a temporary service file
SERVICE_FILE=$(mktemp)

# Write service definition to the temp file
cat > "$SERVICE_FILE" << EOL
[Unit]
Description=Storage Sync Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR
ExecStart=$(which node) $PROJECT_DIR/scripts/storage-sync.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOL

# Copy the service file to systemd directory
sudo cp "$SERVICE_FILE" "/etc/systemd/system/$SERVICE_NAME.service"
rm "$SERVICE_FILE"

# Set permissions
sudo chmod 644 "/etc/systemd/system/$SERVICE_NAME.service"

# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable and start the service
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl start "$SERVICE_NAME"

echo "Service $SERVICE_NAME has been installed and started."
echo "To check status: sudo systemctl status $SERVICE_NAME"
echo "To stop service: sudo systemctl stop $SERVICE_NAME"
echo "To uninstall: sudo systemctl disable $SERVICE_NAME && sudo rm /etc/systemd/system/$SERVICE_NAME.service" 