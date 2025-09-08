// Simple DOM test to verify functionality
const fs = require('fs');
const { JSDOM } = require('jsdom');

// Read the HTML file
const html = fs.readFileSync('/data/data/com.termux/files/home/git/captn-reverse-web/index.html', 'utf8');

// Create a DOM
const dom = new JSDOM(html, {
    url: "http://localhost:3000",
    referrer: "http://localhost:3000",
    contentType: "text/html",
    includeNodeLocations: true,
    storageQuota: 10000000,
    pretendToBeVisual: true,
    resources: "usable"
});

const { window } = dom;
global.window = window;
global.document = window.document;
global.navigator = window.navigator;

// Test settings button existence
console.log('🔍 Testing DOM elements...');

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');

console.log('Settings button found:', !!settingsBtn);
console.log('Settings modal found:', !!settingsModal);

if (settingsBtn) {
    console.log('Settings button classes:', settingsBtn.className);
    console.log('Settings button parent:', settingsBtn.parentElement.tagName);
}

if (settingsModal) {
    console.log('Settings modal classes:', settingsModal.className);
    console.log('Modal initially hidden:', settingsModal.classList.contains('hidden'));
}

// Test event listener attachment (simulate)
console.log('✅ DOM structure verification complete');