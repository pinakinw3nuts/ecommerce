# Automatic Storage Synchronization System

This project implements an automatic file synchronization system for handling media files across all services. The system provides real-time synchronization of files between the central storage and all application directories.

## Overview

The storage system consists of:

1. A central storage directory at the project root
2. Real-time file monitoring that detects any changes to files or directories
3. Automatic synchronization of files to all application public directories
4. Cross-platform compatibility without requiring administrator privileges

## Directory Structure

```
/ecommerce/               # Project root
  /storage/               # Centralized storage location
    /brands/              # Brand logos and images
    /categories/          # Category images
    /products/            # Product images
    /banners/             # Marketing banners
    /uploads/             # General uploads
  /apps/
    /storefront/
      /public/
        /storage/         # Automatically synced copy
    /admin-panel/
      /public/
        /storage/         # Automatically synced copy
```

## How It Works

1. The system monitors the central `/storage` directory for any file changes
2. When a file is added, modified, or deleted, the change is detected in real-time
3. The change is automatically synchronized to all app public directories
4. This happens in the background with no manual intervention needed

## Usage

### Running the File Synchronization

To start the automatic file synchronization:

```bash
npm run storage:sync
```

This will:
1. Create any missing directories in the storage structure
2. Perform an initial synchronization of all existing files
3. Begin watching for file changes in real-time

The process will continue running and log all file operations. Press Ctrl+C to stop.

### Installing as a Background Service

#### Windows

To install as a Windows service (runs at system startup):

```bash
npm run storage:service:install
```

To uninstall the service:

```bash
npm run storage:service:uninstall
```

#### Linux/Unix

To install as a systemd service on Linux:

```bash
sudo ./scripts/install-linux-service.sh
```

To check service status:

```bash
sudo systemctl status storage-sync
```

To uninstall:

```bash
sudo systemctl disable storage-sync && sudo rm /etc/systemd/system/storage-sync.service
```

## Automatic Integration

The storage synchronization is automatically run as part of the build and development processes through the `predev` and `prebuild` npm scripts.

## File Paths

When accessing files in code, use paths relative to the `/storage` directory. The frontend applications have this directory available at `/storage/*`.

Example usage:

```typescript
// For a brand logo stored at /storage/brands/logo.png
const logoPath = `/storage/brands/logo.png`;
```

## Advantages

- Works on all platforms without administrator privileges
- No symbolic links required
- Real-time synchronization ensures files are always up to date
- Automatic recovery from network interruptions
- Simple to use and maintain 