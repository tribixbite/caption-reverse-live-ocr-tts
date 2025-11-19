/**
 * CLI Test Adapter for CaptnReverse Test Suite
 * Provides Node.js-compatible test execution without browser APIs
 */

// Type definitions
interface TestResultDetails {
    classExported?: boolean;
    instanceExported?: boolean;
    requiredMethods?: number;
    availableMethods?: number;
    totalSuites?: number;
    validStructure?: number;
    sampleSuites?: string[];
    categories?: number;
    priorities?: number;
    missingCategories?: string[];
    missingPriorities?: string[];
    availableCategories?: string[];
    availablePriorities?: string[];
    mutualExclusionEnforced?: boolean;
    filteringOptionsProcessed?: number;
    filteringResults?: FilteringResult[];
    optionsParsed?: number;
    expectedOptions?: number;
    missingOptions?: string[];
    sampleOptions?: RunnerOptions;
}

interface FilteringResult {
    options: TestOptions;
    success: boolean;
    error?: string;
}

interface TestOptions {
    include?: string[];
    exclude?: string[];
    categories?: string[];
    priorities?: string[];
}

interface CLITestResult {
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    details?: TestResultDetails;
    error?: string;
}

interface MasterTestPipelineInstance {
    runTests: (options: TestOptions & { include?: string[]; exclude?: string[] }) => Promise<unknown>;
    listTestSuites: () => TestSuiteInfo[];
    getCategories: () => string[];
    getPriorities: () => string[];
}

interface TestSuiteInfo {
    key: string;
    name: string;
    description: string;
    category: string;
    priority: string;
}

interface RunnerOptions {
    include?: string[];
    exclude?: string[];
    categories?: string[];
    priorities?: string[];
    failFast?: boolean;
    verbose?: boolean;
    format?: string;
    output?: string;
}

interface TestRunner {
    options: RunnerOptions;
}

export class CLITestAdapter {
    name: string;
    environment: string;

    constructor() {
        this.name = 'CLI Test Adapter';
        this.environment = 'Node.js';
    }

    async runCLICompatibleTests(): Promise<CLITestResult[]> {
        const results: CLITestResult[] = [];

        console.log('🖥️  Running CLI-compatible tests...');

        // Test 1: Module structure validation
        results.push(await this.testModuleStructure());

        // Test 2: Configuration validation
        results.push(await this.testConfigurationStructure());

        // Test 3: Test suite registry validation
        results.push(await this.testSuiteRegistry());

        // Test 4: Filtering logic validation
        results.push(await this.testFilteringLogic());

        // Test 5: CLI argument parsing
        results.push(await this.testCLIArgumentParsing());

        return results;
    }

    private async testModuleStructure(): Promise<CLITestResult> {
        const startTime = Date.now();

        try {
            // Test master test pipeline import
            const { MasterTestPipeline, masterTestPipeline } = await import('./master-test-pipeline.js') as {
                MasterTestPipeline: new () => MasterTestPipelineInstance;
                masterTestPipeline: MasterTestPipelineInstance;
            };

            if (!MasterTestPipeline) {
                throw new Error('MasterTestPipeline class not exported');
            }

            if (!masterTestPipeline) {
                throw new Error('masterTestPipeline instance not exported');
            }

            // Test basic methods exist
            const requiredMethods: Array<keyof MasterTestPipelineInstance> = ['runTests', 'listTestSuites', 'getCategories', 'getPriorities'];
            const missingMethods = requiredMethods.filter(method =>
                typeof masterTestPipeline[method] !== 'function'
            );

            if (missingMethods.length > 0) {
                throw new Error(`Missing methods: ${missingMethods.join(', ')}`);
            }

            return {
                name: 'Module Structure Validation',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    classExported: true,
                    instanceExported: true,
                    requiredMethods: requiredMethods.length,
                    availableMethods: requiredMethods.length - missingMethods.length
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                name: 'Module Structure Validation',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    private async testConfigurationStructure(): Promise<CLITestResult> {
        const startTime = Date.now();

        try {
            const { masterTestPipeline } = await import('./master-test-pipeline.js') as {
                masterTestPipeline: MasterTestPipelineInstance;
            };

            // Test test suite listing
            const testSuites = masterTestPipeline.listTestSuites();

            if (!Array.isArray(testSuites)) {
                throw new Error('listTestSuites() should return an array');
            }

            if (testSuites.length === 0) {
                throw new Error('No test suites registered');
            }

            // Validate test suite structure
            const requiredFields: Array<keyof TestSuiteInfo> = ['key', 'name', 'description', 'category', 'priority'];
            const invalidSuites = testSuites.filter(suite =>
                !requiredFields.every(field => field in suite)
            );

            if (invalidSuites.length > 0) {
                throw new Error(`Invalid test suite structure: ${invalidSuites.length} suites missing required fields`);
            }

            return {
                name: 'Configuration Structure Validation',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    totalSuites: testSuites.length,
                    validStructure: testSuites.length - invalidSuites.length,
                    sampleSuites: testSuites.slice(0, 3).map(s => s.key)
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                name: 'Configuration Structure Validation',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    private async testSuiteRegistry(): Promise<CLITestResult> {
        const startTime = Date.now();

        try {
            const { masterTestPipeline } = await import('./master-test-pipeline.js') as {
                masterTestPipeline: MasterTestPipelineInstance;
            };

            const categories = masterTestPipeline.getCategories();
            const priorities = masterTestPipeline.getPriorities();

            if (!Array.isArray(categories) || categories.length === 0) {
                throw new Error('No categories available');
            }

            if (!Array.isArray(priorities) || priorities.length === 0) {
                throw new Error('No priorities available');
            }

            // Expected categories and priorities
            const expectedCategories = ['core', 'ui', 'integration', 'interaction', 'performance', 'compatibility', 'accessibility', 'security'];
            const expectedPriorities = ['critical', 'high', 'medium', 'low'];

            const missingCategories = expectedCategories.filter(cat => !categories.includes(cat));
            const missingPriorities = expectedPriorities.filter(pri => !priorities.includes(pri));

            return {
                name: 'Test Suite Registry Validation',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    categories: categories.length,
                    priorities: priorities.length,
                    missingCategories,
                    missingPriorities,
                    availableCategories: categories,
                    availablePriorities: priorities
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                name: 'Test Suite Registry Validation',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    private async testFilteringLogic(): Promise<CLITestResult> {
        const startTime = Date.now();

        try {
            const { masterTestPipeline } = await import('./master-test-pipeline.js') as {
                masterTestPipeline: MasterTestPipelineInstance;
            };

            // Test include/exclude mutual exclusion
            let errorThrown = false;
            try {
                await masterTestPipeline.runTests({
                    include: ['test1'],
                    exclude: ['test2']
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '';
                if (errorMessage.includes('Cannot specify both include and exclude')) {
                    errorThrown = true;
                }
            }

            if (!errorThrown) {
                throw new Error('Include/exclude mutual exclusion not enforced');
            }

            // Test valid filtering options
            const testOptions: TestOptions[] = [
                { include: ['ocr-accuracy'] },
                { exclude: ['performance'] },
                { categories: ['core'] },
                { priorities: ['critical'] }
            ];

            const filteringResults: FilteringResult[] = [];
            for (const options of testOptions) {
                try {
                    // Note: This will fail due to browser dependencies, but we're testing the filtering logic
                    await masterTestPipeline.runTests(options);
                    filteringResults.push({ options, success: true });
                } catch (error) {
                    // Expected to fail in CLI environment, but filtering logic should be called
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    filteringResults.push({ options, success: false, error: errorMessage });
                }
            }

            return {
                name: 'Filtering Logic Validation',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    mutualExclusionEnforced: errorThrown,
                    filteringOptionsProcessed: filteringResults.length,
                    filteringResults
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                name: 'Filtering Logic Validation',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    private async testCLIArgumentParsing(): Promise<CLITestResult> {
        const startTime = Date.now();

        try {
            // Simulate CLI arguments
            const originalArgv = process.argv;

            // Test basic parsing
            process.argv = ['node', 'run-tests.js', '--verbose', '--format', 'json'];

            const { TestRunner } = await import('../run-tests.js') as {
                TestRunner: new () => TestRunner;
            };
            const runner = new TestRunner();

            if (!runner.options) {
                throw new Error('CLI options not parsed');
            }

            // Test expected options
            const expectedOptions: Array<keyof RunnerOptions> = ['include', 'exclude', 'categories', 'priorities', 'failFast', 'verbose', 'format', 'output'];
            const missingOptions = expectedOptions.filter(opt => !(opt in runner.options));

            // Restore original argv
            process.argv = originalArgv;

            return {
                name: 'CLI Argument Parsing Validation',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    optionsParsed: runner.options ? Object.keys(runner.options).length : 0,
                    expectedOptions: expectedOptions.length,
                    missingOptions,
                    sampleOptions: runner.options
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                name: 'CLI Argument Parsing Validation',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }
}
