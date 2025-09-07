#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 CaptnReverse Watch Mode Started');
console.log('📡 Server running on: http://localhost:3000');
console.log('👁️  Watching for file changes...\n');

const watchedFiles = ['index.html'];
const fileStats = new Map();

// Initialize file stats
watchedFiles.forEach(file => {
    try {
        const stat = fs.statSync(file);
        fileStats.set(file, stat.mtime);
        console.log(`📋 Watching: ${file}`);
    } catch (error) {
        console.log(`❌ File not found: ${file}`);
    }
});

// Check for changes every 1 second
setInterval(() => {
    watchedFiles.forEach(file => {
        try {
            const stat = fs.statSync(file);
            const lastModified = fileStats.get(file);
            
            if (lastModified && stat.mtime > lastModified) {
                console.log(`🔄 ${new Date().toLocaleTimeString()} - File changed: ${file}`);
                console.log('🚀 Refresh your browser to see changes');
                fileStats.set(file, stat.mtime);
            }
        } catch (error) {
            // File might be temporarily unavailable during writes
        }
    });
}, 1000);

console.log('💡 Tips:');
console.log('   - Open http://localhost:3000 in your browser');
console.log('   - Grant camera permission for full functionality');
console.log('   - Use Chrome/Edge for best Web API support');
console.log('   - Press Ctrl+C to stop watch mode\n');