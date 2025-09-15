/**
 * OCR History System
 * Manages recognized text history with search functionality for gaming sessions
 */

import { AppState } from './config.js';
import { speak } from './speech.js';

// History configuration
const HISTORY_CONFIG = {
    maxEntries: 500, // Maximum history entries to keep
    autoSave: true,
    searchMinLength: 2,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    exportFormats: ['txt', 'json', 'csv']
};

// History state management
let historyState = {
    entries: [],
    currentSession: null,
    searchResults: [],
    isSearchActive: false,
    lastSearch: ''
};

// Initialize history system
export function initHistorySystem() {
    console.log('📚 Initializing OCR History System...');

    // Load existing history
    loadHistoryFromStorage();

    // Start new gaming session
    startNewSession();

    // Create history UI panel
    createHistoryPanel();

    // Setup periodic autosave
    if (HISTORY_CONFIG.autoSave) {
        setInterval(saveHistoryToStorage, 10000); // Save every 10 seconds
    }

    console.log('✅ OCR History System initialized');
    console.log(`📊 Loaded ${historyState.entries.length} previous entries`);
}

// Add new OCR result to history
export function addToHistory(text, confidence, timestamp = Date.now(), metadata = {}) {
    if (!text || text.trim().length === 0) return;

    const entry = {
        id: generateEntryId(),
        text: text.trim(),
        confidence: Math.round(confidence),
        timestamp,
        sessionId: historyState.currentSession?.id,
        metadata: {
            ocrEngine: AppState.currentOCREngine || 'tesseract',
            processingTime: metadata.processingTime || 0,
            cropArea: metadata.cropArea || { ...AppState.currentCrop },
            settings: {
                sensitivity: AppState.settings.sensitivity,
                imageThreshold: AppState.settings.imageThreshold
            },
            ...metadata
        }
    };

    // Add to history
    historyState.entries.unshift(entry); // Add to beginning for recent-first

    // Maintain max entries limit
    if (historyState.entries.length > HISTORY_CONFIG.maxEntries) {
        historyState.entries = historyState.entries.slice(0, HISTORY_CONFIG.maxEntries);
    }

    // Update current session
    if (historyState.currentSession) {
        historyState.currentSession.entryCount++;
        historyState.currentSession.lastActivity = timestamp;
    }

    console.log(`📝 Added to history: "${text.substring(0, 50)}..." (confidence: ${confidence}%)`);

    // Update UI if history panel is visible
    updateHistoryUI();

    // Auto-save if enabled
    if (HISTORY_CONFIG.autoSave) {
        saveHistoryToStorage();
    }

    return entry;
}

// Search through history
export function searchHistory(query, options = {}) {
    if (!query || query.length < HISTORY_CONFIG.searchMinLength) {
        historyState.searchResults = [];
        historyState.isSearchActive = false;
        return [];
    }

    const {
        caseSensitive = false,
        exactMatch = false,
        minConfidence = 0,
        sessionId = null,
        dateRange = null
    } = options;

    const searchTerm = caseSensitive ? query : query.toLowerCase();
    historyState.lastSearch = query;
    historyState.isSearchActive = true;

    historyState.searchResults = historyState.entries.filter(entry => {
        // Text matching
        const entryText = caseSensitive ? entry.text : entry.text.toLowerCase();
        const textMatch = exactMatch
            ? entryText === searchTerm
            : entryText.includes(searchTerm);

        if (!textMatch) return false;

        // Confidence filter
        if (entry.confidence < minConfidence) return false;

        // Session filter
        if (sessionId && entry.sessionId !== sessionId) return false;

        // Date range filter
        if (dateRange) {
            const entryDate = new Date(entry.timestamp);
            if (dateRange.start && entryDate < dateRange.start) return false;
            if (dateRange.end && entryDate > dateRange.end) return false;
        }

        return true;
    });

    console.log(`🔍 Search "${query}" found ${historyState.searchResults.length} results`);
    updateHistoryUI();

    return historyState.searchResults;
}

// Start new gaming session
function startNewSession() {
    historyState.currentSession = {
        id: generateSessionId(),
        startTime: Date.now(),
        lastActivity: Date.now(),
        entryCount: 0,
        type: 'gaming',
        name: `Gaming Session ${new Date().toLocaleString()}`
    };

    console.log(`🎮 Started new gaming session: ${historyState.currentSession.id}`);
}

// Generate unique entry ID
function generateEntryId() {
    return `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate unique session ID
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

// Create history UI panel
function createHistoryPanel() {
    const historyPanel = document.createElement('div');
    historyPanel.id = 'history-panel';
    historyPanel.className = 'fixed top-20 left-4 bottom-4 w-80 gaming-panel rounded-2xl p-4 hidden z-30 overflow-hidden';

    historyPanel.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gaming-cyan">📚 OCR History</h3>
            <button onclick="toggleHistoryPanel()" class="text-dark-400 hover:text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>

        <!-- Search -->
        <div class="mb-4">
            <input id="history-search" type="text" placeholder="Search history..."
                   class="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm">
            <div class="flex gap-2 mt-2">
                <button id="clear-search" class="text-xs bg-dark-600 hover:bg-dark-500 px-2 py-1 rounded">Clear</button>
                <button id="export-history" class="text-xs bg-primary-600 hover:bg-primary-700 px-2 py-1 rounded">Export</button>
                <span id="search-count" class="text-xs text-dark-400"></span>
            </div>
        </div>

        <!-- History List -->
        <div id="history-list" class="flex-1 overflow-y-auto space-y-2 max-h-[calc(100vh-200px)]">
            <!-- History entries will be populated here -->
        </div>

        <!-- Quick Actions -->
        <div class="mt-4 pt-4 border-t border-dark-700">
            <div class="grid grid-cols-2 gap-2 text-xs">
                <button id="clear-history" class="bg-red-600 hover:bg-red-700 px-3 py-2 rounded">Clear All</button>
                <button id="session-stats" class="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded">Session Stats</button>
            </div>
        </div>
    `;

    document.body.appendChild(historyPanel);

    // Setup event listeners
    setupHistoryEventListeners();
}

// Setup history panel event listeners
function setupHistoryEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('history-search');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (query.length >= HISTORY_CONFIG.searchMinLength) {
            searchHistory(query);
        } else {
            clearSearch();
        }
    });

    // Clear search
    document.getElementById('clear-search').addEventListener('click', () => {
        clearSearch();
        searchInput.value = '';
    });

    // Export history
    document.getElementById('export-history').addEventListener('click', () => {
        exportHistory('txt');
    });

    // Clear all history
    document.getElementById('clear-history').addEventListener('click', () => {
        if (confirm('Clear all OCR history? This cannot be undone.')) {
            clearAllHistory();
        }
    });

    // Session statistics
    document.getElementById('session-stats').addEventListener('click', () => {
        showSessionStatistics();
    });
}

// Update history UI display
function updateHistoryUI() {
    const historyList = document.getElementById('history-list');
    const searchCount = document.getElementById('search-count');

    if (!historyList) return;

    const entriesToShow = historyState.isSearchActive
        ? historyState.searchResults
        : historyState.entries.slice(0, 50); // Show last 50 entries

    // Update search count
    if (searchCount) {
        if (historyState.isSearchActive) {
            searchCount.textContent = `${historyState.searchResults.length} results`;
        } else {
            searchCount.textContent = `${historyState.entries.length} total`;
        }
    }

    // Render entries
    historyList.innerHTML = entriesToShow.map(entry => `
        <div class="bg-dark-800 rounded-lg p-3 text-sm hover:bg-dark-700 transition-colors cursor-pointer"
             onclick="selectHistoryEntry('${entry.id}')">
            <div class="flex items-start justify-between mb-1">
                <span class="text-white font-medium line-clamp-2">"${entry.text}"</span>
                <span class="text-gaming-green font-mono text-xs ml-2">${entry.confidence}%</span>
            </div>
            <div class="flex items-center justify-between text-xs text-dark-400">
                <span>${new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span class="text-gaming-blue">${entry.metadata.ocrEngine}</span>
            </div>
        </div>
    `).join('');
}

// Select and speak history entry
function selectHistoryEntry(entryId) {
    const entry = historyState.entries.find(e => e.id === entryId);
    if (entry) {
        speak(entry.text);
        console.log(`🔊 Speaking history entry: "${entry.text}"`);

        // Visual feedback
        const entryElement = document.querySelector(`[onclick="selectHistoryEntry('${entryId}')"]`);
        if (entryElement) {
            entryElement.classList.add('bg-primary-600');
            setTimeout(() => {
                entryElement.classList.remove('bg-primary-600');
            }, 1000);
        }
    }
}

// Clear search results
function clearSearch() {
    historyState.searchResults = [];
    historyState.isSearchActive = false;
    historyState.lastSearch = '';
    updateHistoryUI();
}

// Clear all history
function clearAllHistory() {
    historyState.entries = [];
    historyState.searchResults = [];
    historyState.isSearchActive = false;
    saveHistoryToStorage();
    updateHistoryUI();
    console.log('🗑️ All OCR history cleared');
}

// Export history in various formats
export function exportHistory(format = 'txt') {
    const entriesToExport = historyState.isSearchActive
        ? historyState.searchResults
        : historyState.entries;

    if (entriesToExport.length === 0) {
        console.warn('No history entries to export');
        return;
    }

    let content = '';
    let filename = `ocr-history-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;

    switch (format) {
        case 'txt':
            content = entriesToExport.map(entry =>
                `[${new Date(entry.timestamp).toLocaleString()}] (${entry.confidence}%): ${entry.text}`
            ).join('\n');
            filename += '.txt';
            break;

        case 'json':
            content = JSON.stringify({
                exportDate: new Date().toISOString(),
                session: historyState.currentSession,
                entries: entriesToExport
            }, null, 2);
            filename += '.json';
            break;

        case 'csv':
            content = 'Timestamp,Text,Confidence,Engine,Processing Time\n' +
                entriesToExport.map(entry =>
                    `"${new Date(entry.timestamp).toISOString()}","${entry.text.replace(/"/g, '""')}",${entry.confidence},${entry.metadata.ocrEngine},${entry.metadata.processingTime || 0}`
                ).join('\n');
            filename += '.csv';
            break;
    }

    // Create download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    console.log(`📁 Exported ${entriesToExport.length} entries as ${format.toUpperCase()}`);
}

// Show session statistics
function showSessionStatistics() {
    if (!historyState.currentSession) return;

    const sessionEntries = historyState.entries.filter(e => e.sessionId === historyState.currentSession.id);
    const avgConfidence = sessionEntries.length > 0
        ? sessionEntries.reduce((sum, e) => sum + e.confidence, 0) / sessionEntries.length
        : 0;

    const sessionDuration = Date.now() - historyState.currentSession.startTime;
    const durationMinutes = sessionDuration / 60000;

    const stats = {
        sessionName: historyState.currentSession.name,
        duration: `${durationMinutes.toFixed(1)} minutes`,
        entriesCount: sessionEntries.length,
        averageConfidence: `${avgConfidence.toFixed(1)}%`,
        entriesPerMinute: durationMinutes > 0 ? (sessionEntries.length / durationMinutes).toFixed(1) : '0',
        topText: sessionEntries.length > 0 ? sessionEntries[0].text : 'None'
    };

    // Display stats in gaming-style overlay
    const statsOverlay = document.createElement('div');
    statsOverlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    statsOverlay.innerHTML = `
        <div class="gaming-panel max-w-lg w-full mx-4 p-6 rounded-2xl">
            <h2 class="text-xl font-bold text-gaming-purple mb-4 text-center">🎮 Session Statistics</h2>
            <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                    <span class="text-dark-300">Session:</span>
                    <span class="text-gaming-cyan font-mono">${stats.sessionName}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-dark-300">Duration:</span>
                    <span class="text-gaming-green font-mono">${stats.duration}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-dark-300">Text Entries:</span>
                    <span class="text-gaming-blue font-mono">${stats.entriesCount}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-dark-300">Avg Confidence:</span>
                    <span class="text-gaming-yellow font-mono">${stats.averageConfidence}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-dark-300">Entries/Min:</span>
                    <span class="text-gaming-purple font-mono">${stats.entriesPerMinute}</span>
                </div>
            </div>
            <div class="mt-6 text-center">
                <button onclick="this.closest('.fixed').remove()" class="btn-primary px-6 py-2 rounded-lg">
                    Close
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(statsOverlay);

    // Auto-close after 15 seconds
    setTimeout(() => {
        statsOverlay.remove();
    }, 15000);
}

// Toggle history panel visibility
export function toggleHistoryPanel() {
    const panel = document.getElementById('history-panel');
    const isVisible = !panel.classList.contains('hidden');

    if (isVisible) {
        panel.classList.add('hidden');
        console.log('📚 History panel hidden');
    } else {
        panel.classList.remove('hidden');
        updateHistoryUI();
        console.log('📚 History panel shown');
    }
}

// Load history from localStorage
function loadHistoryFromStorage() {
    try {
        const saved = localStorage.getItem('ocrHistory');
        if (saved) {
            const data = JSON.parse(saved);
            historyState.entries = data.entries || [];

            // Clean up old entries (older than 7 days)
            const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            historyState.entries = historyState.entries.filter(entry => entry.timestamp > weekAgo);

            console.log(`📚 Loaded ${historyState.entries.length} history entries`);
        }
    } catch (error) {
        console.warn('Could not load history from storage:', error);
        historyState.entries = [];
    }
}

// Save history to localStorage
function saveHistoryToStorage() {
    try {
        const dataToSave = {
            version: '1.0',
            lastSaved: Date.now(),
            currentSession: historyState.currentSession,
            entries: historyState.entries
        };

        localStorage.setItem('ocrHistory', JSON.stringify(dataToSave));
    } catch (error) {
        console.warn('Could not save history to storage:', error);
    }
}

// Get history statistics
export function getHistoryStatistics() {
    const total = historyState.entries.length;
    const currentSessionEntries = historyState.entries.filter(e =>
        e.sessionId === historyState.currentSession?.id
    );

    const avgConfidence = total > 0
        ? historyState.entries.reduce((sum, e) => sum + e.confidence, 0) / total
        : 0;

    const topEngines = historyState.entries.reduce((acc, entry) => {
        acc[entry.metadata.ocrEngine] = (acc[entry.metadata.ocrEngine] || 0) + 1;
        return acc;
    }, {});

    return {
        totalEntries: total,
        currentSessionEntries: currentSessionEntries.length,
        averageConfidence: avgConfidence.toFixed(1),
        sessionDuration: historyState.currentSession
            ? ((Date.now() - historyState.currentSession.startTime) / 60000).toFixed(1) + ' min'
            : '0 min',
        topOCREngine: Object.keys(topEngines).length > 0
            ? Object.keys(topEngines).reduce((a, b) => topEngines[a] > topEngines[b] ? a : b)
            : 'none',
        searchActive: historyState.isSearchActive,
        lastSearch: historyState.lastSearch
    };
}

// Cleanup history system
export function cleanupHistorySystem() {
    // Save final state
    saveHistoryToStorage();

    // Remove history panel
    const panel = document.getElementById('history-panel');
    if (panel) panel.remove();

    console.log('📚 History system cleaned up');
}

// Make functions globally accessible for onclick handlers
window.toggleHistoryPanel = toggleHistoryPanel;
window.selectHistoryEntry = selectHistoryEntry;