/**
 * Debug Module - Handles debug console, logging, and development tools
 * Manages debug canvas, console capture, and troubleshooting utilities
 */

import { AppState, CONFIG } from './config.js';

// Debug console state
let debugConsole = null;
let debugLogs = [];
let originalConsole = {};

// Initialize debug logging with console capture
export function initializeDebugLogging() {
    // Store original console methods
    originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info
    };
    
    // Override console methods to capture logs
    ['log', 'warn', 'error', 'info'].forEach(method => {
        console[method] = function(...args) {
            // Call original method first
            originalConsole[method].apply(console, args);
            
            // Capture for debug console
            debugLogs.push({
                type: method,
                timestamp: new Date().toISOString(),
                message: args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ')
            });
            
            if (debugLogs.length > CONFIG.DEBUG_LOG_LIMIT) {
                debugLogs.shift(); // Keep last 200 logs
            }
            updateDebugDisplay(); // Update if debug console is open
        };
    });
    
    console.log('🔍 Debug logging initialized - all console output will be captured');
}

// Toggle debug console visibility
export function toggleDebugConsole() {
    if (debugConsole && !debugConsole.closed) {
        const existingConsole = document.getElementById('debug-console');
        if (existingConsole) {
            existingConsole.remove();
        }
        debugConsole = null;
        return;
    }
    
    createDebugConsole();
}

// Create debug console UI
export function createDebugConsole() {
    // Remove any existing debug console
    const existing = document.getElementById('debug-console');
    if (existing) existing.remove();
    
    // Create floating debug console
    const consoleDiv = document.createElement('div');
    consoleDiv.id = 'debug-console';
    consoleDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80vw;
        max-width: 600px;
        height: 70vh;
        background: rgba(15, 23, 42, 0.95);
        border: 2px solid #0ea5e9;
        border-radius: 12px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        font-family: 'JetBrains Mono', monospace;
        backdrop-filter: blur(12px);
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 12px 16px;
        background: #0ea5e9;
        color: white;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 10px 10px 0 0;
    `;
    header.innerHTML = `
        <span>🔍 CaptnReverse Debug Console (${debugLogs.length} logs)</span>
        <button id="close-debug" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">✖️</button>
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        background: #0f172a;
        color: #e2e8f0;
        font-size: 12px;
        line-height: 1.4;
    `;
    content.classList.add('debug-console-content');
    
    const controls = document.createElement('div');
    controls.style.cssText = `
        padding: 12px 16px;
        background: #1e293b;
        border-top: 1px solid #334155;
        display: flex;
        gap: 8px;
        border-radius: 0 0 10px 10px;
    `;
    controls.innerHTML = `
        <button id="clear-debug" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px;">Clear</button>
        <button id="export-debug" style="padding: 6px 12px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px;">Export</button>
        <button id="test-settings" style="padding: 6px 12px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px;">Test Settings</button>
    `;
    
    consoleDiv.appendChild(header);
    consoleDiv.appendChild(content);
    consoleDiv.appendChild(controls);
    document.body.appendChild(consoleDiv);
    
    // Add event listeners
    document.getElementById('close-debug').addEventListener('click', () => {
        consoleDiv.remove();
        debugConsole = null;
    });
    
    document.getElementById('clear-debug').addEventListener('click', () => {
        debugLogs = [];
        updateDebugDisplay();
    });
    
    document.getElementById('export-debug').addEventListener('click', () => {
        const data = JSON.stringify({
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            logs: debugLogs,
            settings: AppState.settings,
            appState: {
                isMonitoring: AppState.isMonitoring,
                currentOCREngine: AppState.currentOCREngine,
                paddleOCRLoaded: AppState.paddleOCRLoaded,
                voicesLoaded: AppState.voicesLoaded
            }
        }, null, 2);
        
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `captn-debug-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
    
    document.getElementById('test-settings').addEventListener('click', () => {
        testSettingsButton();
    });
    
    debugConsole = { closed: false };
    
    // Initial display of existing logs
    updateDebugDisplay();
}

// Update debug console display
export function updateDebugDisplay() {
    const content = document.querySelector('#debug-console > div:nth-child(2)');
    if (!content) return; // Debug console not open
    
    // Security: Use createElement instead of innerHTML to prevent XSS
    content.innerHTML = ''; // Clear existing content
    
    debugLogs.forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.style.cssText = `
            margin-bottom: 4px; 
            padding: 4px; 
            background: ${
                log.type === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                log.type === 'warn' ? 'rgba(245, 158, 11, 0.1)' :
                log.type === 'info' ? 'rgba(59, 130, 246, 0.1)' :
                'rgba(16, 185, 129, 0.1)'
            }; 
            border-left: 3px solid ${
                log.type === 'error' ? '#ef4444' :
                log.type === 'warn' ? '#f59e0b' :
                log.type === 'info' ? '#3b82f6' :
                '#10b981'
            }; 
            border-radius: 4px;
        `;
        
        // Create timestamp span
        const timestampSpan = document.createElement('span');
        timestampSpan.style.cssText = 'color: #64748b; font-size: 10px;';
        timestampSpan.textContent = `[${log.timestamp.split('T')[1].split('.')[0]}]`;
        
        // Create type span  
        const typeSpan = document.createElement('span');
        typeSpan.style.cssText = `
            color: ${
                log.type === 'error' ? '#ef4444' :
                log.type === 'warn' ? '#f59e0b' :
                log.type === 'info' ? '#3b82f6' :
                '#10b981'
            }; 
            font-weight: bold; 
            margin: 0 8px;
        `;
        typeSpan.textContent = log.type.toUpperCase();
        
        // Create message span
        const messageSpan = document.createElement('span');
        messageSpan.style.cssText = 'color: #e2e8f0;';
        messageSpan.textContent = log.message; // Safe: textContent auto-escapes
        
        // Assemble log entry
        logEntry.appendChild(timestampSpan);
        logEntry.appendChild(typeSpan);
        logEntry.appendChild(messageSpan);
        content.appendChild(logEntry);
    });
    
    content.scrollTop = content.scrollHeight;
}

// Render debug canvas showing OCR input
export function renderDebugCanvas(canvas) {
    // Remove any existing debug elements
    const existingCanvas = document.getElementById('debug-canvas');
    const existingLabel = document.getElementById('debug-label');
    const existingText = document.getElementById('debug-text');
    if (existingCanvas) existingCanvas.remove();
    if (existingLabel) existingLabel.remove();
    if (existingText) existingText.remove();
    
    // Create debug display - this should show ONLY the cropped area
    const debugCanvas = document.createElement('canvas');
    const debugCtx = debugCanvas.getContext('2d');
    
    // Copy the processed canvas exactly as it will be sent to OCR
    debugCanvas.width = canvas.width;
    debugCanvas.height = canvas.height;
    debugCtx.drawImage(canvas, 0, 0);
    
    debugCanvas.id = 'debug-canvas';
    debugCanvas.className = 'debug-canvas';
    debugCanvas.style.position = 'fixed';
    debugCanvas.style.top = '80px';
    debugCanvas.style.right = '10px';
    
    // Dynamic sizing based on user preference
    if (AppState.settings.debugViewSizing === 'autoWidth') {
        // Auto height mode: Fixed width, height adjusts to preserve aspect ratio
        debugCanvas.style.width = '200px';
        debugCanvas.style.height = 'auto';
        debugCanvas.style.maxHeight = 'none';
    } else {
        // Constrained mode: Fit within fixed box while maintaining aspect ratio
        const aspectRatio = canvas.width / canvas.height;
        const maxWidth = 200;
        const maxHeight = 150;
        
        let displayWidth, displayHeight;
        if (aspectRatio > maxWidth / maxHeight) {
            // Width-limited
            displayWidth = maxWidth;
            displayHeight = maxWidth / aspectRatio;
        } else {
            // Height-limited
            displayHeight = maxHeight;
            displayWidth = maxHeight * aspectRatio;
        }
        
        debugCanvas.style.width = `${displayWidth}px`;
        debugCanvas.style.height = `${displayHeight}px`;
    }
    debugCanvas.style.border = '2px solid #0ea5e9';
    debugCanvas.style.borderRadius = '8px';
    debugCanvas.style.zIndex = '9999';
    debugCanvas.style.background = 'white';
    debugCanvas.style.imageRendering = 'pixelated'; // Show crisp pixels
    
    document.body.appendChild(debugCanvas);
    
    // Add label
    const label = document.createElement('div');
    label.id = 'debug-label';
    label.textContent = `Debug: OCR Input (${canvas.width}×${canvas.height}px)`;
    label.style.position = 'fixed';
    label.style.top = '60px';
    label.style.right = '10px';
    label.style.color = '#0ea5e9';
    label.style.fontSize = '12px';
    label.style.fontWeight = 'bold';
    label.style.zIndex = '9999';
    label.style.textShadow = '0 0 4px black';
    document.body.appendChild(label);
    
    // Add text display area for debug
    const textDisplay = document.createElement('div');
    textDisplay.id = 'debug-text';
    textDisplay.style.position = 'fixed';
    textDisplay.style.top = '250px';
    textDisplay.style.right = '10px';
    textDisplay.style.maxWidth = '200px';
    textDisplay.style.background = 'rgba(15, 23, 42, 0.9)';
    textDisplay.style.color = '#0ea5e9';
    textDisplay.style.padding = '8px';
    textDisplay.style.borderRadius = '8px';
    textDisplay.style.fontSize = '11px';
    textDisplay.style.border = '1px solid #0ea5e9';
    textDisplay.style.zIndex = '9999';
    textDisplay.textContent = 'Waiting for OCR result...';
    document.body.appendChild(textDisplay);
    
    console.log(`🔍 Debug canvas: ${canvas.width}×${canvas.height}px - this exact image goes to OCR`);
}

// Update debug text display
export function updateDebugText(text, confidence) {
    const debugText = document.getElementById('debug-text');
    if (debugText) {
        debugText.innerHTML = `
            <strong>OCR Result:</strong><br>
            "${text}"<br>
            <small>Confidence: ${Math.round(confidence)}%</small>
        `;
    }
}

// Test settings button functionality
export function testSettingsButton() {
    console.log('🧪 Testing settings button functionality...');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    
    console.log('Settings button element:', settingsBtn);
    console.log('Settings modal element:', settingsModal);
    
    if (settingsBtn) {
        console.log('✅ Settings button found');
        console.log('Button styles:', getComputedStyle(settingsBtn).display);
        console.log('Button visibility:', settingsBtn.offsetParent !== null);
        
        // Try triggering click programmatically
        console.log('🖱️ Triggering click event...');
        settingsBtn.click();
        
        setTimeout(() => {
            const isVisible = settingsModal && !settingsModal.classList.contains('hidden');
            console.log('Modal visible after click:', isVisible);
        }, 100);
    } else {
        console.error('❌ Settings button not found');
    }
    
    if (settingsModal) {
        console.log('✅ Settings modal found');
        console.log('Modal classes:', settingsModal.className);
        console.log('Modal styles:', getComputedStyle(settingsModal).display);
    } else {
        console.error('❌ Settings modal not found');
    }
}