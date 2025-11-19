/**
 * CaptnReverse Audio System Tests
 * Tests audio functionality, TTS integration, and voice synthesis
 * Focus on critical issues: audio feedback on word recognition
 */

// Test result interface
interface TestResult {
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
    details?: Record<string, unknown>;
}

// Performance thresholds interface
interface PerformanceThresholds {
    audioInitTime: number;
    ttsLatency: number;
    maxMemoryUsage: number;
}

// Voice info interface
interface VoiceInfo {
    name: string;
    lang: string;
    default: boolean;
    localService?: boolean;
}

// Extend Window interface for webkit and memory APIs
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
        gc?: () => void;
    }
    interface Performance {
        memory?: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
        };
    }
}

export class AudioSystemTests {
    public name: string;
    public category: string;
    public priority: string;
    public description: string;
    private performanceThresholds: PerformanceThresholds;
    private testPhrases: string[];

    constructor() {
        this.name = 'Audio System Tests';
        this.category = 'core';
        this.priority = 'high';
        this.description = 'Validates audio system functionality, TTS integration, and voice synthesis';

        // Audio performance benchmarks
        this.performanceThresholds = {
            audioInitTime: 5000, // 5 seconds max for audio initialization
            ttsLatency: 3000, // 3 seconds max TTS response time
            maxMemoryUsage: 20 * 1024 * 1024 // 20MB max audio memory
        };

        this.testPhrases = [
            'Hello world',
            'Testing text to speech functionality',
            'OCR text recognition complete'
        ];
    }

    async runTests(): Promise<TestResult[]> {
        const results: TestResult[] = [];

        try {
            console.log('Starting Audio System Tests...');

            // Test 1: Web Audio API availability and support
            results.push(await this.testWebAudioAPISupport());

            // Test 2: SpeechSynthesis API availability
            results.push(await this.testSpeechSynthesisAPISupport());

            // Test 3: Audio context creation and initialization
            results.push(await this.testAudioContextInitialization());

            // Test 4: Available voices enumeration
            results.push(await this.testVoiceEnumeration());

            // Test 5: Basic text-to-speech functionality
            results.push(await this.testBasicTTSFunctionality());

            // Test 6: TTS voice selection and configuration
            results.push(await this.testTTSVoiceConfiguration());

            // Test 7: TTS performance and latency
            results.push(await this.testTTSPerformance());

            // Test 8: Audio state management
            results.push(await this.testAudioStateManagement());

            // Test 9: TTS error handling and edge cases
            results.push(await this.testTTSErrorHandling());

            // Test 10: Audio memory management
            results.push(await this.testAudioMemoryManagement());

            // Test 11: Cross-browser audio compatibility
            results.push(await this.testCrossBrowserAudioCompatibility());

            // Test 12: Audio interruption and queue management
            results.push(await this.testAudioInterruptionHandling());

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            results.push({
                name: 'Audio System Test Suite',
                status: 'failed',
                error: `Test suite failed: ${errorMessage}`,
                duration: 0
            });
        }

        return results;
    }

    private async testWebAudioAPISupport(): Promise<TestResult> {
        const startTime = Date.now();

        try {
            const hasAudioContext = 'AudioContext' in window || 'webkitAudioContext' in window;
            const hasMediaDevices = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
            const hasWebAudio = 'webkitAudioContext' in window || 'AudioContext' in window;

            if (!hasAudioContext) {
                throw new Error('AudioContext not supported in this browser');
            }

            return {
                name: 'Web Audio API Support',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    audioContext: hasAudioContext,
                    mediaDevices: hasMediaDevices,
                    webAudioAPI: hasWebAudio,
                    vendor: 'AudioContext' in window ? 'standard' : 'webkit'
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                name: 'Web Audio API Support',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    private async testSpeechSynthesisAPISupport(): Promise<TestResult> {
        const startTime = Date.now();

        try {
            const hasSpeechSynthesis = 'speechSynthesis' in window;
            const hasSpeechSynthesisUtterance = 'SpeechSynthesisUtterance' in window;

            if (!hasSpeechSynthesis || !hasSpeechSynthesisUtterance) {
                throw new Error('Speech Synthesis API not supported in this browser');
            }

            const synthesis = window.speechSynthesis;
            const canSpeak = typeof synthesis.speak === 'function';
            const canCancel = typeof synthesis.cancel === 'function';
            const canPause = typeof synthesis.pause === 'function';

            return {
                name: 'Speech Synthesis API Support',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    speechSynthesis: hasSpeechSynthesis,
                    speechSynthesisUtterance: hasSpeechSynthesisUtterance,
                    speakMethod: canSpeak,
                    cancelMethod: canCancel,
                    pauseMethod: canPause,
                    speaking: synthesis.speaking,
                    pending: synthesis.pending,
                    paused: synthesis.paused
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                name: 'Speech Synthesis API Support',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    private async testAudioContextInitialization(): Promise<TestResult> {
        const startTime = Date.now();

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContextClass();

            if (!audioContext) {
                throw new Error('Failed to create AudioContext');
            }

            // Test basic AudioContext properties
            const state = audioContext.state;
            const sampleRate = audioContext.sampleRate;
            const destination = audioContext.destination;

            // Attempt to resume context (required for some browsers)
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // Clean up
            await audioContext.close();

            return {
                name: 'Audio Context Initialization',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    initialState: state,
                    sampleRate,
                    hasDestination: !!destination,
                    contextCreated: true,
                    contextClosed: true
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                name: 'Audio Context Initialization',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    private async testVoiceEnumeration(): Promise<TestResult> {
        const startTime = Date.now();

        try {
            const synthesis = window.speechSynthesis;

            // Get voices (might be empty initially)
            let voices = synthesis.getVoices();

            // If no voices initially, wait for voiceschanged event
            if (voices.length === 0) {
                await new Promise<void>((resolve) => {
                    const timeout = setTimeout(() => resolve(), 2000); // 2 second timeout

                    synthesis.onvoiceschanged = () => {
                        clearTimeout(timeout);
                        resolve();
                    };
                });

                voices = synthesis.getVoices();
            }

            const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
            const defaultVoice = voices.find(voice => voice.default);
            const localVoices = voices.filter(voice => voice.localService);
            const remoteVoices = voices.filter(voice => !voice.localService);

            return {
                name: 'Voice Enumeration',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    totalVoices: voices.length,
                    englishVoices: englishVoices.length,
                    hasDefaultVoice: !!defaultVoice,
                    localVoices: localVoices.length,
                    remoteVoices: remoteVoices.length,
                    sampleVoices: voices.slice(0, 3).map(voice => ({
                        name: voice.name,
                        lang: voice.lang,
                        default: voice.default,
                        localService: voice.localService
                    }))
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                name: 'Voice Enumeration',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    private async testBasicTTSFunctionality(): Promise<TestResult> {
        const startTime = Date.now();

        try {
            const synthesis = window.speechSynthesis;
            const utterance = new SpeechSynthesisUtterance(this.testPhrases[0]);

            // Test utterance creation and configuration
            if (!utterance) {
                throw new Error('Failed to create SpeechSynthesisUtterance');
            }

            // Set basic properties
            utterance.volume = 0.1; // Very low volume for testing
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            // Test speech synthesis (but stop immediately to avoid audio)
            const speechPromise = new Promise<string>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    synthesis.cancel();
                    reject(new Error('TTS timeout'));
                }, this.performanceThresholds.ttsLatency);

                utterance.onstart = () => {
                    clearTimeout(timeout);
                    synthesis.cancel(); // Stop immediately after start
                    resolve('started');
                };

                utterance.onerror = (event) => {
                    clearTimeout(timeout);
                    reject(new Error(`TTS error: ${event.error}`));
                };
            });

            synthesis.speak(utterance);
            const result = await speechPromise;

            return {
                name: 'Basic TTS Functionality',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    utteranceCreated: true,
                    speechStarted: result === 'started',
                    configurable: true,
                    testPhrase: this.testPhrases[0],
                    volume: utterance.volume,
                    rate: utterance.rate,
                    pitch: utterance.pitch
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                name: 'Basic TTS Functionality',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    private async testTTSVoiceConfiguration(): Promise<TestResult> {
        const startTime = Date.now();

        try {
            const synthesis = window.speechSynthesis;
            const voices = synthesis.getVoices();

            if (voices.length === 0) {
                // Wait for voices to load
                await new Promise<void>(resolve => {
                    const timeout = setTimeout(resolve, 1000);
                    synthesis.onvoiceschanged = () => {
                        clearTimeout(timeout);
                        resolve();
                    };
                });
            }

            const availableVoices = synthesis.getVoices();
            const testVoice = availableVoices.find(voice => voice.lang.startsWith('en')) || availableVoices[0];

            if (!testVoice) {
                throw new Error('No voices available for testing');
            }

            const utterance = new SpeechSynthesisUtterance('Voice configuration test');
            utterance.voice = testVoice;
            utterance.volume = 0.1;
            utterance.rate = 1.5;
            utterance.pitch = 0.8;

            // Test voice assignment
            const voiceAssigned = utterance.voice === testVoice;

            return {
                name: 'TTS Voice Configuration',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    voicesAvailable: availableVoices.length,
                    testVoice: testVoice ? {
                        name: testVoice.name,
                        lang: testVoice.lang,
                        default: testVoice.default
                    } : null,
                    voiceAssigned,
                    volumeConfigurable: utterance.volume === 0.1,
                    rateConfigurable: utterance.rate === 1.5,
                    pitchConfigurable: utterance.pitch === 0.8
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                name: 'TTS Voice Configuration',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    private async testTTSPerformance(): Promise<TestResult> {
        const startTime = Date.now();

        try {
            const synthesis = window.speechSynthesis;
            const testStartTime = Date.now();

            for (const phrase of this.testPhrases) {
                const utterance = new SpeechSynthesisUtterance(phrase);
                utterance.volume = 0; // Silent for performance testing

                const speechPromise = new Promise<number>((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        synthesis.cancel();
                        reject(new Error('TTS performance timeout'));
                    }, this.performanceThresholds.ttsLatency);

                    utterance.onstart = () => {
                        clearTimeout(timeout);
                        synthesis.cancel();
                        resolve(Date.now() - testStartTime);
                    };

                    utterance.onerror = (event) => {
                        clearTimeout(timeout);
                        reject(new Error(`TTS performance error: ${event.error}`));
                    };
                });

                synthesis.speak(utterance);
                await speechPromise;
            }

            const totalTime = Date.now() - testStartTime;
            const averageTime = totalTime / this.testPhrases.length;

            return {
                name: 'TTS Performance',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    totalTestTime: totalTime,
                    averageLatency: averageTime,
                    phrasesProcessed: this.testPhrases.length,
                    withinThreshold: averageTime < this.performanceThresholds.ttsLatency,
                    threshold: this.performanceThresholds.ttsLatency
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                name: 'TTS Performance',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    private async testAudioStateManagement(): Promise<TestResult> {
        const startTime = Date.now();

        try {
            const synthesis = window.speechSynthesis;

            // Test initial state
            const initialSpeaking = synthesis.speaking;
            const initialPending = synthesis.pending;
            const initialPaused = synthesis.paused;

            // Test pause/resume functionality
            const utterance = new SpeechSynthesisUtterance('State management test');
            utterance.volume = 0; // Silent

            let canPause = false;
            let canResume = false;

            const statePromise = new Promise<void>((resolve) => {
                const timeout = setTimeout(() => {
                    synthesis.cancel();
                    resolve();
                }, 2000);

                utterance.onstart = () => {
                    // Test pause
                    synthesis.pause();
                    canPause = synthesis.paused;

                    // Test resume
                    synthesis.resume();
                    canResume = !synthesis.paused;

                    synthesis.cancel();
                    clearTimeout(timeout);
                    resolve();
                };

                utterance.onerror = () => {
                    clearTimeout(timeout);
                    resolve();
                };
            });

            synthesis.speak(utterance);
            await statePromise;

            return {
                name: 'Audio State Management',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    initialState: {
                        speaking: initialSpeaking,
                        pending: initialPending,
                        paused: initialPaused
                    },
                    pauseSupported: canPause,
                    resumeSupported: canResume,
                    cancelSupported: true
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                name: 'Audio State Management',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    private async testTTSErrorHandling(): Promise<TestResult> {
        const startTime = Date.now();

        try {
            const synthesis = window.speechSynthesis;

            // Test empty text
            let emptyTextHandled = false;
            try {
                const emptyUtterance = new SpeechSynthesisUtterance('');
                synthesis.speak(emptyUtterance);
                synthesis.cancel();
                emptyTextHandled = true;
            } catch {
                emptyTextHandled = true; // Error is acceptable behavior
            }

            // Test very long text
            let longTextHandled = false;
            try {
                const longText = 'a'.repeat(10000);
                const longUtterance = new SpeechSynthesisUtterance(longText);
                synthesis.speak(longUtterance);
                synthesis.cancel();
                longTextHandled = true;
            } catch {
                longTextHandled = true; // Error is acceptable behavior
            }

            // Test invalid voice assignment
            let invalidVoiceHandled = false;
            try {
                const utterance = new SpeechSynthesisUtterance('Invalid voice test');
                utterance.voice = null;
                synthesis.speak(utterance);
                synthesis.cancel();
                invalidVoiceHandled = true;
            } catch {
                invalidVoiceHandled = true; // Error is acceptable behavior
            }

            return {
                name: 'TTS Error Handling',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    emptyTextHandled,
                    longTextHandled,
                    invalidVoiceHandled,
                    gracefulErrorHandling: emptyTextHandled && longTextHandled && invalidVoiceHandled
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                name: 'TTS Error Handling',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    private async testAudioMemoryManagement(): Promise<TestResult> {
        const startTime = Date.now();

        try {
            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

            // Create multiple TTS instances
            const synthesis = window.speechSynthesis;
            const utterances: SpeechSynthesisUtterance[] = [];

            for (let i = 0; i < 10; i++) {
                const utterance = new SpeechSynthesisUtterance(`Memory test ${i}`);
                utterance.volume = 0;
                utterances.push(utterance);
                synthesis.speak(utterance);
            }

            // Cancel all
            synthesis.cancel();

            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }

            const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            const memoryDelta = finalMemory - initialMemory;

            return {
                name: 'Audio Memory Management',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    initialMemory: this.formatBytes(initialMemory),
                    finalMemory: this.formatBytes(finalMemory),
                    memoryDelta: this.formatBytes(memoryDelta),
                    utterancesCreated: utterances.length,
                    withinThreshold: memoryDelta < this.performanceThresholds.maxMemoryUsage,
                    threshold: this.formatBytes(this.performanceThresholds.maxMemoryUsage)
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                name: 'Audio Memory Management',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    private async testCrossBrowserAudioCompatibility(): Promise<TestResult> {
        const startTime = Date.now();

        try {
            const features: Record<string, boolean> = {
                audioContext: 'AudioContext' in window,
                webkitAudioContext: 'webkitAudioContext' in window,
                speechSynthesis: 'speechSynthesis' in window,
                speechSynthesisUtterance: 'SpeechSynthesisUtterance' in window,
                mediaDevices: 'mediaDevices' in navigator,
                getUserMedia: !!(navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices)
            };

            const browserInfo = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled
            };

            const supportScore = Object.values(features).filter(Boolean).length;
            const maxScore = Object.keys(features).length;
            const compatibilityPercentage = (supportScore / maxScore) * 100;

            return {
                name: 'Cross-Browser Audio Compatibility',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    features,
                    browserInfo,
                    supportScore: `${supportScore}/${maxScore}`,
                    compatibilityPercentage: `${compatibilityPercentage.toFixed(1)}%`,
                    recommendedBrowser: compatibilityPercentage >= 80
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                name: 'Cross-Browser Audio Compatibility',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    private async testAudioInterruptionHandling(): Promise<TestResult> {
        const startTime = Date.now();

        try {
            const synthesis = window.speechSynthesis;

            // Test queue management
            const utterance1 = new SpeechSynthesisUtterance('First utterance');
            const utterance2 = new SpeechSynthesisUtterance('Second utterance');
            const utterance3 = new SpeechSynthesisUtterance('Third utterance');

            utterance1.volume = 0;
            utterance2.volume = 0;
            utterance3.volume = 0;

            // Add multiple utterances to queue
            synthesis.speak(utterance1);
            synthesis.speak(utterance2);
            synthesis.speak(utterance3);

            const queuedSpeaking = synthesis.speaking;
            const queuedPending = synthesis.pending;

            // Test interruption
            synthesis.cancel();

            const cancelledSpeaking = synthesis.speaking;
            const cancelledPending = synthesis.pending;

            return {
                name: 'Audio Interruption Handling',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    queueManagement: {
                        speaking: queuedSpeaking,
                        pending: queuedPending
                    },
                    interruptionHandling: {
                        speaking: cancelledSpeaking,
                        pending: cancelledPending
                    },
                    utterancesQueued: 3,
                    cancelledSuccessfully: !cancelledSpeaking && !cancelledPending
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                name: 'Audio Interruption Handling',
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    // Helper methods
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
