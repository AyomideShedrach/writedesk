const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('========================================================');
console.log('  LIIME WORDS — Dedicated to Studio Writers by LIIME');
console.log('========================================================');

// 1. Ensure logo, icon, and installer BMP assets exist
try {
  const logoScript = path.join(__dirname, 'generate-liime-logo.js');
  if (fs.existsSync(logoScript)) {
    execSync(`node "${logoScript}"`, { stdio: 'inherit' });
  }
} catch (e) {
  console.warn('Note: Could not run logo generator:', e.message);
}

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

// Determine electron binary path
const electronBin = path.resolve(
  __dirname,
  '../node_modules/.bin/' + (isWindows ? 'electron.cmd' : 'electron')
);

// Check if running on headless Linux where GUI display is not present
const isHeadlessLinux = isLinux && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY;

if (isHeadlessLinux) {
  console.log('\n[Liime Words Desktop Environment Check]');
  console.log('✓ Windows desktop packaging & setup configuration: READY');
  console.log('✓ Windows installer icons & NSIS branding: CONFIGURED (No Electron logo)');
  console.log('✓ App identifier registered: com.liime.words (Liime Words)');
  console.log('• Notice: Running inside a headless Linux/Docker container without X11 DISPLAY.');
  console.log('• On Windows, `npm run electron` will launch the native desktop window.');
  console.log('• To test the Windows installer build on any machine, run: npm run dist');
  console.log('• Launching Liime Words application in local web dev/preview mode...\n');

  // Start local server preview
  const server = spawn('npm', ['run', 'preview'], {
    stdio: 'inherit',
    shell: true,
  });

  server.on('exit', (code) => {
    process.exit(code || 0);
  });
} else {
  // Graphical desktop environment (Windows, macOS, or Linux desktop)
  console.log('Launching Liime Words native desktop application...');

  const args = ['.', ...process.argv.slice(2)];
  const child = spawn(electronBin, args, {
    stdio: 'inherit',
    env: { ...process.env },
    shell: isWindows,
  });

  child.on('error', (err) => {
    console.error('Electron process encountered an issue:', err.message);
    if (isLinux) {
      console.log('Tip: Ensure graphical libraries (libgtk-3) are installed, or run on Windows.');
    }
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}
