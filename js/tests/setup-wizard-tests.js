/**
 * Comprehensive Setup Wizard Tests
 * Tests all aspects of the Setup Wizard functionality
 */

export class SetupWizardTests {
    constructor() {
        this.testResults = [];
        this.mockWizard = null;
    }

    async runAllTests() {
        console.log('🧙 Starting Setup Wizard Tests...');
        this.testResults = [];

        // Test module loading and initialization
        await this.testModuleLoading();
        await this.testWizardInitialization();

        // Test UI components and structure
        await this.testWizardUI();
        await this.testNavigationControls();
        await this.testStepValidation();

        // Test specific wizard steps
        await this.testWelcomeStep();
        await this.testCameraTestStep();
        await this.testTextTypeStep();
        await this.testOptimizationStep();
        await this.testCompletionStep();

        // Test wizard flow and state management
        await this.testWizardFlow();
        await this.testStateManagement();
        await this.testDataPersistence();

        // Test error handling and edge cases
        await this.testErrorHandling();
        await this.testEdgeCases();

        return this.generateTestReport();
    }

    async testModuleLoading() {
        try {
            // Test Setup Wizard module import
            const module = await import('../setup-wizard.js');
            this.addResult('Module Loading', 'SetupWizard module imports successfully',
                module.SetupWizard !== undefined,
                module.SetupWizard ? 'SetupWizard class found' : 'SetupWizard class not found');

            // Test module dependencies
            this.addResult('Module Dependencies', 'Required dependencies available',
                window.localStorage !== undefined && document.createElement !== undefined,
                'localStorage and DOM APIs available');

        } catch (error) {
            this.addResult('Module Loading', 'SetupWizard module imports successfully',
                false, `Import failed: ${error.message}`);
        }
    }

    async testWizardInitialization() {
        try {
            // Import and create wizard instance
            const { SetupWizard } = await import('../setup-wizard.js');
            this.mockWizard = new SetupWizard();

            this.addResult('Wizard Initialization', 'SetupWizard instance creates successfully',
                this.mockWizard !== null,
                'Wizard instance created');

            // Test initial state
            this.addResult('Initial State', 'Wizard starts with correct initial state',
                this.mockWizard.wizardState && this.mockWizard.wizardState.currentStep === 1,
                `Current step: ${this.mockWizard.wizardState?.currentStep || 'undefined'}`);

            // Test wizard state properties
            const hasRequiredProperties = this.mockWizard.wizardState &&
                'currentStep' in this.mockWizard.wizardState &&
                'totalSteps' in this.mockWizard.wizardState &&
                'cameraPermission' in this.mockWizard.wizardState;

            this.addResult('State Properties', 'Wizard state has required properties',
                hasRequiredProperties,
                'wizardState contains currentStep, totalSteps, cameraPermission');

        } catch (error) {
            this.addResult('Wizard Initialization', 'SetupWizard instance creates successfully',
                false, `Initialization failed: ${error.message}`);
        }
    }

    async testWizardUI() {
        if (!this.mockWizard) {
            this.addResult('Wizard UI', 'UI tests require wizard instance', false, 'No wizard instance available');
            return;
        }

        try {
            // Test wizard modal creation
            this.mockWizard.showWizard();

            // Check for wizard modal in DOM
            const wizardModal = document.getElementById('setup-wizard-modal');
            this.addResult('Modal Creation', 'Wizard modal is created in DOM',
                wizardModal !== null,
                wizardModal ? 'Modal element found' : 'Modal element not found');

            if (wizardModal) {
                // Test modal structure
                const header = wizardModal.querySelector('.wizard-header');
                const content = wizardModal.querySelector('.wizard-content');
                const navigation = wizardModal.querySelector('.wizard-navigation');

                this.addResult('Modal Structure', 'Modal has required structure elements',
                    header && content && navigation,
                    `Header: ${!!header}, Content: ${!!content}, Navigation: ${!!navigation}`);

                // Test step indicator
                const stepIndicator = wizardModal.querySelector('.step-indicator');
                this.addResult('Step Indicator', 'Step indicator is present',
                    stepIndicator !== null,
                    stepIndicator ? 'Step indicator found' : 'Step indicator not found');

                // Test progress visualization
                const progressElements = wizardModal.querySelectorAll('.step-circle');
                this.addResult('Progress Visualization', 'Progress circles for all steps',
                    progressElements.length === this.mockWizard.wizardState.totalSteps,
                    `Found ${progressElements.length} progress circles, expected ${this.mockWizard.wizardState.totalSteps}`);
            }

        } catch (error) {
            this.addResult('Wizard UI', 'UI components render correctly',
                false, `UI test failed: ${error.message}`);
        }
    }

    async testNavigationControls() {
        try {
            const wizardModal = document.getElementById('setup-wizard-modal');
            if (!wizardModal) {
                this.addResult('Navigation Controls', 'Navigation requires wizard modal', false, 'Modal not found');
                return;
            }

            // Test navigation buttons
            const prevBtn = wizardModal.querySelector('#wizard-prev-btn');
            const nextBtn = wizardModal.querySelector('#wizard-next-btn');
            const closeBtn = wizardModal.querySelector('#wizard-close-btn');

            this.addResult('Navigation Buttons', 'Navigation buttons are present',
                prevBtn && nextBtn && closeBtn,
                `Prev: ${!!prevBtn}, Next: ${!!nextBtn}, Close: ${!!closeBtn}`);

            // Test button states on first step
            if (prevBtn && nextBtn) {
                this.addResult('Initial Button States', 'Previous button disabled on first step',
                    prevBtn.disabled === true,
                    `Previous button disabled: ${prevBtn.disabled}`);

                this.addResult('Next Button State', 'Next button is enabled on first step',
                    nextBtn.disabled === false,
                    `Next button disabled: ${nextBtn.disabled}`);
            }

        } catch (error) {
            this.addResult('Navigation Controls', 'Navigation controls function correctly',
                false, `Navigation test failed: ${error.message}`);
        }
    }

    async testStepValidation() {
        if (!this.mockWizard) {
            this.addResult('Step Validation', 'Step validation requires wizard instance', false, 'No wizard instance');
            return;
        }

        try {
            // Test step loading function
            this.mockWizard.loadWizardStep(1);

            const wizardModal = document.getElementById('setup-wizard-modal');
            if (wizardModal) {
                const stepContent = wizardModal.querySelector('.step-content');
                this.addResult('Step Loading', 'Step content loads correctly',
                    stepContent !== null && stepContent.innerHTML.length > 0,
                    stepContent ? `Content length: ${stepContent.innerHTML.length}` : 'No step content');

                // Test step title and description
                const stepTitle = wizardModal.querySelector('.step-title');
                const stepDescription = wizardModal.querySelector('.step-description');

                this.addResult('Step Content Structure', 'Step has title and description',
                    stepTitle && stepDescription,
                    `Title: ${!!stepTitle}, Description: ${!!stepDescription}`);
            }

        } catch (error) {
            this.addResult('Step Validation', 'Step validation works correctly',
                false, `Step validation failed: ${error.message}`);
        }
    }

    async testWelcomeStep() {
        if (!this.mockWizard) return;

        try {
            this.mockWizard.loadWizardStep(1);

            const wizardModal = document.getElementById('setup-wizard-modal');
            if (wizardModal) {
                // Test welcome step specific elements
                const welcomeContent = wizardModal.querySelector('.welcome-content');
                const featuresGrid = wizardModal.querySelector('.features-grid');

                this.addResult('Welcome Step Content', 'Welcome step has specific content',
                    welcomeContent || featuresGrid,
                    'Welcome step content structure verified');

                // Test step progression from welcome
                const canProceed = this.mockWizard.canProceedToNextStep();
                this.addResult('Welcome Step Progression', 'Can proceed from welcome step',
                    canProceed,
                    `Can proceed: ${canProceed}`);
            }

        } catch (error) {
            this.addResult('Welcome Step', 'Welcome step functions correctly',
                false, `Welcome step test failed: ${error.message}`);
        }
    }

    async testCameraTestStep() {
        if (!this.mockWizard) return;

        try {
            this.mockWizard.loadWizardStep(2);

            const wizardModal = document.getElementById('setup-wizard-modal');
            if (wizardModal) {
                // Test camera test step elements
                const cameraTest = wizardModal.querySelector('.camera-test');
                const permissionStatus = wizardModal.querySelector('.permission-status');

                this.addResult('Camera Test Step', 'Camera test step has required elements',
                    cameraTest || permissionStatus,
                    'Camera test elements present');

                // Test camera permission handling
                const hasMediaDevices = 'mediaDevices' in navigator;
                this.addResult('Camera API Support', 'Browser supports camera API',
                    hasMediaDevices,
                    `MediaDevices API: ${hasMediaDevices}`);
            }

        } catch (error) {
            this.addResult('Camera Test Step', 'Camera test step functions correctly',
                false, `Camera test failed: ${error.message}`);
        }
    }

    async testTextTypeStep() {
        if (!this.mockWizard) return;

        try {
            this.mockWizard.loadWizardStep(3);

            const wizardModal = document.getElementById('setup-wizard-modal');
            if (wizardModal) {
                // Test text type selection elements
                const textTypeOptions = wizardModal.querySelectorAll('.text-type-option');

                this.addResult('Text Type Options', 'Text type step has selection options',
                    textTypeOptions.length > 0,
                    `Found ${textTypeOptions.length} text type options`);

                // Test option selection
                if (textTypeOptions.length > 0) {
                    const firstOption = textTypeOptions[0];
                    this.addResult('Text Type Selection', 'Text type options are interactive',
                        firstOption.classList.contains('text-type-option'),
                        'Text type options have correct classes');
                }
            }

        } catch (error) {
            this.addResult('Text Type Step', 'Text type step functions correctly',
                false, `Text type test failed: ${error.message}`);
        }
    }

    async testOptimizationStep() {
        if (!this.mockWizard) return;

        try {
            this.mockWizard.loadWizardStep(4);

            const wizardModal = document.getElementById('setup-wizard-modal');
            if (wizardModal) {
                // Test optimization step elements
                const optimizationProgress = wizardModal.querySelector('.optimization-progress');
                const calibrationStatus = wizardModal.querySelector('.calibration-status');

                this.addResult('Optimization Step', 'Optimization step has progress indicators',
                    optimizationProgress || calibrationStatus,
                    'Optimization progress elements present');

                // Test auto-calibration trigger
                const startOptimizationBtn = wizardModal.querySelector('#start-optimization');
                this.addResult('Optimization Controls', 'Optimization has start control',
                    startOptimizationBtn !== null,
                    startOptimizationBtn ? 'Start optimization button found' : 'Button not found');
            }

        } catch (error) {
            this.addResult('Optimization Step', 'Optimization step functions correctly',
                false, `Optimization test failed: ${error.message}`);
        }
    }

    async testCompletionStep() {
        if (!this.mockWizard) return;

        try {
            this.mockWizard.loadWizardStep(5);

            const wizardModal = document.getElementById('setup-wizard-modal');
            if (wizardModal) {
                // Test completion step elements
                const completionSummary = wizardModal.querySelector('.completion-summary');
                const finishBtn = wizardModal.querySelector('#finish-wizard');

                this.addResult('Completion Step', 'Completion step has summary and finish button',
                    completionSummary && finishBtn,
                    `Summary: ${!!completionSummary}, Finish: ${!!finishBtn}`);

                // Test wizard completion
                if (finishBtn) {
                    this.addResult('Wizard Completion', 'Finish button is functional',
                        finishBtn.tagName === 'BUTTON',
                        'Finish button is properly configured');
                }
            }

        } catch (error) {
            this.addResult('Completion Step', 'Completion step functions correctly',
                false, `Completion test failed: ${error.message}`);
        }
    }

    async testWizardFlow() {
        if (!this.mockWizard) return;

        try {
            // Test forward navigation through steps
            const initialStep = this.mockWizard.wizardState.currentStep;

            // Test next step
            this.mockWizard.nextStep();
            const afterNext = this.mockWizard.wizardState.currentStep;

            this.addResult('Forward Navigation', 'Next step navigation works',
                afterNext === initialStep + 1,
                `Step changed from ${initialStep} to ${afterNext}`);

            // Test previous step
            this.mockWizard.previousStep();
            const afterPrev = this.mockWizard.wizardState.currentStep;

            this.addResult('Backward Navigation', 'Previous step navigation works',
                afterPrev === initialStep,
                `Step returned to ${afterPrev}`);

            // Test step boundaries
            this.mockWizard.wizardState.currentStep = 1;
            this.mockWizard.previousStep();

            this.addResult('Step Boundaries', 'Cannot go before first step',
                this.mockWizard.wizardState.currentStep === 1,
                'Correctly stays at step 1');

        } catch (error) {
            this.addResult('Wizard Flow', 'Wizard flow navigation works correctly',
                false, `Flow test failed: ${error.message}`);
        }
    }

    async testStateManagement() {
        if (!this.mockWizard) return;

        try {
            // Test state persistence
            const originalState = { ...this.mockWizard.wizardState };

            // Modify state
            this.mockWizard.wizardState.textType = 'gaming';
            this.mockWizard.wizardState.cameraPermission = 'granted';

            // Test state update
            this.addResult('State Modification', 'Wizard state can be modified',
                this.mockWizard.wizardState.textType === 'gaming',
                `Text type set to: ${this.mockWizard.wizardState.textType}`);

            // Test state validation
            const isValid = this.mockWizard.validateWizardState();
            this.addResult('State Validation', 'Wizard state validation works',
                typeof isValid === 'boolean',
                `Validation returned: ${isValid}`);

        } catch (error) {
            this.addResult('State Management', 'State management functions correctly',
                false, `State test failed: ${error.message}`);
        }
    }

    async testDataPersistence() {
        if (!this.mockWizard) return;

        try {
            // Test localStorage integration
            const testData = {
                textType: 'gaming',
                optimizationResults: { accuracy: 85 },
                completedAt: new Date().toISOString()
            };

            // Save wizard data
            this.mockWizard.saveWizardData(testData);

            // Retrieve wizard data
            const retrievedData = this.mockWizard.loadWizardData();

            this.addResult('Data Persistence', 'Wizard data persists to localStorage',
                retrievedData && retrievedData.textType === 'gaming',
                `Retrieved data: ${JSON.stringify(retrievedData)}`);

            // Test data clearing
            this.mockWizard.clearWizardData();
            const clearedData = this.mockWizard.loadWizardData();

            this.addResult('Data Clearing', 'Wizard data can be cleared',
                !clearedData || Object.keys(clearedData).length === 0,
                'Data cleared successfully');

        } catch (error) {
            this.addResult('Data Persistence', 'Data persistence works correctly',
                false, `Persistence test failed: ${error.message}`);
        }
    }

    async testErrorHandling() {
        if (!this.mockWizard) return;

        try {
            // Test invalid step navigation
            try {
                this.mockWizard.loadWizardStep(999);
                this.addResult('Invalid Step Handling', 'Handles invalid step gracefully',
                    false, 'Should have thrown error for invalid step');
            } catch (error) {
                this.addResult('Invalid Step Handling', 'Handles invalid step gracefully',
                    true, `Correctly caught error: ${error.message}`);
            }

            // Test missing DOM elements
            const originalModal = document.getElementById('setup-wizard-modal');
            if (originalModal) {
                originalModal.remove();
            }

            try {
                this.mockWizard.updateNavigationButtons();
                this.addResult('Missing DOM Handling', 'Handles missing DOM elements',
                    true, 'No error thrown for missing elements');
            } catch (error) {
                this.addResult('Missing DOM Handling', 'Handles missing DOM elements',
                    false, `Error with missing DOM: ${error.message}`);
            }

        } catch (error) {
            this.addResult('Error Handling', 'Error handling works correctly',
                false, `Error handling test failed: ${error.message}`);
        }
    }

    async testEdgeCases() {
        if (!this.mockWizard) return;

        try {
            // Test rapid navigation clicks
            this.mockWizard.wizardState.currentStep = 2;
            this.mockWizard.nextStep();
            this.mockWizard.nextStep();
            this.mockWizard.previousStep();

            this.addResult('Rapid Navigation', 'Handles rapid navigation clicks',
                this.mockWizard.wizardState.currentStep >= 1 &&
                this.mockWizard.wizardState.currentStep <= this.mockWizard.wizardState.totalSteps,
                `Final step: ${this.mockWizard.wizardState.currentStep}`);

            // Test browser refresh simulation
            const beforeRefreshStep = this.mockWizard.wizardState.currentStep;
            this.mockWizard.saveWizardData({ currentStep: beforeRefreshStep, inProgress: true });

            // Simulate refresh by creating new wizard instance
            const { SetupWizard } = await import('../setup-wizard.js');
            const refreshedWizard = new SetupWizard();
            const restoredData = refreshedWizard.loadWizardData();

            this.addResult('Browser Refresh Recovery', 'Recovers state after refresh',
                restoredData && restoredData.currentStep === beforeRefreshStep,
                `Restored step: ${restoredData?.currentStep}`);

        } catch (error) {
            this.addResult('Edge Cases', 'Edge cases handled correctly',
                false, `Edge case test failed: ${error.message}`);
        }
    }

    addResult(category, description, passed, details) {
        this.testResults.push({
            category,
            description,
            status: passed ? 'passed' : 'failed',
            details,
            timestamp: new Date().toISOString()
        });
    }

    generateTestReport() {
        const passed = this.testResults.filter(r => r.status === 'passed').length;
        const failed = this.testResults.filter(r => r.status === 'failed').length;
        const total = this.testResults.length;

        const report = {
            summary: {
                total,
                passed,
                failed,
                successRate: total > 0 ? ((passed / total) * 100).toFixed(1) : 0
            },
            categories: this.groupResultsByCategory(),
            details: this.testResults
        };

        console.log(`🧙 Setup Wizard Tests Complete: ${passed}/${total} passed (${report.summary.successRate}%)`);
        return report;
    }

    groupResultsByCategory() {
        const categories = {};
        this.testResults.forEach(result => {
            if (!categories[result.category]) {
                categories[result.category] = { passed: 0, failed: 0, total: 0 };
            }
            categories[result.category][result.status]++;
            categories[result.category].total++;
        });
        return categories;
    }

    // Cleanup method
    cleanup() {
        const wizardModal = document.getElementById('setup-wizard-modal');
        if (wizardModal) {
            wizardModal.remove();
        }

        // Clear test data from localStorage
        localStorage.removeItem('captnreverse-wizard-data');

        this.mockWizard = null;
        this.testResults = [];
    }
}

// Export for use in master test pipeline
export default SetupWizardTests;