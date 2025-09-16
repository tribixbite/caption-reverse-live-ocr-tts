/**
 * Electron Main Process for CaptnReverse Gaming Companion
 * Desktop application for professional gaming OCR usage
 */

const { app, BrowserWindow, globalShortcut, ipcMain, screen, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Application state
let mainWindow = null;
let overlayWindow = null;
let isGamingMode = false;

// Create main window
function createMainWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    mainWindow = new BrowserWindow({
        width: Math.min(1200, width),
        height: Math.min(800, height),
        minWidth: 800,
        minHeight: 600,

        // Gaming-optimized window settings
        frame: true,
        titleBarStyle: 'default',
        backgroundColor: '#0f172a',
        show: false, // Show when ready

        // Security settings
        webSecurity: true,
        nodeIntegration: false,
        contextIsolation: true,

        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false, // Required for camera access
            allowRunningInsecureContent: true
        },

        icon: path.join(__dirname, '../icons/icon-256x256.png')
    });

    // Load the web application
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile('../index.html');
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        // Focus and bring to front
        mainWindow.focus();

        console.log('🎮 CaptnReverse Gaming Companion desktop app ready!');
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;

        // Clean up overlay window
        if (overlayWindow) {
            overlayWindow.close();
            overlayWindow = null;
        }
    });

    // Gaming-specific optimizations
    mainWindow.webContents.once('dom-ready', () => {
        // Inject gaming optimizations
        mainWindow.webContents.executeJavaScript(`
            console.log('🎮 Desktop gaming companion mode activated!');

            // Enable desktop-specific features
            if (window.AppState) {
                window.AppState.isDesktopApp = true;
                window.AppState.platform = 'electron';
            }
        `);
    });
}

// Create gaming overlay window
function createGamingOverlay() {
    const displays = screen.getAllDisplays();
    let targetDisplay = displays[0];

    // Use secondary display if available
    if (displays.length > 1) {
        targetDisplay = displays[1];
        console.log('🖥️ Using secondary display for gaming overlay');
    }

    overlayWindow = new BrowserWindow({
        x: targetDisplay.bounds.x,
        y: targetDisplay.bounds.y,
        width: 400,
        height: 300,

        // Overlay-specific settings
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,

        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false // Keep overlay responsive
        }
    });

    overlayWindow.loadFile('../overlay.html');

    overlayWindow.on('closed', () => {
        overlayWindow = null;
    });

    console.log('👻 Gaming overlay window created');
}

// Setup global shortcuts for gaming
function setupGamingShortcuts() {
    // Register global shortcuts that work even when game has focus
    const shortcuts = [
        { key: 'F1', action: 'read-now' },
        { key: 'F2', action: 'toggle-monitoring' },
        { key: 'F3', action: 'auto-calibrate' },
        { key: 'F4', action: 'toggle-history' },
        { key: 'F5', action: 'repeat-last-text' },
        { key: 'F9', action: 'performance-report' },
        { key: 'F12', action: 'show-help' },
        { key: 'CommandOrControl+Shift+O', action: 'toggle-overlay' },
        { key: 'CommandOrControl+Shift+G', action: 'toggle-gaming-mode' }
    ];

    shortcuts.forEach(({ key, action }) => {
        const success = globalShortcut.register(key, () => {
            console.log(`🎮 Global shortcut triggered: ${key} → ${action}`);

            // Send action to renderer process
            if (mainWindow) {
                mainWindow.webContents.send('global-shortcut', { key, action });
            }
        });

        if (success) {
            console.log(`✅ Registered global shortcut: ${key}`);
        } else {
            console.log(`❌ Failed to register shortcut: ${key}`);
        }
    });

    console.log(`🎹 ${shortcuts.length} global gaming shortcuts registered`);
}

// Setup application menu
function setupApplicationMenu() {
    const template = [
        {
            label: 'CaptnReverse',
            submenu: [
                { label: 'About CaptnReverse', role: 'about' },
                { type: 'separator' },
                {
                    label: 'Gaming Mode',
                    type: 'checkbox',
                    checked: isGamingMode,
                    click: () => toggleGamingMode()
                },
                {
                    label: 'Show Gaming Overlay',
                    accelerator: 'CmdOrCtrl+Shift+O',
                    click: () => toggleGamingOverlay()
                },
                { type: 'separator' },
                { label: 'Hide CaptnReverse', accelerator: 'Command+H', role: 'hide' },
                { label: 'Quit', accelerator: 'Command+Q', role: 'quit' }
            ]
        },
        {
            label: 'Gaming',
            submenu: [
                {
                    label: 'Read Text Now',
                    accelerator: 'F1',
                    click: () => sendActionToRenderer('read-now')
                },
                {
                    label: 'Toggle Monitoring',
                    accelerator: 'F2',
                    click: () => sendActionToRenderer('toggle-monitoring')
                },
                {
                    label: 'Auto-Calibrate',
                    accelerator: 'F3',
                    click: () => sendActionToRenderer('auto-calibrate')
                },
                { type: 'separator' },
                {
                    label: 'Show Performance Report',
                    accelerator: 'F9',
                    click: () => sendActionToRenderer('performance-report')
                },
                {
                    label: 'Show Help',
                    accelerator: 'F12',
                    click: () => sendActionToRenderer('show-help')
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
                { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
                { label: 'Toggle Developer Tools', accelerator: 'F11', role: 'toggleDevTools' },
                { type: 'separator' },
                { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
                { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
                { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
                { type: 'separator' },
                { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
                { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Send action to renderer process
function sendActionToRenderer(action) {
    if (mainWindow) {
        mainWindow.webContents.send('menu-action', { action });
    }
}

// Toggle gaming mode
function toggleGamingMode() {
    isGamingMode = !isGamingMode;

    if (isGamingMode) {
        // Gaming mode optimizations
        mainWindow.setAlwaysOnTop(true, 'floating');
        mainWindow.setVisibleOnAllWorkspaces(true);
        console.log('🎮 Gaming mode enabled - window always on top');
    } else {
        mainWindow.setAlwaysOnTop(false);
        mainWindow.setVisibleOnAllWorkspaces(false);
        console.log('🎮 Gaming mode disabled');
    }

    // Update menu
    setupApplicationMenu();
}

// Toggle gaming overlay
function toggleGamingOverlay() {
    if (overlayWindow) {
        overlayWindow.close();
        overlayWindow = null;
        console.log('👻 Gaming overlay closed');
    } else {
        createGamingOverlay();
    }
}

// Handle IPC messages from renderer
ipcMain.handle('get-displays', () => {
    return screen.getAllDisplays().map(display => ({
        id: display.id,
        bounds: display.bounds,
        workArea: display.workArea,
        scaleFactor: display.scaleFactor,
        isPrimary: display === screen.getPrimaryDisplay()
    }));
});

ipcMain.handle('open-secondary-window', (event, bounds) => {
    const secondaryWindow = new BrowserWindow({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width || 800,
        height: bounds.height || 600,

        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    secondaryWindow.loadFile('../secondary-monitor.html');
    return secondaryWindow.id;
});

// App event handlers
app.whenReady().then(() => {
    console.log('🎮 CaptnReverse Gaming Companion starting...');

    createMainWindow();
    setupGamingShortcuts();
    setupApplicationMenu();

    // macOS specific: re-create window when dock icon is clicked
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    // Unregister all global shortcuts
    globalShortcut.unregisterAll();

    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, url) => {
        event.preventDefault();
        console.log('🛡️ Blocked new window creation:', url);
    });
});

// Handle app quit
app.on('before-quit', () => {
    console.log('🎮 CaptnReverse Gaming Companion shutting down...');
    globalShortcut.unregisterAll();
});