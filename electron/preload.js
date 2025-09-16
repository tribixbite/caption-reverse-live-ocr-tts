/**
 * Electron Preload Script for CaptnReverse Gaming Companion
 * Exposes secure APIs to the renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose gaming-specific APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Display management
    getDisplays: () => ipcRenderer.invoke('get-displays'),
    openSecondaryWindow: (bounds) => ipcRenderer.invoke('open-secondary-window', bounds),

    // Gaming integration
    platform: 'electron',
    isDesktopApp: true,

    // Global shortcut handling
    onGlobalShortcut: (callback) => {
        ipcRenderer.on('global-shortcut', (event, data) => callback(data));
    },

    onMenuAction: (callback) => {
        ipcRenderer.on('menu-action', (event, data) => callback(data));
    },

    // System information
    getSystemInfo: () => ({
        platform: process.platform,
        arch: process.arch,
        version: process.versions
    }),

    // Gaming optimizations
    enableGamingMode: () => ipcRenderer.send('enable-gaming-mode'),
    disableGamingMode: () => ipcRenderer.send('disable-gaming-mode'),

    // Window management
    minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
    showOverlay: () => ipcRenderer.send('show-overlay'),
    hideOverlay: () => ipcRenderer.send('hide-overlay')
});

// Inject gaming companion styles for desktop
document.addEventListener('DOMContentLoaded', () => {
    // Add desktop-specific CSS
    const desktopStyles = document.createElement('style');
    desktopStyles.textContent = `
        /* Desktop gaming companion optimizations */
        body {
            user-select: none; /* Prevent text selection during gaming */
        }

        .gaming-desktop {
            border-radius: 12px;
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
        }

        /* Always on top indicator */
        .always-on-top-indicator {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(59, 130, 246, 0.9);
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 10px;
            z-index: 1000;
        }
    `;
    document.head.appendChild(desktopStyles);

    // Add desktop indicator
    const indicator = document.createElement('div');
    indicator.className = 'always-on-top-indicator';
    indicator.textContent = '🎮 Desktop Gaming Companion';
    document.body.appendChild(indicator);
});

console.log('🎮 CaptnReverse Desktop Gaming Companion preload ready!');