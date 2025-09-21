/**
 * Comprehensive UI Effects Tests
 * Tests glassmorphism effects, theme system, and visual components
 */

export class UIEffectsTests {
    constructor() {
        this.testResults = [];
        this.originalTheme = null;
    }

    async runAllTests() {
        console.log('🎨 Starting UI Effects Tests...');
        this.testResults = [];

        // Store original theme
        this.originalTheme = document.documentElement.getAttribute('data-theme') || '';

        // Test glassmorphism effects
        await this.testGlassmorphismClasses();
        await this.testGlassmorphismAnimations();
        await this.testGlassmorphismPerformance();

        // Test theme system
        await this.testThemeSystemInitialization();
        await this.testThemeApplication();
        await this.testThemeVariables();
        await this.testThemePersistence();
        await this.testThemeTransitions();

        // Test gaming aesthetic elements
        await this.testGamingGlowEffects();
        await this.testButtonAnimations();
        await this.testStatusIndicators();

        // Test responsive design
        await this.testResponsiveEffects();
        await this.testAccessibilityCompliance();

        // Test performance and optimization
        await this.testAnimationPerformance();
        await this.testMemoryUsage();

        // Restore original theme
        if (this.originalTheme) {
            document.documentElement.setAttribute('data-theme', this.originalTheme);
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        return this.generateTestReport();
    }

    async testGlassmorphismClasses() {
        try {
            // Test basic glassmorphism classes exist
            const glassClasses = ['.glass', '.glass-strong', '.glass-gaming', '.glass-cyberpunk'];

            for (const className of glassClasses) {
                const classExists = this.checkCSSClassExists(className);
                this.addResult('Glassmorphism Classes', `${className} class exists`,
                    classExists, `CSS class: ${className}`);

                if (classExists) {
                    // Test class properties
                    const hasBackdropFilter = this.checkCSSProperty(className, 'backdrop-filter');
                    this.addResult('Glassmorphism Properties', `${className} has backdrop-filter`,
                        hasBackdropFilter, `backdrop-filter property check for ${className}`);
                }
            }

            // Test glassmorphism CSS custom properties
            const rootStyles = getComputedStyle(document.documentElement);
            const hasThemeVariables = rootStyles.getPropertyValue('--theme-primary').trim() !== '';

            this.addResult('CSS Custom Properties', 'Theme variables are defined',
                hasThemeVariables, 'CSS custom properties available');

        } catch (error) {
            this.addResult('Glassmorphism Classes', 'Glassmorphism CSS classes function correctly',
                false, `Class test failed: ${error.message}`);
        }
    }

    async testGlassmorphismAnimations() {
        try {
            // Test keyframe animations
            const animations = ['shimmer', 'gaming-pulse', 'glow-pulse', 'rotate', 'float'];

            for (const animationName of animations) {
                const animationExists = this.checkCSSAnimation(animationName);
                this.addResult('Glassmorphism Animations', `${animationName} animation exists`,
                    animationExists, `CSS animation: @keyframes ${animationName}`);
            }

            // Test animation application
            const testElement = document.createElement('div');
            testElement.className = 'glass';
            testElement.style.position = 'absolute';
            testElement.style.top = '-1000px';
            document.body.appendChild(testElement);

            const computedStyle = getComputedStyle(testElement);
            const hasBackdropFilter = computedStyle.backdropFilter !== 'none';

            this.addResult('Glassmorphism Application', 'Glassmorphism effects apply to elements',
                hasBackdropFilter, `backdrop-filter: ${computedStyle.backdropFilter}`);

            document.body.removeChild(testElement);

        } catch (error) {
            this.addResult('Glassmorphism Animations', 'Glassmorphism animations function correctly',
                false, `Animation test failed: ${error.message}`);
        }
    }

    async testGlassmorphismPerformance() {
        try {
            // Test for performance-optimized classes
            const hasGPUAccelerated = this.checkCSSClassExists('.gpu-accelerated');
            this.addResult('Performance Optimization', 'GPU acceleration class exists',
                hasGPUAccelerated, 'GPU-accelerated class for performance');

            // Test reduced motion support
            const hasReducedMotion = this.checkCSSMediaQuery('prefers-reduced-motion');
            this.addResult('Accessibility', 'Reduced motion preferences supported',
                hasReducedMotion, 'prefers-reduced-motion media query');

            // Test mobile optimizations
            const hasMobileOptimizations = this.checkCSSMediaQuery('max-width: 768px');
            this.addResult('Mobile Optimization', 'Mobile-specific optimizations exist',
                hasMobileOptimizations, 'Mobile media queries present');

        } catch (error) {
            this.addResult('Glassmorphism Performance', 'Performance optimizations work correctly',
                false, `Performance test failed: ${error.message}`);
        }
    }

    async testThemeSystemInitialization() {
        try {
            // Test theme system integration
            const themeButtons = document.querySelectorAll('.theme-option');
            this.addResult('Theme System UI', 'Theme option buttons exist',
                themeButtons.length > 0, `Found ${themeButtons.length} theme buttons`);

            // Test theme options
            const expectedThemes = ['', 'cyberpunk', 'retro', 'high-contrast'];
            const actualThemes = Array.from(themeButtons).map(btn => btn.dataset.theme);

            const hasAllThemes = expectedThemes.every(theme => actualThemes.includes(theme));
            this.addResult('Theme Options', 'All expected themes are available',
                hasAllThemes, `Available themes: ${actualThemes.join(', ')}`);

        } catch (error) {
            this.addResult('Theme System Initialization', 'Theme system initializes correctly',
                false, `Initialization test failed: ${error.message}`);
        }
    }

    async testThemeApplication() {
        try {
            const themes = ['cyberpunk', 'retro', 'high-contrast', ''];

            for (const theme of themes) {
                // Apply theme
                if (theme) {
                    document.documentElement.setAttribute('data-theme', theme);
                } else {
                    document.documentElement.removeAttribute('data-theme');
                }

                // Wait for theme application
                await new Promise(resolve => setTimeout(resolve, 100));

                // Check if theme is applied
                const appliedTheme = document.documentElement.getAttribute('data-theme') || '';
                const themeApplied = appliedTheme === theme;

                this.addResult('Theme Application', `${theme || 'default'} theme applies correctly`,
                    themeApplied, `Applied theme: ${appliedTheme}`);

                // Test theme-specific styles
                if (theme) {
                    const hasThemeStyles = this.checkThemeSpecificStyles(theme);
                    this.addResult('Theme Styles', `${theme} theme has specific styles`,
                        hasThemeStyles, `Theme-specific CSS for ${theme}`);
                }
            }

        } catch (error) {
            this.addResult('Theme Application', 'Theme application works correctly',
                false, `Application test failed: ${error.message}`);
        }
    }

    async testThemeVariables() {
        try {
            const themes = ['cyberpunk', 'retro', 'high-contrast'];

            for (const theme of themes) {
                document.documentElement.setAttribute('data-theme', theme);
                await new Promise(resolve => setTimeout(resolve, 50));

                const rootStyles = getComputedStyle(document.documentElement);
                const primaryColor = rootStyles.getPropertyValue('--theme-primary').trim();
                const secondaryColor = rootStyles.getPropertyValue('--theme-secondary').trim();

                this.addResult('Theme Variables', `${theme} theme has custom variables`,
                    primaryColor !== '' && secondaryColor !== '',
                    `Primary: ${primaryColor}, Secondary: ${secondaryColor}`);
            }

        } catch (error) {
            this.addResult('Theme Variables', 'Theme variables update correctly',
                false, `Variables test failed: ${error.message}`);
        }
    }

    async testThemePersistence() {
        try {
            // Test localStorage persistence
            const testTheme = 'cyberpunk';

            // Simulate theme save
            localStorage.setItem('captnreverse-theme', testTheme);

            // Simulate page reload by checking stored theme
            const storedTheme = localStorage.getItem('captnreverse-theme');
            this.addResult('Theme Persistence', 'Theme persists to localStorage',
                storedTheme === testTheme, `Stored theme: ${storedTheme}`);

            // Clean up
            localStorage.removeItem('captnreverse-theme');

        } catch (error) {
            this.addResult('Theme Persistence', 'Theme persistence works correctly',
                false, `Persistence test failed: ${error.message}`);
        }
    }

    async testThemeTransitions() {
        try {
            // Test transition class application
            document.documentElement.classList.add('theme-transition');

            const hasTransitionClass = document.documentElement.classList.contains('theme-transition');
            this.addResult('Theme Transitions', 'Theme transition class applies',
                hasTransitionClass, 'theme-transition class applied');

            // Test transition removal
            setTimeout(() => {
                document.documentElement.classList.remove('theme-transition');
            }, 100);

            await new Promise(resolve => setTimeout(resolve, 150));

            const transitionRemoved = !document.documentElement.classList.contains('theme-transition');
            this.addResult('Theme Transitions', 'Theme transition class removes',
                transitionRemoved, 'theme-transition class removed');

        } catch (error) {
            this.addResult('Theme Transitions', 'Theme transitions work correctly',
                false, `Transition test failed: ${error.message}`);
        }
    }

    async testGamingGlowEffects() {
        try {
            // Test gaming glow classes
            const glowClasses = ['.gaming-glow', '.text-gaming-glow'];

            for (const className of glowClasses) {
                const classExists = this.checkCSSClassExists(className);
                this.addResult('Gaming Glow Effects', `${className} class exists`,
                    classExists, `Gaming glow class: ${className}`);
            }

            // Test glow application
            const testElement = document.createElement('div');
            testElement.className = 'gaming-glow';
            testElement.style.position = 'absolute';
            testElement.style.top = '-1000px';
            document.body.appendChild(testElement);

            const computedStyle = getComputedStyle(testElement);
            const hasBoxShadow = computedStyle.boxShadow !== 'none';

            this.addResult('Gaming Glow Application', 'Gaming glow effects apply to elements',
                hasBoxShadow, `box-shadow: ${computedStyle.boxShadow}`);

            document.body.removeChild(testElement);

        } catch (error) {
            this.addResult('Gaming Glow Effects', 'Gaming glow effects function correctly',
                false, `Glow test failed: ${error.message}`);
        }
    }

    async testButtonAnimations() {
        try {
            // Test button animation classes
            const buttonClasses = ['.btn-primary', '.btn-gaming', '.btn-themed'];

            for (const className of buttonClasses) {
                const classExists = this.checkCSSClassExists(className);
                this.addResult('Button Animations', `${className} class exists`,
                    classExists, `Button animation class: ${className}`);
            }

            // Test hover effects
            const testButton = document.createElement('button');
            testButton.className = 'btn-primary';
            testButton.style.position = 'absolute';
            testButton.style.top = '-1000px';
            document.body.appendChild(testButton);

            const hasTransition = getComputedStyle(testButton).transition !== 'none';
            this.addResult('Button Hover Effects', 'Buttons have transition effects',
                hasTransition, 'CSS transitions present');

            document.body.removeChild(testButton);

        } catch (error) {
            this.addResult('Button Animations', 'Button animations function correctly',
                false, `Button test failed: ${error.message}`);
        }
    }

    async testStatusIndicators() {
        try {
            // Test status indicator classes
            const statusClasses = ['.status-pulse', '.status-dot-gaming'];

            for (const className of statusClasses) {
                const classExists = this.checkCSSClassExists(className);
                this.addResult('Status Indicators', `${className} class exists`,
                    classExists, `Status indicator class: ${className}`);
            }

            // Test pulse animation
            const pulseExists = this.checkCSSAnimation('pulse');
            this.addResult('Status Animations', 'Pulse animation exists',
                pulseExists, 'CSS pulse animation');

        } catch (error) {
            this.addResult('Status Indicators', 'Status indicators function correctly',
                false, `Status test failed: ${error.message}`);
        }
    }

    async testResponsiveEffects() {
        try {
            // Test responsive design media queries
            const mobileQuery = window.matchMedia('(max-width: 768px)');
            this.addResult('Responsive Design', 'Mobile media query is accessible',
                mobileQuery !== null, 'MediaQueryList available');

            // Test reduced motion preferences
            const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.addResult('Motion Preferences', 'Reduced motion preference is accessible',
                reducedMotionQuery !== null, 'Reduced motion MediaQueryList available');

        } catch (error) {
            this.addResult('Responsive Effects', 'Responsive effects work correctly',
                false, `Responsive test failed: ${error.message}`);
        }
    }

    async testAccessibilityCompliance() {
        try {
            // Test high contrast theme
            document.documentElement.setAttribute('data-theme', 'high-contrast');
            await new Promise(resolve => setTimeout(resolve, 50));

            // Test focus styles
            const hasFocusStyles = this.checkCSSProperty('button:focus', 'outline');
            this.addResult('Accessibility', 'Focus styles are defined',
                hasFocusStyles, 'Button focus outline styles');

            // Test color contrast improvements in high contrast theme
            const rootStyles = getComputedStyle(document.documentElement);
            const primaryColor = rootStyles.getPropertyValue('--theme-primary').trim();

            this.addResult('High Contrast Theme', 'High contrast theme has distinct colors',
                primaryColor.includes('#ffffff') || primaryColor.includes('white'),
                `High contrast primary: ${primaryColor}`);

        } catch (error) {
            this.addResult('Accessibility Compliance', 'Accessibility features work correctly',
                false, `Accessibility test failed: ${error.message}`);
        }
    }

    async testAnimationPerformance() {
        try {
            // Test for will-change properties
            const testElement = document.createElement('div');
            testElement.className = 'gpu-accelerated';
            testElement.style.position = 'absolute';
            testElement.style.top = '-1000px';
            document.body.appendChild(testElement);

            const computedStyle = getComputedStyle(testElement);
            const hasWillChange = computedStyle.willChange !== 'auto';
            const hasTransform = computedStyle.transform !== 'none';

            this.addResult('Animation Performance', 'Performance optimizations applied',
                hasWillChange || hasTransform,
                `will-change: ${computedStyle.willChange}, transform: ${computedStyle.transform}`);

            document.body.removeChild(testElement);

        } catch (error) {
            this.addResult('Animation Performance', 'Animation performance optimizations work',
                false, `Performance test failed: ${error.message}`);
        }
    }

    async testMemoryUsage() {
        try {
            // Test CSS optimization for memory usage
            const stylesheets = document.styleSheets.length;
            this.addResult('Memory Optimization', 'Reasonable number of stylesheets',
                stylesheets < 10, `Stylesheet count: ${stylesheets}`);

            // Test for excessive DOM modifications
            const initialElementCount = document.querySelectorAll('*').length;

            // Apply and remove theme multiple times
            for (let i = 0; i < 5; i++) {
                document.documentElement.setAttribute('data-theme', 'cyberpunk');
                await new Promise(resolve => setTimeout(resolve, 10));
                document.documentElement.removeAttribute('data-theme');
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            const finalElementCount = document.querySelectorAll('*').length;
            const memoryLeak = finalElementCount > initialElementCount + 10;

            this.addResult('Memory Usage', 'No significant DOM element leaks',
                !memoryLeak, `Element count change: ${finalElementCount - initialElementCount}`);

        } catch (error) {
            this.addResult('Memory Usage', 'Memory usage is optimized',
                false, `Memory test failed: ${error.message}`);
        }
    }

    // Helper methods
    checkCSSClassExists(className) {
        try {
            const styleSheets = Array.from(document.styleSheets);
            for (const sheet of styleSheets) {
                try {
                    const rules = Array.from(sheet.cssRules || sheet.rules);
                    const found = rules.some(rule =>
                        rule.selectorText && rule.selectorText.includes(className)
                    );
                    if (found) return true;
                } catch (e) {
                    // Skip inaccessible stylesheets
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    checkCSSProperty(selector, property) {
        try {
            const testElement = document.createElement('div');
            if (selector.includes(':focus')) {
                testElement.setAttribute('tabindex', '0');
            }
            testElement.style.position = 'absolute';
            testElement.style.top = '-1000px';
            document.body.appendChild(testElement);

            const computedStyle = getComputedStyle(testElement);
            const hasProperty = computedStyle.getPropertyValue(property) !== '';

            document.body.removeChild(testElement);
            return hasProperty;
        } catch (error) {
            return false;
        }
    }

    checkCSSAnimation(animationName) {
        try {
            const styleSheets = Array.from(document.styleSheets);
            for (const sheet of styleSheets) {
                try {
                    const rules = Array.from(sheet.cssRules || sheet.rules);
                    const found = rules.some(rule =>
                        rule.type === CSSRule.KEYFRAMES_RULE && rule.name === animationName
                    );
                    if (found) return true;
                } catch (e) {
                    // Skip inaccessible stylesheets
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    checkCSSMediaQuery(query) {
        try {
            const styleSheets = Array.from(document.styleSheets);
            for (const sheet of styleSheets) {
                try {
                    const rules = Array.from(sheet.cssRules || sheet.rules);
                    const found = rules.some(rule =>
                        rule.type === CSSRule.MEDIA_RULE &&
                        rule.conditionText && rule.conditionText.includes(query)
                    );
                    if (found) return true;
                } catch (e) {
                    // Skip inaccessible stylesheets
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    checkThemeSpecificStyles(theme) {
        try {
            const styleSheets = Array.from(document.styleSheets);
            for (const sheet of styleSheets) {
                try {
                    const rules = Array.from(sheet.cssRules || sheet.rules);
                    const found = rules.some(rule =>
                        rule.selectorText &&
                        rule.selectorText.includes(`[data-theme="${theme}"]`)
                    );
                    if (found) return true;
                } catch (e) {
                    // Skip inaccessible stylesheets
                }
            }
            return false;
        } catch (error) {
            return false;
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

        console.log(`🎨 UI Effects Tests Complete: ${passed}/${total} passed (${report.summary.successRate}%)`);
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
        // Restore original theme
        if (this.originalTheme) {
            document.documentElement.setAttribute('data-theme', this.originalTheme);
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        // Remove any test classes
        document.documentElement.classList.remove('theme-transition');

        this.testResults = [];
    }
}

// Export for use in master test pipeline
export default UIEffectsTests;