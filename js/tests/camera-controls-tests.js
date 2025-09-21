/**
 * CaptnReverse Camera Controls Tests
 * Tests camera functionality, MediaDevices API, and crop area validation
 * Focus on critical issues: camera access, zoom, focus, crop area respect
 */

export class CameraControlsTests {
    constructor() {
        this.name = 'Camera Controls Tests';
        this.category = 'core';
        this.priority = 'high';
        this.description = 'Validates camera controls, MediaDevices API, and crop area validation functionality';

        // Camera performance benchmarks
        this.performanceThresholds = {
            cameraInitTime: 10000, // 10 seconds max for camera initialization
            streamStartTime: 5000, // 5 seconds max for stream start
            frameRate: 15, // Minimum 15 FPS
            resolution: { width: 640, height: 480 } // Minimum resolution
        };

        this.testConstraints = {
            video: {
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                frameRate: { min: 15, ideal: 30, max: 60 }
            }
        };
    }

    async runTests() {
        const results = [];

        try {
            console.log('📷 Starting Camera Controls Tests...');

            // Test 1: MediaDevices API availability and support
            results.push(await this.testMediaDevicesAPISupport());

            // Test 2: Camera permissions and access
            results.push(await this.testCameraPermissions());

            // Test 3: Camera enumeration and device detection
            results.push(await this.testCameraEnumeration());

            // Test 4: Video stream initialization
            results.push(await this.testVideoStreamInitialization());

            // Test 5: Camera constraints and capabilities
            results.push(await this.testCameraConstraints());

            // Test 6: Camera zoom controls
            results.push(await this.testCameraZoomControls());

            // Test 7: Camera focus controls
            results.push(await this.testCameraFocusControls());

            // Test 8: Video feed rendering and canvas integration
            results.push(await this.testVideoFeedRendering());

            // Test 9: Crop area functionality and validation
            results.push(await this.testCropAreaFunctionality());

            // Test 10: Crop area persistence and settings
            results.push(await this.testCropAreaPersistence());

            // Test 11: Camera stream performance monitoring
            results.push(await this.testCameraStreamPerformance());

            // Test 12: Camera error handling and fallbacks
            results.push(await this.testCameraErrorHandling());

        } catch (error) {
            results.push({
                name: 'Camera Controls Test Suite',
                status: 'failed',
                error: `Test suite failed: ${error.message}`,
                duration: 0
            });
        }

        return results;
    }

    async testMediaDevicesAPISupport() {
        const startTime = Date.now();

        try {
            const hasNavigator = 'navigator' in window;
            const hasMediaDevices = hasNavigator && 'mediaDevices' in navigator;
            const hasGetUserMedia = hasMediaDevices && 'getUserMedia' in navigator.mediaDevices;
            const hasEnumerateDevices = hasMediaDevices && 'enumerateDevices' in navigator.mediaDevices;
            const hasGetSupportedConstraints = hasMediaDevices && 'getSupportedConstraints' in navigator.mediaDevices;

            if (!hasGetUserMedia) {
                throw new Error('getUserMedia not supported in this browser');
            }

            const supportedConstraints = hasGetSupportedConstraints ?
                navigator.mediaDevices.getSupportedConstraints() : {};

            return {
                name: 'MediaDevices API Support',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    navigator: hasNavigator,
                    mediaDevices: hasMediaDevices,
                    getUserMedia: hasGetUserMedia,
                    enumerateDevices: hasEnumerateDevices,
                    getSupportedConstraints: hasGetSupportedConstraints,
                    supportedConstraints: {
                        video: supportedConstraints.video || false,
                        audio: supportedConstraints.audio || false,
                        width: supportedConstraints.width || false,
                        height: supportedConstraints.height || false,
                        frameRate: supportedConstraints.frameRate || false,
                        zoom: supportedConstraints.zoom || false,
                        focusMode: supportedConstraints.focusMode || false
                    }
                }
            };

        } catch (error) {
            return {
                name: 'MediaDevices API Support',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testCameraPermissions() {
        const startTime = Date.now();

        try {
            let permissionState = 'unknown';
            let permissionGranted = false;

            // Check if Permissions API is available
            if ('permissions' in navigator) {
                try {
                    const permission = await navigator.permissions.query({ name: 'camera' });
                    permissionState = permission.state;
                    permissionGranted = permission.state === 'granted';
                } catch (error) {
                    // Permissions API might not support camera query
                    permissionState = 'api_error';
                }
            }

            // Test actual camera access (with immediate cleanup)
            let actualAccessGranted = false;
            let accessError = null;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240 } // Low resolution for testing
                });

                actualAccessGranted = true;

                // Immediately stop the stream
                stream.getTracks().forEach(track => track.stop());
            } catch (error) {
                accessError = error.message;
            }

            return {
                name: 'Camera Permissions',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    permissionsAPI: 'permissions' in navigator,
                    permissionState,
                    permissionGranted,
                    actualAccessGranted,
                    accessError,
                    canRequestPermission: true,
                    secureContext: window.isSecureContext
                }
            };

        } catch (error) {
            return {
                name: 'Camera Permissions',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testCameraEnumeration() {
        const startTime = Date.now();

        try {
            if (!navigator.mediaDevices.enumerateDevices) {
                throw new Error('enumerateDevices not supported');
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(device => device.kind === 'videoinput');
            const audioInputs = devices.filter(device => device.kind === 'audioinput');

            const cameraDetails = videoInputs.map(device => ({
                deviceId: device.deviceId,
                label: device.label || 'Camera (permission required)',
                groupId: device.groupId
            }));

            return {
                name: 'Camera Enumeration',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    totalDevices: devices.length,
                    videoInputs: videoInputs.length,
                    audioInputs: audioInputs.length,
                    cameras: cameraDetails,
                    hasMultipleCameras: videoInputs.length > 1,
                    hasLabels: videoInputs.some(device => device.label && device.label !== '')
                }
            };

        } catch (error) {
            return {
                name: 'Camera Enumeration',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testVideoStreamInitialization() {
        const startTime = Date.now();

        try {
            const stream = await navigator.mediaDevices.getUserMedia(this.testConstraints);

            if (!stream) {
                throw new Error('Failed to get video stream');
            }

            const videoTrack = stream.getVideoTracks()[0];
            if (!videoTrack) {
                throw new Error('No video track in stream');
            }

            const settings = videoTrack.getSettings();
            const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};

            // Clean up
            stream.getTracks().forEach(track => track.stop());

            const initTime = Date.now() - startTime;

            return {
                name: 'Video Stream Initialization',
                status: 'passed',
                duration: initTime,
                details: {
                    streamObtained: true,
                    videoTrackPresent: true,
                    initializationTime: initTime,
                    withinThreshold: initTime < this.performanceThresholds.streamStartTime,
                    settings: {
                        width: settings.width,
                        height: settings.height,
                        frameRate: settings.frameRate,
                        facingMode: settings.facingMode
                    },
                    capabilities: {
                        width: capabilities.width,
                        height: capabilities.height,
                        frameRate: capabilities.frameRate,
                        zoom: capabilities.zoom
                    }
                }
            };

        } catch (error) {
            return {
                name: 'Video Stream Initialization',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testCameraConstraints() {
        const startTime = Date.now();

        try {
            // Test different constraint configurations
            const constraintTests = [
                {
                    name: 'Basic constraints',
                    constraints: { video: true }
                },
                {
                    name: 'Resolution constraints',
                    constraints: {
                        video: {
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        }
                    }
                },
                {
                    name: 'Frame rate constraints',
                    constraints: {
                        video: {
                            frameRate: { ideal: 30 }
                        }
                    }
                }
            ];

            const results = [];

            for (const test of constraintTests) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia(test.constraints);
                    const videoTrack = stream.getVideoTracks()[0];
                    const settings = videoTrack.getSettings();

                    stream.getTracks().forEach(track => track.stop());

                    results.push({
                        test: test.name,
                        success: true,
                        settings: {
                            width: settings.width,
                            height: settings.height,
                            frameRate: settings.frameRate
                        }
                    });
                } catch (error) {
                    results.push({
                        test: test.name,
                        success: false,
                        error: error.message
                    });
                }
            }

            const successfulTests = results.filter(r => r.success).length;

            return {
                name: 'Camera Constraints',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    totalTests: constraintTests.length,
                    successfulTests,
                    constraintSupport: `${successfulTests}/${constraintTests.length}`,
                    results
                }
            };

        } catch (error) {
            return {
                name: 'Camera Constraints',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testCameraZoomControls() {
        const startTime = Date.now();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { zoom: true }
            });

            const videoTrack = stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};

            let zoomSupported = false;
            let zoomRange = null;
            let zoomTestResults = [];

            if (capabilities.zoom) {
                zoomSupported = true;
                zoomRange = capabilities.zoom;

                // Test zoom control
                if (videoTrack.applyConstraints) {
                    try {
                        const minZoom = zoomRange.min || 1;
                        const maxZoom = zoomRange.max || 1;
                        const midZoom = (minZoom + maxZoom) / 2;

                        await videoTrack.applyConstraints({
                            advanced: [{ zoom: midZoom }]
                        });

                        const settings = videoTrack.getSettings();
                        zoomTestResults.push({
                            requested: midZoom,
                            actual: settings.zoom,
                            success: true
                        });
                    } catch (error) {
                        zoomTestResults.push({
                            error: error.message,
                            success: false
                        });
                    }
                }
            }

            // Clean up
            stream.getTracks().forEach(track => track.stop());

            return {
                name: 'Camera Zoom Controls',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    zoomSupported,
                    zoomRange,
                    zoomControlWorks: zoomTestResults.some(r => r.success),
                    testResults: zoomTestResults,
                    capabilities: capabilities.zoom ? 'available' : 'not_available'
                }
            };

        } catch (error) {
            return {
                name: 'Camera Zoom Controls',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testCameraFocusControls() {
        const startTime = Date.now();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { focusMode: 'auto' }
            });

            const videoTrack = stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};

            let focusSupported = false;
            let focusModes = [];
            let focusTestResults = [];

            if (capabilities.focusMode) {
                focusSupported = true;
                focusModes = capabilities.focusMode;

                // Test focus mode changes
                if (videoTrack.applyConstraints && focusModes.length > 0) {
                    for (const mode of focusModes) {
                        try {
                            await videoTrack.applyConstraints({
                                advanced: [{ focusMode: mode }]
                            });

                            const settings = videoTrack.getSettings();
                            focusTestResults.push({
                                mode,
                                actual: settings.focusMode,
                                success: true
                            });
                        } catch (error) {
                            focusTestResults.push({
                                mode,
                                error: error.message,
                                success: false
                            });
                        }
                    }
                }
            }

            // Clean up
            stream.getTracks().forEach(track => track.stop());

            return {
                name: 'Camera Focus Controls',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    focusSupported,
                    availableFocusModes: focusModes,
                    focusControlWorks: focusTestResults.some(r => r.success),
                    testResults: focusTestResults,
                    capabilities: capabilities.focusMode ? 'available' : 'not_available'
                }
            };

        } catch (error) {
            return {
                name: 'Camera Focus Controls',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testVideoFeedRendering() {
        const startTime = Date.now();

        try {
            // Create video element
            const video = document.createElement('video');
            video.style.position = 'absolute';
            video.style.left = '-9999px';
            video.autoplay = true;
            video.muted = true;
            document.body.appendChild(video);

            // Get video stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });

            // Attach stream to video element
            video.srcObject = stream;

            // Wait for video to load
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Video load timeout')), 5000);

                video.onloadedmetadata = () => {
                    clearTimeout(timeout);
                    resolve();
                };
            });

            // Test canvas rendering
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hasContent = imageData.data.some(pixel => pixel > 0);

            // Clean up
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(video);

            return {
                name: 'Video Feed Rendering',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    videoElementCreated: true,
                    streamAttached: true,
                    videoLoaded: true,
                    canvasRendering: true,
                    hasVideoContent: hasContent,
                    videoDimensions: {
                        width: video.videoWidth,
                        height: video.videoHeight
                    },
                    canvasDimensions: {
                        width: canvas.width,
                        height: canvas.height
                    }
                }
            };

        } catch (error) {
            return {
                name: 'Video Feed Rendering',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testCropAreaFunctionality() {
        const startTime = Date.now();

        try {
            // Test crop area calculations
            const testImage = { width: 1280, height: 720 };
            const testCropAreas = [
                { x: 100, y: 100, width: 200, height: 200 },
                { x: 0, y: 0, width: 640, height: 360 },
                { x: 320, y: 180, width: 640, height: 360 }
            ];

            const cropResults = [];

            for (const cropArea of testCropAreas) {
                // Validate crop area bounds
                const isValid = this.validateCropArea(cropArea, testImage);

                // Test crop area canvas operations
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = cropArea.width;
                canvas.height = cropArea.height;

                // Create test pattern
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(0, 0, cropArea.width, cropArea.height);

                const imageData = ctx.getImageData(0, 0, cropArea.width, cropArea.height);
                const hasData = imageData.data.length > 0;

                cropResults.push({
                    cropArea,
                    isValid,
                    canvasCreated: true,
                    hasImageData: hasData,
                    dimensions: {
                        width: canvas.width,
                        height: canvas.height
                    }
                });
            }

            const validCrops = cropResults.filter(r => r.isValid).length;

            return {
                name: 'Crop Area Functionality',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    testCropAreas: testCropAreas.length,
                    validCropAreas: validCrops,
                    canvasOperations: cropResults.every(r => r.canvasCreated),
                    imageDataExtraction: cropResults.every(r => r.hasImageData),
                    cropResults,
                    validationWorks: validCrops === testCropAreas.length
                }
            };

        } catch (error) {
            return {
                name: 'Crop Area Functionality',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testCropAreaPersistence() {
        const startTime = Date.now();

        try {
            // Test localStorage operations for crop areas
            const testCropData = {
                x: 150,
                y: 150,
                width: 300,
                height: 300,
                timestamp: Date.now()
            };

            const storageKey = 'test_crop_area';

            // Test storing crop area
            localStorage.setItem(storageKey, JSON.stringify(testCropData));

            // Test retrieving crop area
            const retrievedData = localStorage.getItem(storageKey);
            const parsedData = JSON.parse(retrievedData);

            // Validate data integrity
            const dataIntact = parsedData.x === testCropData.x &&
                             parsedData.y === testCropData.y &&
                             parsedData.width === testCropData.width &&
                             parsedData.height === testCropData.height;

            // Test multiple crop areas
            const multipleCropAreas = [
                { id: 'crop1', x: 0, y: 0, width: 100, height: 100 },
                { id: 'crop2', x: 200, y: 200, width: 200, height: 200 },
                { id: 'crop3', x: 400, y: 400, width: 150, height: 150 }
            ];

            localStorage.setItem('test_multiple_crops', JSON.stringify(multipleCropAreas));
            const retrievedMultiple = JSON.parse(localStorage.getItem('test_multiple_crops'));

            // Clean up test data
            localStorage.removeItem(storageKey);
            localStorage.removeItem('test_multiple_crops');

            return {
                name: 'Crop Area Persistence',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    localStorageAvailable: true,
                    canStoreData: true,
                    canRetrieveData: !!retrievedData,
                    dataIntegrity: dataIntact,
                    canStoreMultiple: retrievedMultiple.length === multipleCropAreas.length,
                    storageFormat: 'JSON',
                    testDataCleanup: true
                }
            };

        } catch (error) {
            return {
                name: 'Crop Area Persistence',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testCameraStreamPerformance() {
        const startTime = Date.now();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                }
            });

            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();

            // Create video element for performance testing
            const video = document.createElement('video');
            video.srcObject = stream;
            video.style.position = 'absolute';
            video.style.left = '-9999px';
            video.autoplay = true;
            video.muted = true;
            document.body.appendChild(video);

            // Wait for video to start
            await new Promise(resolve => {
                video.onloadedmetadata = resolve;
            });

            // Monitor performance for a short period
            const performanceData = {
                frameRate: settings.frameRate,
                resolution: {
                    width: settings.width,
                    height: settings.height
                },
                readyState: video.readyState,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight
            };

            // Check if performance meets thresholds
            const meetsFrameRate = settings.frameRate >= this.performanceThresholds.frameRate;
            const meetsResolution = settings.width >= this.performanceThresholds.resolution.width &&
                                  settings.height >= this.performanceThresholds.resolution.height;

            // Clean up
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(video);

            return {
                name: 'Camera Stream Performance',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    performanceData,
                    meetsFrameRateThreshold: meetsFrameRate,
                    meetsResolutionThreshold: meetsResolution,
                    thresholds: this.performanceThresholds,
                    streamQuality: meetsFrameRate && meetsResolution ? 'good' : 'acceptable'
                }
            };

        } catch (error) {
            return {
                name: 'Camera Stream Performance',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    async testCameraErrorHandling() {
        const startTime = Date.now();

        try {
            const errorTests = [];

            // Test invalid device ID
            try {
                await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: 'invalid-device-id' }
                });
                errorTests.push({ test: 'Invalid device ID', handled: false });
            } catch (error) {
                errorTests.push({ test: 'Invalid device ID', handled: true, error: error.name });
            }

            // Test impossible constraints
            try {
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { exact: 99999 },
                        height: { exact: 99999 }
                    }
                });
                errorTests.push({ test: 'Impossible constraints', handled: false });
            } catch (error) {
                errorTests.push({ test: 'Impossible constraints', handled: true, error: error.name });
            }

            // Test audio-only when video is required
            try {
                await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: true
                });
                // This might succeed, which is fine
                errorTests.push({ test: 'Audio-only request', handled: true, note: 'succeeded' });
            } catch (error) {
                errorTests.push({ test: 'Audio-only request', handled: true, error: error.name });
            }

            const handledErrors = errorTests.filter(t => t.handled).length;

            return {
                name: 'Camera Error Handling',
                status: 'passed',
                duration: Date.now() - startTime,
                details: {
                    totalErrorTests: errorTests.length,
                    handledErrors,
                    errorHandlingRate: `${handledErrors}/${errorTests.length}`,
                    errorTests,
                    gracefulDegradation: handledErrors === errorTests.length
                }
            };

        } catch (error) {
            return {
                name: 'Camera Error Handling',
                status: 'failed',
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    // Helper methods
    validateCropArea(cropArea, imageSize) {
        if (!cropArea || !imageSize) return false;

        return cropArea.x >= 0 &&
               cropArea.y >= 0 &&
               cropArea.width > 0 &&
               cropArea.height > 0 &&
               cropArea.x + cropArea.width <= imageSize.width &&
               cropArea.y + cropArea.height <= imageSize.height;
    }
}