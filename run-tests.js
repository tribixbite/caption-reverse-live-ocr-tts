#!/usr/bin/env node

/**
 * CaptnReverse Test Runner
 * Command-line interface for the Master Test Pipeline
 * Usage: node run-tests.js [options]
 */

import { masterTestPipeline } from './js/master-test-pipeline.js';

class TestRunner {
    constructor() {
        this.options = this.parseArguments();
    }

    parseArguments() {
        const args = process.argv.slice(2);
        const options = {
            include: null,
            exclude: null,
            categories: null,
            priorities: null,
            failFast: false,
            verbose: false,
            format: 'console', // console, json, html
            output: null
        };

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            const nextArg = args[i + 1];

            switch (arg) {
                case '--include':
                case '-i':
                    options.include = nextArg ? nextArg.split(',') : null;
                    i++;
                    break;

                case '--exclude':
                case '-e':
                    options.exclude = nextArg ? nextArg.split(',') : null;
                    i++;
                    break;

                case '--categories':
                case '-c':
                    options.categories = nextArg ? nextArg.split(',') : null;
                    i++;
                    break;

                case '--priorities':
                case '-p':
                    options.priorities = nextArg ? nextArg.split(',') : null;
                    i++;
                    break;

                case '--fail-fast':
                case '-f':
                    options.failFast = true;
                    break;

                case '--verbose':
                case '-v':
                    options.verbose = true;
                    break;

                case '--format':
                    options.format = nextArg || 'console';
                    i++;
                    break;

                case '--output':
                case '-o':
                    options.output = nextArg;
                    i++;
                    break;

                case '--help':
                case '-h':
                    this.showHelp();
                    process.exit(0);
                    break;

                case '--list':
                case '-l':
                    this.listAvailableTests();
                    process.exit(0);
                    break;

                default:
                    if (arg.startsWith('-')) {
                        console.error(`Unknown option: ${arg}`);
                        process.exit(1);
                    }
                    break;
            }
        }

        return options;
    }

    showHelp() {
        console.log(`
CaptnReverse Test Runner

Usage: node run-tests.js [options]

Options:
  -i, --include <tests>     Only run specified test suites (comma-separated)
  -e, --exclude <tests>     Run all except specified test suites (comma-separated)
  -c, --categories <cats>   Only run tests from specified categories (comma-separated)
  -p, --priorities <pris>   Only run tests with specified priorities (comma-separated)
  -f, --fail-fast          Stop on first test failure
  -v, --verbose             Show detailed output
  --format <format>         Output format: console (default), json, html
  -o, --output <file>       Write results to file
  -l, --list               List available tests and categories
  -h, --help               Show this help message

Examples:
  node run-tests.js --include setup-wizard,theme-system
  node run-tests.js --exclude performance --fail-fast
  node run-tests.js --categories core,ui --verbose
  node run-tests.js --priorities critical,high --format json
  node run-tests.js --output test-results.json --format json

Available test suites:
  setup-wizard, web-test-suite, glassmorphism, theme-system, gesture-controls,
  ocr-accuracy, audio-system, camera-controls, performance, browser-compatibility,
  accessibility, security

Available categories:
  core, ui, interaction, performance, compatibility, accessibility, security

Available priorities:
  critical, high, medium, low
        `);
    }

    listAvailableTests() {
        console.log('\n📋 Available Test Suites:');
        const testSuites = masterTestPipeline.listTestSuites();

        testSuites.forEach(suite => {
            console.log(`  ${suite.key.padEnd(20)} - ${suite.name}`);
            console.log(`    Category: ${suite.category}, Priority: ${suite.priority}`);
            console.log(`    ${suite.description}`);
            console.log('');
        });

        console.log('\n🏷️  Available Categories:');
        const categories = masterTestPipeline.getCategories();
        console.log(`  ${categories.join(', ')}`);

        console.log('\n⭐ Available Priorities:');
        const priorities = masterTestPipeline.getPriorities();
        console.log(`  ${priorities.join(', ')}`);
    }

    async run() {
        try {
            console.log('🧪 CaptnReverse Test Runner Starting...');

            if (this.options.verbose) {
                console.log('📊 Test Configuration:');
                console.log(`  Include: ${this.options.include?.join(', ') || 'all'}`);
                console.log(`  Exclude: ${this.options.exclude?.join(', ') || 'none'}`);
                console.log(`  Categories: ${this.options.categories?.join(', ') || 'all'}`);
                console.log(`  Priorities: ${this.options.priorities?.join(', ') || 'all'}`);
                console.log(`  Fail Fast: ${this.options.failFast}`);
                console.log(`  Format: ${this.options.format}`);
                console.log('');
            }

            // Create progress callback for verbose output
            const onProgress = this.options.verbose ? (progress) => {
                console.log(`📊 Progress: ${progress.current}/${progress.total} - ${progress.suite} (${progress.status})`);
            } : null;

            // Run the tests
            const results = await masterTestPipeline.runTests({
                include: this.options.include,
                exclude: this.options.exclude,
                categories: this.options.categories,
                priorities: this.options.priorities,
                failFast: this.options.failFast,
                onProgress
            });

            // Format and output results
            await this.outputResults(results);

            // Exit with appropriate code
            const exitCode = results.failed > 0 ? 1 : 0;
            process.exit(exitCode);

        } catch (error) {
            console.error('❌ Test runner failed:', error.message);
            if (this.options.verbose) {
                console.error(error.stack);
            }
            process.exit(2);
        }
    }

    async outputResults(results) {
        switch (this.options.format) {
            case 'json':
                await this.outputJSON(results);
                break;
            case 'html':
                await this.outputHTML(results);
                break;
            default:
                this.outputConsole(results);
                break;
        }
    }

    outputConsole(results) {
        console.log('\n🎯 Test Results Summary:');
        console.log(`  Duration: ${results.duration}ms`);
        console.log(`  Total Tests: ${results.total}`);
        console.log(`  Passed: ${results.passed} ✅`);
        console.log(`  Failed: ${results.failed} ❌`);
        console.log(`  Skipped: ${results.skipped} ⏭️`);

        const successRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
        console.log(`  Success Rate: ${successRate}%`);
        console.log('');

        if (this.options.verbose || results.failed > 0) {
            console.log('📊 Detailed Results:');
            results.results.forEach(result => {
                const icon = result.status === 'passed' ? '✅' : '❌';
                console.log(`  ${icon} ${result.name} (${result.duration}ms)`);

                if (result.status === 'failed') {
                    console.log(`    Error: ${result.error}`);
                }

                if (this.options.verbose && result.details) {
                    console.log(`    Details: ${JSON.stringify(result.details, null, 2)}`);
                }
            });
        }

        if (results.failed > 0) {
            console.log('\n❌ Failed Tests:');
            results.results
                .filter(r => r.status === 'failed')
                .forEach(result => {
                    console.log(`  • ${result.name}: ${result.error}`);
                });
        }
    }

    async outputJSON(results) {
        const output = JSON.stringify(results, null, 2);

        if (this.options.output) {
            const fs = await import('fs');
            await fs.promises.writeFile(this.options.output, output);
            console.log(`📄 Results written to ${this.options.output}`);
        } else {
            console.log(output);
        }
    }

    async outputHTML(results) {
        const html = this.generateHTMLReport(results);

        if (this.options.output) {
            const fs = await import('fs');
            await fs.promises.writeFile(this.options.output, html);
            console.log(`📄 HTML report written to ${this.options.output}`);
        } else {
            console.log(html);
        }
    }

    generateHTMLReport(results) {
        const successRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CaptnReverse Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .test-result { margin: 10px 0; padding: 15px; border-radius: 5px; border-left: 4px solid #ddd; }
        .test-result.passed { border-left-color: #28a745; background: #f8fff9; }
        .test-result.failed { border-left-color: #dc3545; background: #fff8f8; }
        .test-name { font-weight: bold; margin-bottom: 5px; }
        .test-details { font-size: 0.9em; color: #666; }
        .error { color: #dc3545; margin-top: 5px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 CaptnReverse Test Results</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>Duration</h3>
                <div class="value">${results.duration}ms</div>
            </div>
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${results.total}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value passed">${results.passed}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value failed">${results.failed}</div>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <div class="value">${successRate}%</div>
            </div>
        </div>

        <h2>📊 Test Results</h2>
        ${results.results.map(result => `
            <div class="test-result ${result.status}">
                <div class="test-name">${result.name}</div>
                <div class="test-details">
                    Category: ${result.category} | Priority: ${result.priority} | Duration: ${result.duration}ms
                </div>
                ${result.error ? `<div class="error">Error: ${result.error}</div>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>
        `;
    }
}

// Run the test runner if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const runner = new TestRunner();
    runner.run();
}

export { TestRunner };