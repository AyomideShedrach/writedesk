const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');

const appPath = path.resolve(__dirname, '..');
const child = spawn(electron, [appPath], { stdio: 'inherit' });

child.on('close', (code) => {
  process.exit(code || 0);
});
