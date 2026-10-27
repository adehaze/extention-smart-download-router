const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const zipPath = path.join(distDir, 'smart-download-router.zip');

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// Files & directories to include in extension package
const includes = [
  'manifest.json',
  'background',
  'icons',
  'popup',
  'options',
  'shared'
];

// Check all required files exist
for (const item of includes) {
  const p = path.join(rootDir, item);
  if (!fs.existsSync(p)) {
    console.error(`Missing expected item: ${item}`);
    process.exit(1);
  }
}

// Use powershell Compress-Archive to build the zip
const itemsStr = includes.map(i => `'${path.join(rootDir, i)}'`).join(',');
const psCommand = `Compress-Archive -Path ${itemsStr} -DestinationPath '${zipPath}' -Force`;

console.log('Building store-ready extension ZIP...');
execSync(`powershell.exe -NoProfile -Command "${psCommand}"`, { stdio: 'inherit' });

if (fs.existsSync(zipPath)) {
  const stats = fs.statSync(zipPath);
  console.log(`Successfully created: ${zipPath} (${(stats.size / 1024).toFixed(1)} KB)`);
} else {
  console.error('Failed to create ZIP package.');
  process.exit(1);
}
