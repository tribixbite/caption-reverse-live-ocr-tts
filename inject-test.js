/**
 * Test Injection Script for Node.js
 * Injects and runs tests in the browser via HTTP requests
 */

import http from 'http';
import fs from 'fs';

async function runBrowserTests() {
    console.log('🧪 Starting Browser Test Injection...');

    try {
        // First, check if the server is running
        const testConnection = await new Promise((resolve, reject) => {
            const req = http.get('http://localhost:3000', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
            req.setTimeout(5000, () => reject(new Error('Connection timeout')));
        });

        console.log('✅ Server is accessible');

        // Check if required buttons exist in the HTML
        const buttonChecks = [
            'setup-wizard-btn',
            'web-test-suite-btn',
            'request-camera'
        ];

        const buttonResults = {};
        buttonChecks.forEach(btnId => {
            const exists = testConnection.includes(`id="${btnId}"`);
            buttonResults[btnId] = exists;
            console.log(`${exists ? '✅' : '❌'} Button ${btnId}: ${exists ? 'FOUND' : 'MISSING'}`);
        });

        // Check for ES modules
        const hasModules = testConnection.includes('type="module"');
        console.log(`${hasModules ? '✅' : '❌'} ES Modules: ${hasModules ? 'ENABLED' : 'DISABLED'}`);

        // Check for Tesseract.js
        const hasTesseract = testConnection.includes('tesseract');
        console.log(`${hasTesseract ? '✅' : '❌'} Tesseract.js: ${hasTesseract ? 'LOADED' : 'MISSING'}`);

        // Check for Tailwind CSS
        const hasTailwind = testConnection.includes('tailwindcss.com');
        console.log(`${hasTailwind ? '✅' : '❌'} Tailwind CSS: ${hasTailwind ? 'LOADED' : 'MISSING'}`);

        // Check dark theme
        const hasDarkTheme = testConnection.includes('class="dark"');
        console.log(`${hasDarkTheme ? '✅' : '❌'} Dark Theme: ${hasDarkTheme ? 'ENABLED' : 'DISABLED'}`);

        // Check for main app structure
        const hasSetupScreen = testConnection.includes('id="setup-screen"');
        const hasMainApp = testConnection.includes('id="main-app"');
        console.log(`${hasSetupScreen ? '✅' : '❌'} Setup Screen: ${hasSetupScreen ? 'FOUND' : 'MISSING'}`);
        console.log(`${hasMainApp ? '✅' : '❌'} Main App: ${hasMainApp ? 'FOUND' : 'MISSING'}`);

        // Check for camera elements
        const hasCameraElements = testConnection.includes('camera-feed') && testConnection.includes('crop-overlay');
        console.log(`${hasCameraElements ? '✅' : '❌'} Camera Elements: ${hasCameraElements ? 'FOUND' : 'MISSING'}`);

        // Test JavaScript files accessibility
        const jsFiles = [
            '/js/app.js',
            '/js/setup-wizard.js',
            '/js/web-test-suite.js',
            '/js/master-test-pipeline.js'
        ];

        console.log('\n🔍 Testing JavaScript File Accessibility...');
        const jsResults = {};

        for (const jsFile of jsFiles) {
            try {
                const fileContent = await new Promise((resolve, reject) => {
                    const req = http.get(`http://localhost:3000${jsFile}`, (res) => {
                        if (res.statusCode === 200) {
                            let data = '';
                            res.on('data', chunk => data += chunk);
                            res.on('end', () => resolve(data));
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}`));
                        }
                    });
                    req.on('error', reject);
                    req.setTimeout(3000, () => reject(new Error('Timeout')));
                });

                const hasExports = fileContent.includes('export') || fileContent.includes('module.exports');
                jsResults[jsFile] = { accessible: true, hasExports };
                console.log(`✅ ${jsFile}: ACCESSIBLE ${hasExports ? '(has exports)' : '(no exports)'}`);

                // Check for syntax errors (basic check)
                if (fileContent.includes('SyntaxError') || fileContent.includes('Unexpected token')) {
                    console.log(`⚠️ ${jsFile}: May contain syntax errors`);
                }

            } catch (error) {
                jsResults[jsFile] = { accessible: false, error: error.message };
                console.log(`❌ ${jsFile}: ${error.message}`);
            }
        }

        // Summary report
        console.log('\n📊 Test Summary Report:');
        console.log('=======================');
        console.log(`🔗 Server Status: RUNNING on http://localhost:3000`);
        console.log(`🎯 Required Buttons: ${Object.values(buttonResults).filter(Boolean).length}/${Object.keys(buttonResults).length} found`);
        console.log(`📦 JavaScript Files: ${Object.values(jsResults).filter(r => r.accessible).length}/${Object.keys(jsResults).length} accessible`);
        console.log(`🎨 Core Features: ${[hasModules, hasTesseract, hasTailwind, hasDarkTheme].filter(Boolean).length}/4 enabled`);
        console.log(`📱 App Structure: ${[hasSetupScreen, hasMainApp, hasCameraElements].filter(Boolean).length}/3 components found`);

        // Identify potential issues
        console.log('\n🔧 Potential Issues:');
        if (!buttonResults['setup-wizard-btn']) console.log('❌ Setup Wizard button missing from DOM');
        if (!buttonResults['web-test-suite-btn']) console.log('❌ Web Test Suite button missing from DOM');
        if (!hasModules) console.log('❌ ES Modules not properly configured');
        if (!hasTesseract) console.log('❌ Tesseract.js not loaded');
        if (!Object.values(jsResults).every(r => r.accessible)) console.log('❌ Some JavaScript files not accessible');

        // Recommendations
        console.log('\n💡 Recommendations:');
        if (Object.values(buttonResults).every(Boolean) && Object.values(jsResults).every(r => r.accessible)) {
            console.log('✅ Core infrastructure appears functional');
            console.log('🎯 Test button click handlers and module loading');
            console.log('📷 Test camera permissions and MediaDevices API');
            console.log('🔊 Test Web Speech API and TTS functionality');
        } else {
            console.log('🔧 Fix missing elements and file accessibility issues first');
        }

        const report = {
            timestamp: new Date().toISOString(),
            server: { running: true, url: 'http://localhost:3000' },
            buttons: buttonResults,
            features: { hasModules, hasTesseract, hasTailwind, hasDarkTheme },
            structure: { hasSetupScreen, hasMainApp, hasCameraElements },
            javascriptFiles: jsResults
        };

        // Save report
        fs.writeFileSync('./test-injection-report.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Report saved to: test-injection-report.json');

        return report;

    } catch (error) {
        console.error('❌ Test injection failed:', error.message);
        throw error;
    }
}

// Run the tests
runBrowserTests().catch(console.error);