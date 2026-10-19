const { contextBridge } = require('electron');

// Expose safe, isolated desktop context
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
});
