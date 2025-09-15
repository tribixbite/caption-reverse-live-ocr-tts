
/**
 * Browser Gaming Features Test Script
 * Run this in the browser console to test all gaming features
 */

async function runBrowserGamingTest() {
    console.log('🎮 Running Browser Gaming Features Test');
    console.log('=====================================');

    const testResults = {
        hotkeySystem: false,
        historySystem: false,
        audioSystem: false,
        performanceMonitoring: false,
        voiceCommands: false,
        multiMonitor: false,
        gamingUI: false
    };

    try {
        // Test 1: Check for gaming modules
        console.log('\n1️⃣ Testing Gaming Module Availability');

        const modules = [
            'js/hotkeys.js',
            'js/history.js',
            'js/multimonitor.js',
            'js/voice-commands.js',
            'js/performance.js'
        ];

        for (const module of modules) {
            try {
                await import('./' + module);
                console.log('   ✅ ' + module + ' loaded successfully');
            } catch (error) {
                console.error('   ❌ ' + module + ' failed to load:', error);
            }
        }

        // Test 2: UI Elements Check
        console.log('\n2️⃣ Testing Gaming UI Elements');

        const uiElements = [
            'auto-calibrate',
            'toggle-history',
            'performance-report',
            'multimonitor-controls',
            'voice-command-panel'
        ];

        uiElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            const exists = element !== null;
            console.log('   ' + (exists ? '✅' : '❌') + ' ' + elementId + ': ' + (exists ? 'Found' : 'Missing'));
        });

        // Test 3: Gaming Theme Check
        console.log('\n3️⃣ Testing Gaming UI Theme');

        const themeClasses = [
            'glass',
            'gaming-glow',
            'btn-primary',
            'text-gaming-glow',
            'animate-float'
        ];

        themeClasses.forEach(className => {
            const hasClass = document.querySelector('.' + className) !== null;
            console.log('   ' + (hasClass ? '✅' : '❌') + ' .' + className + ': ' + (hasClass ? 'Applied' : 'Missing'));
        });

        // Test 4: Hotkey Response (F12 for help)
        console.log('\n4️⃣ Testing Hotkey System');
        console.log('   ⌨️  Press F12 to test hotkey help display...');
        console.log('   ⌨️  Press F1 to test OCR hotkey...');
        console.log('   ⌨️  Press F2 to test monitoring toggle...');

        // Test 5: Audio System
        console.log('\n5️⃣ Testing Audio System');

        if (window.AudioContext || window.webkitAudioContext) {
            console.log('   ✅ Web Audio API: Available');
            testResults.audioSystem = true;
        } else {
            console.log('   ❌ Web Audio API: Not supported');
        }

        if (window.speechSynthesis) {
            console.log('   ✅ Speech Synthesis API: Available');
        } else {
            console.log('   ❌ Speech Synthesis API: Not supported');
        }

        // Test 6: Voice Recognition
        console.log('\n6️⃣ Testing Voice Recognition');

        if (window.SpeechRecognition || window.webkitSpeechRecognition) {
            console.log('   ✅ Speech Recognition API: Available');
            console.log('   🎤 Say "help" to test voice commands');
            testResults.voiceCommands = true;
        } else {
            console.log('   ❌ Speech Recognition API: Not supported');
        }

        // Final validation
        console.log('\n🏆 BROWSER TEST RESULTS:');
        console.log('===============================');
        Object.entries(testResults).forEach(([feature, passed]) => {
            console.log('   ' + (passed ? '✅' : '❌') + ' ' + feature + ': ' + (passed ? 'WORKING' : 'NEEDS ATTENTION'));
        });

        const passedTests = Object.values(testResults).filter(result => result).length;
        const totalTests = Object.keys(testResults).length;

        console.log('\n📊 Overall Success Rate: ' + (passedTests / totalTests * 100).toFixed(1) + '%');

        if (passedTests === totalTests) {
            console.log('🎉 ALL GAMING FEATURES WORKING PERFECTLY!');
        } else {
            console.log('⚠️ Some features may need attention on this browser');
        }

        return testResults;

    } catch (error) {
        console.error('💥 Browser gaming test failed:', error);
        return testResults;
    }
}

// Export test function
window.runBrowserGamingTest = runBrowserGamingTest;

// Auto-run if loaded directly
if (window.location.search.includes('test=gaming')) {
    setTimeout(() => {
        runBrowserGamingTest();
    }, 3000);
}
