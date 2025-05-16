const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Compile TypeScript files using ts-node in transpileOnly mode
try {
  console.log('Compiling TypeScript files...');
  execSync('npx tsc --outDir dist --skipLibCheck --noEmit false', {
    stdio: 'inherit'
  });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
} 