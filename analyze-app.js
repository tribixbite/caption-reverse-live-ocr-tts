#!/usr/bin/env node

/**
 * CaptnReverse Application Analyzer
 * Analyzes the HTML content and JavaScript files for potential issues
 */

import fs from 'fs';
import path from 'path';

class AppAnalyzer {
    constructor() {
        this.issues = [];
        this.warnings = [];
        this.successes = [];
    }

    log(level, message, details = null) {
        const entry = { level, message, details, timestamp: new Date().toISOString() };

        switch (level) {
            case 'error':
                this.issues.push(entry);
                console.log(`❌ ${message}`);
                break;
            case 'warning':
                this.warnings.push(entry);
                console.log(`⚠️  ${message}`);
                break;
            case 'success':
                this.successes.push(entry);
                console.log(`✅ ${message}`);
                break;
            case 'info':
                console.log(`ℹ️  ${message}`);
                break;
        }

        if (details) {
            console.log(`   ${details}`);
        }
    }

    async analyzeHTML() {
        console.log('\n🔍 Analyzing HTML Structure...');

        try {
            const htmlContent = fs.readFileSync('index.html', 'utf8');

            // Check for essential elements
            const essentialChecks = [
                { pattern: /id="setup-wizard-btn"/, name: 'Setup Wizard button' },
                { pattern: /id="web-test-suite-btn"/, name: 'Web Test Suite button' },
                { pattern: /id="monitor-toggle"/, name: 'Start Monitoring button' },
                { pattern: /id="camera-feed"/, name: 'Video element for camera' },
                { pattern: /id="crop-overlay"/, name: 'Canvas element for OCR' },
                { pattern: /class=".*output.*"|id=".*output.*"/, name: 'Text output element' },
                { pattern: /id="status-text"/, name: 'Status indicator' }
            ];

            essentialChecks.forEach(check => {
                if (check.pattern.test(htmlContent)) {
                    this.log('success', `${check.name} found in HTML`);
                } else {
                    this.log('error', `${check.name} missing from HTML`);
                }
            });

            // Check for CDN dependencies
            const cdnChecks = [
                { pattern: /tailwindcss\.com/, name: 'Tailwind CSS CDN' },
                { pattern: /tesseract\.js/, name: 'Tesseract.js CDN' },
                { pattern: /paddle-js-models/, name: 'PaddleOCR CDN' }
            ];

            cdnChecks.forEach(check => {
                if (check.pattern.test(htmlContent)) {
                    this.log('success', `${check.name} loaded from CDN`);
                } else {
                    this.log('warning', `${check.name} not found`);
                }
            });

            // Check for potential JavaScript issues
            const jsPatterns = [
                { pattern: /console\.error/g, name: 'console.error calls', level: 'warning' },
                { pattern: /throw new Error/g, name: 'error throwing code', level: 'info' },
                { pattern: /addEventListener/g, name: 'event listeners', level: 'success' },
                { pattern: /navigator\.mediaDevices/g, name: 'camera API usage', level: 'success' }
            ];

            jsPatterns.forEach(check => {
                const matches = htmlContent.match(check.pattern);
                if (matches) {
                    this.log(check.level, `${check.name}: ${matches.length} occurrences found`);
                }
            });

        } catch (error) {
            this.log('error', 'Failed to read index.html', error.message);
        }
    }

    async analyzeJavaScriptFiles() {
        console.log('\n🔍 Analyzing JavaScript Files...');

        const jsFiles = [
            'js/app.js',
            'js/setup-wizard.js',
            'js/web-test-suite.js',
            'js/master-test-pipeline.js',
            'js/ocr.js',
            'js/camera.js',
            'js/speech.js'
        ];

        for (const file of jsFiles) {
            try {
                if (fs.existsSync(file)) {
                    this.log('success', `${file} exists`);

                    const content = fs.readFileSync(file, 'utf8');

                    // Check for common issues
                    if (content.includes('document is not defined')) {
                        this.log('warning', `${file} may have Node.js compatibility issues`);
                    }

                    if (content.includes('navigator') && !content.includes('typeof navigator')) {
                        this.log('warning', `${file} uses navigator without safety checks`);
                    }

                    if (content.includes('addEventListener')) {
                        this.log('success', `${file} sets up event listeners`);
                    }

                    if (content.includes('async function') || content.includes('await ')) {
                        this.log('success', `${file} uses modern async/await`);
                    }

                } else {
                    this.log('error', `${file} not found`);
                }
            } catch (error) {
                this.log('error', `Failed to analyze ${file}`, error.message);
            }
        }
    }

    async analyzeTestInfrastructure() {
        console.log('\n🔍 Analyzing Test Infrastructure...');

        try {
            // Check test files
            const testFiles = [
                'run-tests.js',
                'js/master-test-pipeline.js',
                'js/cli-test-adapter.js',
                'tests/captn-reverse.spec.ts',
                'playwright.config.ts'
            ];

            testFiles.forEach(file => {
                if (fs.existsSync(file)) {
                    this.log('success', `Test file ${file} exists`);
                } else {
                    this.log('warning', `Test file ${file} not found`);
                }
            });

            // Analyze package.json for test scripts
            if (fs.existsSync('package.json')) {
                const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

                if (packageJson.scripts) {
                    if (packageJson.scripts.test) {
                        this.log('success', 'Test script defined in package.json');
                    } else {
                        this.log('warning', 'No test script in package.json');
                    }

                    if (packageJson.scripts.build) {
                        this.log('success', 'Build script defined in package.json');
                    }
                }

                if (packageJson.dependencies || packageJson.devDependencies) {
                    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

                    if (deps['playwright']) {
                        this.log('success', 'Playwright testing framework available');
                    }

                    if (deps['@playwright/test']) {
                        this.log('success', 'Playwright test runner available');
                    }
                }
            }

        } catch (error) {
            this.log('error', 'Failed to analyze test infrastructure', error.message);
        }
    }

    async checkServerConnectivity() {
        console.log('\n🔍 Checking Server Connectivity...');

        try {
            const response = await fetch('http://localhost:3000');
            if (response.ok) {
                this.log('success', 'Server is running and accessible');

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    this.log('success', 'Server returns HTML content');
                } else {
                    this.log('warning', `Unexpected content type: ${contentType}`);
                }

                const contentLength = response.headers.get('content-length');
                if (contentLength) {
                    this.log('info', `Response size: ${contentLength} bytes`);
                }

            } else {
                this.log('error', `Server responded with status: ${response.status}`);
            }
        } catch (error) {
            this.log('error', 'Server connectivity failed', error.message);
        }
    }

    generateReport() {
        console.log('\n📊 Analysis Report Summary:');
        console.log(`✅ Successes: ${this.successes.length}`);
        console.log(`⚠️  Warnings: ${this.warnings.length}`);
        console.log(`❌ Issues: ${this.issues.length}`);

        if (this.issues.length > 0) {
            console.log('\n🚨 Critical Issues Found:');
            this.issues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.message}`);
                if (issue.details) console.log(`   ${issue.details}`);
            });
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.warnings.forEach((warning, index) => {
                console.log(`${index + 1}. ${warning.message}`);
                if (warning.details) console.log(`   ${warning.details}`);
            });
        }

        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                successes: this.successes.length,
                warnings: this.warnings.length,
                issues: this.issues.length
            },
            details: {
                successes: this.successes,
                warnings: this.warnings,
                issues: this.issues
            }
        };

        fs.writeFileSync('analysis-report.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Detailed report saved to analysis-report.json');
    }

    async analyze() {
        console.log('🔬 CaptnReverse Application Analysis Starting...');

        await this.analyzeHTML();
        await this.analyzeJavaScriptFiles();
        await this.analyzeTestInfrastructure();
        await this.checkServerConnectivity();

        this.generateReport();

        return {
            success: this.issues.length === 0,
            summary: {
                successes: this.successes.length,
                warnings: this.warnings.length,
                issues: this.issues.length
            }
        };
    }
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const analyzer = new AppAnalyzer();
    analyzer.analyze().then(result => {
        process.exit(result.success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Analysis failed:', error);
        process.exit(2);
    });
}

export { AppAnalyzer };