const { app, BrowserWindow, Menu, shell, nativeImage } = require('electron');
const path = require('path');

// Prevent multiple conflicting application instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Ensure Windows taskbar and notifications are properly grouped under LIIME Liime Words
if (process.platform === 'win32') {
  app.setAppUserModelId('com.liime.words');
}

let mainWindow = null;

function getAppIcon() {
  const fs = require('fs');
  const candidates = [
    path.join(__dirname, '../build/icon.ico'),
    path.join(__dirname, '../build/icon.png'),
    path.join(__dirname, '../public/favicon.ico'),
    path.join(__dirname, '../public/pwa-512x512.png'),
    path.join(__dirname, '../dist/favicon.ico'),
    path.join(__dirname, '../dist/pwa-512x512.png'),
  ];

  if (process.platform !== 'win32') {
    // On non-Windows, prioritize PNG over ICO
    candidates.sort((a, b) => (b.endsWith('.png') ? 1 : 0) - (a.endsWith('.png') ? 1 : 0));
  }

  for (const candidatePath of candidates) {
    try {
      if (fs.existsSync(candidatePath)) {
        const iconImg = nativeImage.createFromPath(candidatePath);
        if (!iconImg.isEmpty()) {
          return iconImg;
        }
      }
    } catch {
      // Continue to next candidate
    }
  }
  return null;
}

function createWindow() {
  const appIcon = getAppIcon();

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: 'Liime Words - Dedicated to Studio Writers',
    icon: appIcon || undefined,
    backgroundColor: '#0c1610',
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
      webSecurity: true,
    },
  });

  if (appIcon && !appIcon.isEmpty()) {
    mainWindow.setIcon(appIcon);
  }

  // Show window smoothly once rendered to prevent blank flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Route external web links (e.g. docs, help) to user's default desktop browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Prevent navigation outside local files
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const isDevUrl = process.env.VITE_DEV_SERVER_URL && navigationUrl.startsWith(process.env.VITE_DEV_SERVER_URL);
    const isLocalFile = navigationUrl.startsWith('file://');
    if (!isDevUrl && !isLocalFile) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  // Load dev server or production dist files
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  const distIndexPath = path.join(__dirname, '../dist/index.html');
  const fs = require('fs');

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else if (fs.existsSync(distIndexPath)) {
    mainWindow.loadFile(distIndexPath);
  } else {
    // If running in development without dist built, connect to local dev server or load dist
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      mainWindow.loadFile(distIndexPath);
    });
  }

  createAppMenu();
}

function createAppMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac
      ? [
          {
            label: 'Liime Words',
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: isMac ? 'Cmd+Q' : 'Alt+F4',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        {
          role: 'toggleDevTools',
          visible: Boolean(process.env.VITE_DEV_SERVER_URL || !app.isPackaged),
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front' }]
          : [{ role: 'close' }]),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Liime Words',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(`
                console.log("Liime Words - Dedicated to Studio Writers by LIIME");
              `);
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
