/**
 * Discord Rich Presence Integration
 * Shows OCR activity and gaming status in Discord
 */

import { AppState } from './config.js';
import { getPerformanceMetrics } from './performance.js';
import { getHistoryStatistics } from './history.js';

// Discord RPC state
let discordState = {
    enabled: false,
    lastUpdate: 0,
    updateInterval: 15000, // Update every 15 seconds
    activityTimer: null,
    startTimestamp: Date.now()
};

// Discord application ID (would need to be registered)
const DISCORD_CLIENT_ID = '1234567890123456789'; // Placeholder - would need real Discord app

// Initialize Discord Rich Presence
export function initDiscordRPC() {
    console.log('🎮 Initializing Discord Rich Presence...');

    // Check if we're in Electron app with Discord RPC support
    if (window.electronAPI && window.electronAPI.platform === 'electron') {
        console.log('✅ Electron environment detected for Discord RPC');
        discordState.enabled = true;
        startDiscordActivity();
    } else {
        // Web version - use Discord SDK if available
        console.log('🌐 Web environment - Discord RPC limited to web SDK');
        initWebDiscordSDK();
    }
}

// Initialize web-based Discord SDK (limited functionality)
async function initWebDiscordSDK() {
    try {
        // Check if Discord is running and supports web SDK
        if (typeof DiscordSDK !== 'undefined') {
            console.log('✅ Discord Web SDK available');
            discordState.enabled = true;
            startDiscordActivity();
        } else {
            console.log('⚠️ Discord Web SDK not available');
            // Show user how to enable Discord integration
            showDiscordIntegrationInfo();
        }
    } catch (error) {
        console.warn('Discord SDK initialization failed:', error);
    }
}

// Start Discord activity updates
function startDiscordActivity() {
    if (!discordState.enabled) return;

    // Update immediately
    updateDiscordActivity();

    // Set up periodic updates
    discordState.activityTimer = setInterval(() => {
        updateDiscordActivity();
    }, discordState.updateInterval);

    console.log('🎮 Discord Rich Presence activity started');
}

// Update Discord activity status
async function updateDiscordActivity() {
    if (!discordState.enabled) return;

    try {
        const performanceMetrics = getPerformanceMetrics();
        const historyStats = getHistoryStatistics();

        // Determine current activity
        let state = 'Ready for gaming';
        let details = 'Gaming OCR Companion';
        let largeImageKey = 'captn-reverse-logo';
        let largeImageText = 'CaptnReverse Gaming Companion';
        let smallImageKey = null;
        let smallImageText = null;

        // Update based on current activity
        if (AppState.isMonitoring) {
            state = 'Monitoring game text';
            details = `${historyStats.currentSessionEntries} texts recognized`;
            smallImageKey = 'monitoring-active';
            smallImageText = 'Monitoring Active';
        } else if (AppState.lastText) {
            state = 'Last text recognized';
            details = AppState.lastText.substring(0, 50) + (AppState.lastText.length > 50 ? '...' : '');
        }

        // Performance-based status
        const perfLevel = performanceMetrics.performanceLevel;
        if (perfLevel === 'Excellent') {
            smallImageKey = 'performance-excellent';
            smallImageText = 'Excellent Performance';
        } else if (perfLevel === 'Poor') {
            smallImageKey = 'performance-poor';
            smallImageText = 'Performance Issues';
        }

        const activity = {
            details: details,
            state: state,
            startTimestamp: discordState.startTimestamp,
            largeImageKey: largeImageKey,
            largeImageText: largeImageText,
            smallImageKey: smallImageKey,
            smallImageText: smallImageText,
            instance: false,
            buttons: [
                {
                    label: 'Get CaptnReverse',
                    url: 'https://github.com/captnreverse/gaming-companion'
                }
            ]
        };

        // Add gaming session info
        if (historyStats.currentSessionEntries > 0) {
            activity.partyId = 'gaming-session';
            activity.partySize = historyStats.currentSessionEntries;
            activity.partyMax = 500; // Max history entries
        }

        // Update Discord activity
        await setDiscordActivity(activity);

        discordState.lastUpdate = Date.now();
        console.log(`🎮 Discord activity updated: ${details} - ${state}`);

    } catch (error) {
        console.warn('Discord activity update failed:', error);
    }
}

// Set Discord activity (platform-specific implementation)
async function setDiscordActivity(activity) {
    if (window.electronAPI) {
        // Electron implementation
        try {
            await window.electronAPI.setDiscordActivity(activity);
        } catch (error) {
            console.warn('Electron Discord RPC failed:', error);
        }
    } else if (typeof DiscordSDK !== 'undefined') {
        // Web SDK implementation
        try {
            await DiscordSDK.Commands.SET_ACTIVITY({
                pid: Math.floor(Math.random() * 10000),
                activity: activity
            });
        } catch (error) {
            console.warn('Discord Web SDK failed:', error);
        }
    } else {
        // Fallback: Log activity for debugging
        console.log('🎮 Discord Activity (simulated):', activity);
    }
}

// Show Discord integration information to user
function showDiscordIntegrationInfo() {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 left-4 gaming-panel p-4 rounded-xl z-40 max-w-sm';
    notification.innerHTML = `
        <div class="space-y-3">
            <div class="flex items-center gap-2">
                <span class="text-gaming-purple text-lg">🎮</span>
                <span class="font-medium text-white">Discord Integration</span>
            </div>
            <p class="text-xs text-dark-300">
                Show your OCR activity in Discord status!
            </p>
            <div class="space-y-2 text-xs">
                <div class="flex items-center gap-2">
                    <span class="text-gaming-green">✅</span>
                    <span>Desktop app: Full Rich Presence</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-gaming-yellow">⚠️</span>
                    <span>Web version: Limited support</span>
                </div>
            </div>
            <button onclick="enableDiscordRPC()" class="w-full btn-primary py-2 text-sm rounded-lg">
                Enable Discord Status
            </button>
            <button onclick="this.closest('.fixed').remove()" class="w-full bg-dark-600 hover:bg-dark-500 py-2 text-sm rounded-lg">
                Maybe Later
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 20 seconds
    setTimeout(() => {
        notification.remove();
    }, 20000);
}

// Enable Discord RPC
function enableDiscordRPC() {
    console.log('🎮 Enabling Discord Rich Presence...');

    discordState.enabled = true;
    localStorage.setItem('discordRPCEnabled', 'true');

    // Remove notification
    document.querySelectorAll('.fixed.bottom-4.left-4').forEach(el => el.remove());

    // Start activity if not already started
    if (!discordState.activityTimer) {
        startDiscordActivity();
    }

    // Show success notification
    const successNotification = document.createElement('div');
    successNotification.className = 'fixed bottom-4 left-4 bg-gaming-green rounded-lg p-3 z-40';
    successNotification.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-lg">✅</span>
            <span class="font-medium text-black">Discord integration enabled!</span>
        </div>
    `;

    document.body.appendChild(successNotification);

    setTimeout(() => {
        successNotification.remove();
    }, 3000);
}

// Update Discord with OCR events
export function updateDiscordWithOCR(text, confidence) {
    if (!discordState.enabled) return;

    // Immediate update for significant OCR events
    const now = Date.now();
    if (now - discordState.lastUpdate > 5000) { // Don't spam updates
        updateDiscordActivity();
    }
}

// Get Discord RPC status
export function getDiscordRPCStatus() {
    return {
        enabled: discordState.enabled,
        lastUpdate: discordState.lastUpdate,
        updateInterval: discordState.updateInterval,
        platform: window.electronAPI ? 'electron' : 'web',
        hasSDK: typeof DiscordSDK !== 'undefined'
    };
}

// Disable Discord RPC
export function disableDiscordRPC() {
    discordState.enabled = false;

    if (discordState.activityTimer) {
        clearInterval(discordState.activityTimer);
        discordState.activityTimer = null;
    }

    localStorage.setItem('discordRPCEnabled', 'false');
    console.log('🎮 Discord Rich Presence disabled');
}

// Load Discord preferences
function loadDiscordPreferences() {
    const enabled = localStorage.getItem('discordRPCEnabled') === 'true';
    if (enabled) {
        // Delay enabling to allow app to fully initialize
        setTimeout(() => {
            enableDiscordRPC();
        }, 3000);
    }
}

// Cleanup Discord RPC
export function cleanupDiscordRPC() {
    disableDiscordRPC();

    // Clear Discord activity
    if (window.electronAPI) {
        window.electronAPI.clearDiscordActivity?.();
    }

    console.log('🎮 Discord RPC cleaned up');
}

// Auto-load preferences when module loads
setTimeout(() => {
    if (document.readyState === 'complete') {
        loadDiscordPreferences();
    }
}, 4000);

// Make functions globally accessible
window.enableDiscordRPC = enableDiscordRPC;

export { initDiscordRPC, updateDiscordWithOCR, getDiscordRPCStatus, disableDiscordRPC, cleanupDiscordRPC };