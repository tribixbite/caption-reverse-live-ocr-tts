        console.log('🚀 CaptnReverse initializing...');
        
        // Application State Management
        const AppState = {
            // Core functionality state
            isMonitoring: false,
            stream: null,
            ocrWorker: null,
            lastText: '',
            cameraRequestInProgress: false,
            
            // Camera and media state
            mediaStreamTrack: null,
            cameraZoom: 1.0,
            currentCrop: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
            
            // OCR engine state
            currentOCREngine: 'tesseract', // 'tesseract' or 'paddle'
            paddleOCRLoaded: false,
            
            // Voice/TTS state
            voices: [],
            voicesLoaded: false,
            
            // User settings
            settings: {
                autoRead: true,
                speechRate: 1.0,
                sensitivity: 60, // Increased default for better quality filtering
                imageThreshold: 150,
                processingInterval: 2000,
                showDebugCanvas: true
            }
        };

        // Legacy global variables for compatibility (gradually remove these)
        let isMonitoring = AppState.isMonitoring;
        let stream = AppState.stream;
        let ocrWorker = AppState.ocrWorker;
        let currentCrop = AppState.currentCrop;
        let autoRead = AppState.settings.autoRead;
        let speechRate = AppState.settings.speechRate;
        let sensitivity = AppState.settings.sensitivity;
        let lastText = AppState.lastText;
        let cameraZoom = AppState.cameraZoom;
        let mediaStreamTrack = AppState.mediaStreamTrack;
        let imageThreshold = AppState.settings.imageThreshold;
        let currentOCREngine = AppState.currentOCREngine;
        let paddleOCRLoaded = AppState.paddleOCRLoaded;
        let showDebugCanvas = AppState.settings.showDebugCanvas;
        let processingInterval = AppState.settings.processingInterval;
        let cameraRequestInProgress = AppState.cameraRequestInProgress;
        let voices = AppState.voices;
        let voicesLoaded = AppState.voicesLoaded;

        // Logger service for debug console
        let debugLogs = [];
        const logger = {
            log: (...args) => logMessage('log', ...args),
            warn: (...args) => logMessage('warn', ...args),
            error: (...args) => logMessage('error', ...args),
            info: (...args) => logMessage('info', ...args),
        };

        function logMessage(type, ...args) {
            // Call the original console method
            console[type](...args);

            // Push to our debug array
            debugLogs.push({
                type: type,
                timestamp: new Date().toISOString(),
                message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
            });
            
            if (debugLogs.length > 200) debugLogs.shift(); // Keep last 200 logs
            updateDebugDisplay(); // This will only work if debug console is open
        }

        function updateDebugDisplay() {
            const content = document.querySelector('#debug-console > div:nth-child(2)');
            if (!content) return; // Debug console not open
            
            content.innerHTML = debugLogs.map(log => `
                <div style="margin-bottom: 4px; padding: 4px; background: ${
                    log.type === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                    log.type === 'warn' ? 'rgba(245, 158, 11, 0.1)' :
                    log.type === 'info' ? 'rgba(59, 130, 246, 0.1)' :
                    'rgba(16, 185, 129, 0.1)'
                }; border-left: 3px solid ${
                    log.type === 'error' ? '#ef4444' :
                    log.type === 'warn' ? '#f59e0b' :
                    log.type === 'info' ? '#3b82f6' :
                    '#10b981'
                }; border-radius: 4px;">
                    <span style="color: #64748b; font-size: 10px;">[${log.timestamp.split('T')[1].split('.')[0]}]</span>
                    <span style="color: ${
                        log.type === 'error' ? '#ef4444' :
                        log.type === 'warn' ? '#f59e0b' :
                        log.type === 'info' ? '#3b82f6' :
                        '#10b981'
                    }; font-weight: bold; margin: 0 8px;">${log.type.toUpperCase()}</span>
                    <span style="color: #e2e8f0;">${log.message}</span>
                </div>
            `).join('');
            content.scrollTop = content.scrollHeight;
        }

        // Load persistent settings
        function loadSettings() {
            try {
                const savedSettings = localStorage.getItem('captn-reverse-settings');
                if (savedSettings) {
                    const settings = JSON.parse(savedSettings);
                    autoRead = settings.autoRead ?? autoRead;
                    speechRate = settings.speechRate ?? speechRate;
                    sensitivity = settings.sensitivity ?? sensitivity;
                    imageThreshold = settings.imageThreshold ?? imageThreshold;
                    processingInterval = settings.processingInterval ?? processingInterval;
                    showDebugCanvas = settings.showDebugCanvas ?? showDebugCanvas;
                    currentOCREngine = settings.currentOCREngine ?? currentOCREngine;
                    console.log('💾 Loaded saved settings');
                }
            } catch (error) {
                console.warn('⚠️ Failed to load settings:', error);
            }
        }

        // Save persistent settings
        function saveSettings() {
            try {
                const settings = {
                    autoRead,
                    speechRate,
                    sensitivity,
                    imageThreshold,
                    processingInterval,
                    showDebugCanvas,
                    currentOCREngine
                };
                localStorage.setItem('captn-reverse-settings', JSON.stringify(settings));
                console.log('💾 Settings saved');
            } catch (error) {
                console.warn('⚠️ Failed to save settings:', error);
            }
        }

        // Initialize app
        async function init() {
            console.log('🔧 Initializing CaptnReverse...');
            loadSettings(); // Load saved settings first
            setupEventListeners();
            initVoices(); // Initialize voice loading
            await initOCR();
            checkSecureContext();
            console.log('✅ CaptnReverse ready!');
        }

        // Initialize voice loading with proper async handling
        function initVoices() {
            // Load voices immediately if available
            voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                voicesLoaded = true;
                console.log('🗣️ Voices loaded immediately:', voices.length);
            }

            // Set up listener for when voices become available
            speechSynthesis.addEventListener('voiceschanged', () => {
                voices = speechSynthesis.getVoices();
                voicesLoaded = true;
                console.log('🗣️ Voices loaded via voiceschanged:', voices.length);
                
                // Update voice select if settings modal is open
                const settingsModal = document.getElementById('settings-modal');
                if (settingsModal && !settingsModal.classList.contains('hidden')) {
                    populateVoiceSelect();
                }
            });
        }

        function checkSecureContext() {
            console.log('🔒 Checking secure context...', {
                isSecureContext: window.isSecureContext,
                protocol: window.location.protocol,
                hostname: window.location.hostname,
                userAgent: navigator.userAgent.substring(0, 100)
            });
            
            if (!window.isSecureContext) {
                console.warn('⚠️ Not in secure context - camera may not work');
                const setupCard = document.querySelector('#setup-screen .glass');
                if (setupCard) {
                    setupCard.innerHTML = `
                        <div class="w-20 h-20 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg class="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 class="text-2xl font-semibold mb-4 text-yellow-300">HTTPS Required</h2>
                        <p class="text-dark-300 mb-6">Camera access requires a secure connection (HTTPS) or localhost. Please access the app via HTTPS or localhost for full functionality.</p>
                        <button onclick="location.reload()" class="btn-primary w-full text-lg py-4 mb-4">
                            🔄 Reload Page
                        </button>
                        <div class="text-sm text-dark-400 space-y-1">
                            <p>💡 Current: ${window.location.protocol}//${window.location.host}</p>
                            <p>🔧 Required: HTTPS or localhost</p>
                            <p>🌐 GitHub Pages automatically uses HTTPS</p>
                        </div>
                    `;
                }
            } else {
                console.log('✅ Secure context confirmed - camera should work');
                
                // Additional permission checks
                if (!navigator.mediaDevices) {
                    console.error('❌ navigator.mediaDevices not available');
                } else if (!navigator.mediaDevices.getUserMedia) {
                    console.error('❌ getUserMedia not available');
                } else {
                    console.log('✅ getUserMedia API available');
                }
            }
        }

        function setupEventListeners() {
            console.log('🔧 Setting up event listeners with event delegation...');
            
            // Single event delegation handler for all click events
            document.body.addEventListener('click', (e) => {
                // Settings Button
                if (e.target.closest('#settings-btn')) {
                    e.preventDefault();
                    console.log('⚙️ Opening settings modal...');
                    const settingsModal = document.getElementById('settings-modal');
                    if (settingsModal) {
                        try {
                            settingsModal.classList.remove('hidden');
                            populateVoiceSelect();
                            updateSettingsModalValues();
                            updateStatus('Settings opened', 'bg-blue-400');
                        } catch (error) {
                            console.error('❌ Settings modal error:', error);
                            updateStatus('Settings error', 'bg-red-400');
                        }
                    }
                    return;
                }

                // Close Settings Button
                if (e.target.closest('#close-settings')) {
                    e.preventDefault();
                    console.log('✖️ Closing settings modal...');
                    const settingsModal = document.getElementById('settings-modal');
                    if (settingsModal) {
                        settingsModal.classList.add('hidden');
                        updateStatus('Settings closed', 'bg-green-400');
                    }
                    return;
                }

                // Camera Permission Request
                if (e.target.closest('#request-camera') || e.target.closest('#retry-camera')) {
                    e.preventDefault();
                    requestCamera();
                    return;
                }

                // Basic Camera Retry
                if (e.target.closest('#retry-basic')) {
                    e.preventDefault();
                    requestBasicCamera();
                    return;
                }

                // Monitoring Toggle
                if (e.target.closest('#monitor-toggle')) {
                    e.preventDefault();
                    toggleMonitoring();
                    return;
                }

                // Read Now Button
                if (e.target.closest('#read-now-btn')) {
                    e.preventDefault();
                    readNow();
                    return;
                }

                // Test TTS Button
                if (e.target.closest('#test-tts-btn')) {
                    e.preventDefault();
                    speak("CaptnReverse text-to-speech is working perfectly! This is a test of the speech synthesis system.");
                    return;
                }

                // Stop Speech Button
                if (e.target.closest('#stop-speech-btn')) {
                    e.preventDefault();
                    speechSynthesis.cancel();
                    document.getElementById('stop-speech-btn').classList.add('hidden');
                    updateStatus(isMonitoring ? 'Monitoring active' : 'Ready', 'bg-green-400');
                    return;
                }

                // Speak Text Button (dynamically created)
                if (e.target.closest('#speak-text-btn')) {
                    e.preventDefault();
                    const text = document.getElementById('detected-text').textContent;
                    if (text) speak(text);
                    return;
                }

                // Debug Console Button
                if (e.target.closest('#show-console')) {
                    e.preventDefault();
                    toggleDebugConsole();
                    return;
                }

                // Release Camera Button
                if (e.target.closest('#release-camera')) {
                    e.preventDefault();
                    cleanupCamera();
                    document.getElementById('main-app').classList.add('hidden');
                    document.getElementById('setup-screen').classList.remove('hidden');
                    document.getElementById('settings-modal').classList.add('hidden');
                    updateStatus('Camera released', 'bg-yellow-400');
                    return;
                }
            });

            console.log('✅ Event delegation listener added');

            // Camera zoom
            document.getElementById('camera-zoom').addEventListener('input', (e) => {
                cameraZoom = parseFloat(e.target.value);
                document.getElementById('zoom-value').textContent = cameraZoom.toFixed(1);
                applyCameraZoom();
            });

            // Camera focus
            document.getElementById('camera-focus').addEventListener('input', (e) => {
                const focusDistance = parseInt(e.target.value);
                document.getElementById('focus-value').textContent = focusDistance === 500 ? 'Auto' : focusDistance;
                applyCameraFocus(focusDistance);
            });

            // Auto focus button
            document.getElementById('focus-auto').addEventListener('click', () => {
                document.getElementById('camera-focus').value = 500;
                document.getElementById('focus-value').textContent = 'Auto';
                applyCameraFocus(500);
            });

            // Crop selector
            setupCropSelector();
            setupSettingsEventListeners();
        }

        function setupSettingsEventListeners() {
            // OCR Engine toggle
            document.getElementById('ocr-tesseract').addEventListener('click', () => switchOCREngine('tesseract'));
            document.getElementById('ocr-paddle').addEventListener('click', () => switchOCREngine('paddle'));

            // Auto-read toggle (modal)
            document.getElementById('auto-read-toggle-modal').addEventListener('click', () => {
                autoRead = !autoRead;
                updateAutoReadToggle();
                updateModalAutoReadToggle();
                saveSettings();
            });

            // Speech settings (modal)
            document.getElementById('speech-rate-modal').addEventListener('input', (e) => {
                speechRate = parseFloat(e.target.value);
                document.getElementById('rate-value-modal').textContent = speechRate;
                saveSettings();
            });

            document.getElementById('speech-volume').addEventListener('input', (e) => {
                const volume = parseInt(e.target.value);
                document.getElementById('volume-value').textContent = volume;
                // Volume will be applied in speak function
                saveSettings();
            });

            // OCR settings (modal)
            document.getElementById('sensitivity-modal').addEventListener('input', (e) => {
                sensitivity = parseInt(e.target.value);
                document.getElementById('sensitivity-value-modal').textContent = sensitivity;
                saveSettings();
            });

            document.getElementById('threshold-slider-modal').addEventListener('input', (e) => {
                imageThreshold = parseInt(e.target.value);
                document.getElementById('threshold-value-modal').textContent = imageThreshold;
                saveSettings();
            });

            document.getElementById('processing-interval').addEventListener('input', (e) => {
                processingInterval = parseInt(e.target.value);
                document.getElementById('interval-value').textContent = processingInterval;
                if (isMonitoring) {
                    stopMonitoring();
                    startMonitoring(); // Restart with new interval
                }
                saveSettings();
            });

            // Debug toggle
            document.getElementById('debug-toggle').addEventListener('click', () => {
                showDebugCanvas = !showDebugCanvas;
                updateDebugToggle();
                if (!showDebugCanvas) {
                    // Remove debug elements
                    const elements = ['debug-canvas', 'debug-label', 'debug-text'];
                    elements.forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.remove();
                    });
                }
                saveSettings();
            });

            // Release camera button
            document.getElementById('release-camera').addEventListener('click', () => {
                cleanupCamera();
                // Reset UI to setup screen
                document.getElementById('main-app').classList.add('hidden');
                document.getElementById('setup-screen').classList.remove('hidden');
                document.getElementById('settings-modal').classList.add('hidden');
                updateStatus('Camera released', 'bg-yellow-400');
            });

            // Show debug console button
            document.getElementById('show-console').addEventListener('click', () => {
                toggleDebugConsole();
            });
        }

        function updateAutoReadToggle() {
            const toggle = document.getElementById('auto-read-toggle');
            const thumb = toggle.querySelector('span');
            
            if (autoRead) {
                toggle.classList.add('bg-primary-600');
                toggle.classList.remove('bg-dark-600');
                thumb.classList.add('translate-x-6');
                thumb.classList.remove('translate-x-1');
            } else {
                toggle.classList.remove('bg-primary-600');
                toggle.classList.add('bg-dark-600');
                thumb.classList.remove('translate-x-6');
                thumb.classList.add('translate-x-1');
            }
        }

        function setupCropSelector() {
            const container = document.getElementById('camera-container');
            let isDragging = false;
            let startX = 0, startY = 0;

            container.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const rect = container.getBoundingClientRect();
                startX = (e.clientX - rect.left) / rect.width;
                startY = (e.clientY - rect.top) / rect.height;
                isDragging = true;
                
                // Hide instructions when user starts interacting
                document.getElementById('crop-instructions').style.opacity = '0';
            });

            container.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                e.preventDefault();
                
                const rect = container.getBoundingClientRect();
                const endX = (e.clientX - rect.left) / rect.width;
                const endY = (e.clientY - rect.top) / rect.height;

                currentCrop = {
                    x: Math.min(startX, endX),
                    y: Math.min(startY, endY),
                    width: Math.abs(endX - startX),
                    height: Math.abs(endY - startY)
                };

                updateCropDisplay();
            });

            container.addEventListener('mouseup', () => {
                isDragging = false;
                // Save crop to localStorage
                localStorage.setItem('captn-reverse-crop', JSON.stringify(currentCrop));
            });

            container.addEventListener('mouseleave', () => {
                isDragging = false;
            });

            // Touch support for mobile
            container.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = container.getBoundingClientRect();
                startX = (touch.clientX - rect.left) / rect.width;
                startY = (touch.clientY - rect.top) / rect.height;
                isDragging = true;
                document.getElementById('crop-instructions').style.opacity = '0';
            });

            container.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                e.preventDefault();
                
                const touch = e.touches[0];
                const rect = container.getBoundingClientRect();
                const endX = (touch.clientX - rect.left) / rect.width;
                const endY = (touch.clientY - rect.top) / rect.height;

                currentCrop = {
                    x: Math.min(startX, endX),
                    y: Math.min(startY, endY),
                    width: Math.abs(endX - startX),
                    height: Math.abs(endY - startY)
                };

                updateCropDisplay();
            });

            container.addEventListener('touchend', () => {
                isDragging = false;
                localStorage.setItem('captn-reverse-crop', JSON.stringify(currentCrop));
            });

            // Load saved crop or show default
            const savedCrop = localStorage.getItem('captn-reverse-crop');
            if (savedCrop) {
                try {
                    currentCrop = JSON.parse(savedCrop);
                } catch (e) {
                    setCrop(0.25, 0.25, 0.5, 0.5);
                }
            } else {
                setCrop(0.25, 0.25, 0.5, 0.5);
            }
        }

        function setCrop(x, y, width, height) {
            currentCrop = { x, y, width, height };
            // Hide instructions once user selects a crop area
            document.getElementById('crop-instructions').style.opacity = '0';
            localStorage.setItem('captn-reverse-crop', JSON.stringify(currentCrop));
        }

        function renderDebugCanvas(canvas) {
            // Remove any existing debug elements
            const existingCanvas = document.getElementById('debug-canvas');
            const existingLabel = document.getElementById('debug-label');
            const existingText = document.getElementById('debug-text');
            if (existingCanvas) existingCanvas.remove();
            if (existingLabel) existingLabel.remove();
            if (existingText) existingText.remove();
            
            // Create debug display - this should show ONLY the cropped area
            const debugCanvas = document.createElement('canvas');
            const debugCtx = debugCanvas.getContext('2d');
            
            // Copy the processed canvas exactly as it will be sent to OCR
            debugCanvas.width = canvas.width;
            debugCanvas.height = canvas.height;
            debugCtx.drawImage(canvas, 0, 0);
            
            debugCanvas.id = 'debug-canvas';
            debugCanvas.style.position = 'fixed';
            debugCanvas.style.top = '80px';
            debugCanvas.style.right = '10px';
            debugCanvas.style.maxWidth = '200px';
            debugCanvas.style.maxHeight = '150px';
            debugCanvas.style.border = '2px solid #0ea5e9';
            debugCanvas.style.borderRadius = '8px';
            debugCanvas.style.zIndex = '9999';
            debugCanvas.style.background = 'white';
            debugCanvas.style.imageRendering = 'pixelated'; // Show crisp pixels
            
            document.body.appendChild(debugCanvas);
            
            // Add label
            const label = document.createElement('div');
            label.id = 'debug-label';
            label.textContent = `Debug: OCR Input (${canvas.width}×${canvas.height}px)`;
            label.style.position = 'fixed';
            label.style.top = '60px';
            label.style.right = '10px';
            label.style.color = '#0ea5e9';
            label.style.fontSize = '12px';
            label.style.fontWeight = 'bold';
            label.style.zIndex = '9999';
            label.style.textShadow = '0 0 4px black';
            document.body.appendChild(label);
            
            // Add text display area for debug
            const textDisplay = document.createElement('div');
            textDisplay.id = 'debug-text';
            textDisplay.style.position = 'fixed';
            textDisplay.style.top = '250px';
            textDisplay.style.right = '10px';
            textDisplay.style.maxWidth = '200px';
            textDisplay.style.background = 'rgba(15, 23, 42, 0.9)';
            textDisplay.style.color = '#0ea5e9';
            textDisplay.style.padding = '8px';
            textDisplay.style.borderRadius = '8px';
            textDisplay.style.fontSize = '11px';
            textDisplay.style.border = '1px solid #0ea5e9';
            textDisplay.style.zIndex = '9999';
            textDisplay.textContent = 'Waiting for OCR result...';
            document.body.appendChild(textDisplay);
            
            console.log(`🔍 Debug canvas: ${canvas.width}×${canvas.height}px - this exact image goes to OCR`);
        }

        function updateDebugText(text, confidence) {
            const debugText = document.getElementById('debug-text');
            if (debugText) {
                debugText.innerHTML = `
                    <strong>OCR Result:</strong><br>
                    "${text}"<br>
                    <small>Confidence: ${Math.round(confidence)}%</small>
                `;
            }
        }

        async function initOCR() {
            try {
                console.log('🤖 Initializing OCR worker...');
                ocrWorker = await Tesseract.createWorker('eng', 1, {
                    logger: ({ status, progress }) => {
                        if (status === 'recognizing text') {
                            const progressEl = document.getElementById('ocr-progress');
                            if (progressEl) {
                                progressEl.textContent = `${Math.round(progress * 100)}%`;
                            }
                        }
                    }
                });

                await ocrWorker.setParameters({
                    tessedit_pageseg_mode: '1', // OPTIMAL: Auto with OSD - 70% confidence on test image!
                    preserve_interword_spaces: '1' // Better word spacing
                });

                console.log('✅ OCR Worker ready');
            } catch (error) {
                console.error('❌ OCR initialization failed:', error);
            }
        }

        async function requestCamera() {
            try {
                // Prevent duplicate camera requests
                if (cameraRequestInProgress) {
                    console.log('⏳ Camera request already in progress...');
                    return;
                }

                cameraRequestInProgress = true;
                console.log('📸 Requesting camera permission...');
                updateStatus('Requesting camera...', 'bg-yellow-400 animate-pulse');
                
                // Check if getUserMedia is available
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('getUserMedia not supported in this browser');
                }
                
                // Cleanup any existing stream first
                if (stream) {
                    console.log('🧹 Cleaning up existing camera stream...');
                    stream.getTracks().forEach(track => track.stop());
                    stream = null;
                    mediaStreamTrack = null;
                }
                
                // Check permission first (if supported)
                if (navigator.permissions) {
                    try {
                        const permission = await navigator.permissions.query({name: 'camera'});
                        console.log('📋 Camera permission status:', permission.state);
                    } catch (permError) {
                        console.log('⚠️ Could not query camera permission:', permError.message);
                    }
                }
                
                // Request camera permission with simplified constraints for better compatibility
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                });

                console.log('✅ Camera permission granted!');
                cameraRequestInProgress = false;
                showMainApp();

            } catch (error) {
                cameraRequestInProgress = false;
                console.error('❌ Camera access denied:', error);
                
                let errorMessage = 'Camera access is required for CaptnReverse to function.';
                let debugInfo = `Error: ${error.name} - ${error.message}`;
                
                if (error.name === 'NotAllowedError') {
                    errorMessage = 'Camera permission was denied. Please refresh and allow camera access, or check your browser settings.';
                } else if (error.name === 'NotFoundError') {
                    errorMessage = 'No camera found. Please connect a camera and try again.';
                } else if (error.name === 'NotSupportedError') {
                    errorMessage = 'Camera is not supported in this browser. Try Chrome, Edge, or Firefox.';
                } else if (error.name === 'OverconstrainedError') {
                    errorMessage = 'Camera constraints not supported. Trying with basic settings...';
                } else {
                    errorMessage = `Camera error: ${error.message}`;
                }
                
                updateStatus('Camera error', 'bg-red-400');
                
                // Update UI to show error
                const setupCard = document.querySelector('#setup-screen .glass');
                if (setupCard) {
                    setupCard.innerHTML = `
                        <div class="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 class="text-2xl font-semibold mb-4 text-red-300">Camera Access Required</h2>
                        <p class="text-dark-300 mb-6">${errorMessage}</p>
                        <button id="retry-camera" class="btn-primary w-full text-lg py-4 mb-4">
                            🔄 Try Again
                        </button>
                        <button id="retry-basic" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-xl transition-colors text-sm mb-4">
                            📱 Try Basic Camera
                        </button>
                        <details class="text-xs text-dark-400 mt-4">
                            <summary class="cursor-pointer hover:text-dark-300">Debug Info</summary>
                            <div class="mt-2 p-2 bg-dark-800 rounded font-mono">
                                <p>URL: ${window.location.href}</p>
                                <p>Secure: ${window.isSecureContext}</p>
                                <p>${debugInfo}</p>
                            </div>
                        </details>
                        <div class="text-sm text-dark-400 space-y-1 mt-4">
                            <p>💡 Make sure you're using HTTPS or localhost</p>
                            <p>🔒 Your privacy is protected - all processing is local</p>
                            <p>🌐 Works best in Chrome, Edge, or Firefox</p>
                        </div>
                    `;
                    
                    // Note: retry handlers now managed by event delegation
                }
            }
        }

        async function requestBasicCamera() {
            try {
                console.log('📱 Trying basic camera constraints...');
                updateStatus('Trying basic camera...', 'bg-yellow-400 animate-pulse');
                
                // Cleanup any existing stream first
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    stream = null;
                    mediaStreamTrack = null;
                }
                
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true // Minimal constraints
                });
                
                console.log('✅ Basic camera access granted!');
                showMainApp();
                
            } catch (basicError) {
                console.error('❌ Basic camera also failed:', basicError);
                updateStatus('Basic camera failed', 'bg-red-400');
            }
        }

        function showMainApp() {
            const video = document.getElementById('camera-feed');
            video.srcObject = stream;
            
            // Get camera track for zoom control
            mediaStreamTrack = stream.getVideoTracks()[0];
            
            // Wait for video to start playing
            video.onloadedmetadata = () => {
                console.log('📹 Video metadata loaded, starting overlay');
                startCropOverlay();
            };
            
            // Hide setup, show main app
            document.getElementById('setup-screen').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            
            updateStatus('Camera active', 'bg-green-400');
        }

        async function applyCameraZoom() {
            if (!mediaStreamTrack) return;
            
            try {
                const capabilities = mediaStreamTrack.getCapabilities();
                if (capabilities.zoom) {
                    await mediaStreamTrack.applyConstraints({
                        zoom: { ideal: cameraZoom }
                    });
                    console.log(`📷 Applied zoom: ${cameraZoom}x`);
                }
            } catch (error) {
                console.warn('⚠️ Camera zoom not supported:', error);
            }
        }

        async function applyCameraFocus(focusDistance) {
            if (!mediaStreamTrack) return;
            
            try {
                const capabilities = mediaStreamTrack.getCapabilities();
                console.log('📷 Camera capabilities:', capabilities);
                
                if (capabilities.focusDistance) {
                    const constraints = focusDistance === 500 ? 
                        { focusMode: 'auto' } : 
                        { 
                            focusMode: 'manual',
                            focusDistance: { ideal: focusDistance / 1000 } // Convert to 0-1 range
                        };
                    
                    await mediaStreamTrack.applyConstraints({ advanced: [constraints] });
                    console.log(`🎯 Applied focus: ${focusDistance === 500 ? 'auto' : focusDistance}`);
                } else {
                    console.warn('⚠️ Manual focus not supported on this camera');
                }
            } catch (error) {
                console.warn('⚠️ Focus control error:', error);
            }
        }

        function startCropOverlay() {
            const video = document.getElementById('camera-feed');
            const canvas = document.getElementById('crop-overlay');
            const ctx = canvas.getContext('2d');
            
            function drawOverlay() {
                if (video.videoWidth === 0 || video.videoHeight === 0) {
                    requestAnimationFrame(drawOverlay);
                    return;
                }
                
                // Set canvas size to match video
                const rect = video.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw semi-transparent overlay
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Clear crop area
                const x = currentCrop.x * canvas.width;
                const y = currentCrop.y * canvas.height;
                const width = currentCrop.width * canvas.width;
                const height = currentCrop.height * canvas.height;
                
                ctx.clearRect(x, y, width, height);
                
                // Draw crop border
                ctx.strokeStyle = '#0ea5e9';
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, width, height);
                
                // Draw corner handles
                const handleSize = 8;
                ctx.fillStyle = '#0ea5e9';
                ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
                ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
                ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
                ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
                
                requestAnimationFrame(drawOverlay);
            }
            
            drawOverlay();
        }

        function toggleMonitoring() {
            isMonitoring = !isMonitoring;
            const btn = document.getElementById('monitor-toggle');
            
            if (isMonitoring) {
                btn.textContent = '⏸️ Pause Monitoring';
                btn.classList.remove('bg-green-600', 'hover:bg-green-700');
                btn.classList.add('bg-red-600', 'hover:bg-red-700');
                updateStatus('Monitoring active', 'bg-green-400 animate-pulse');
                startMonitoring();
            } else {
                btn.textContent = '▶️ Start Monitoring';
                btn.classList.remove('bg-red-600', 'hover:bg-red-700');
                btn.classList.add('bg-green-600', 'hover:bg-green-700');
                updateStatus('Monitoring paused', 'bg-yellow-400');
                stopMonitoring();
            }
        }

        function startMonitoring() {
            if (!stream || !ocrWorker) return;
            
            window.monitoringInterval = setInterval(async () => {
                await processFrame();
            }, processingInterval); // Use configurable interval
        }

        function stopMonitoring() {
            if (window.monitoringInterval) {
                clearInterval(window.monitoringInterval);
                window.monitoringInterval = null;
            }
        }

        async function readNow() {
            if (!stream || !ocrWorker) return;
            await processFrame();
        }

        async function processFrame() {
            try {
                const video = document.getElementById('camera-feed');
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                if (canvas.width === 0 || canvas.height === 0) return;

                ctx.drawImage(video, 0, 0);

                // Apply crop based on video dimensions and crop area
                const cropCanvas = document.createElement('canvas');
                const cropCtx = cropCanvas.getContext('2d');
                
                // Get actual video element dimensions for proper crop calculation
                const videoEl = document.getElementById('camera-feed');
                const videoRect = videoEl.getBoundingClientRect();
                
                // Calculate crop coordinates based on video's actual dimensions
                const scaleX = canvas.width / videoRect.width;
                const scaleY = canvas.height / videoRect.height;
                
                const cropX = currentCrop.x * canvas.width;
                const cropY = currentCrop.y * canvas.height;  
                const cropWidth = currentCrop.width * canvas.width;
                const cropHeight = currentCrop.height * canvas.height;

                console.log(`🔲 Crop area: x=${Math.round(cropX)}, y=${Math.round(cropY)}, w=${Math.round(cropWidth)}, h=${Math.round(cropHeight)}`);
                console.log(`📐 Video: ${canvas.width}x${canvas.height}, Display: ${Math.round(videoRect.width)}x${Math.round(videoRect.height)}`);

                // Set crop canvas to exact crop size
                cropCanvas.width = Math.max(cropWidth, 50); // Minimum 50px width
                cropCanvas.height = Math.max(cropHeight, 50); // Minimum 50px height
                
                // Draw only the cropped portion
                cropCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropCanvas.width, cropCanvas.height);

                // OPTIMIZATION: Rescale cropCanvas for optimal OCR resolution (20-40px character height)
                const OCR_TARGET_HEIGHT = 800; // Optimal height for Tesseract.js accuracy
                if (cropCanvas.height > 0 && cropCanvas.height !== OCR_TARGET_HEIGHT) {
                    const aspectRatio = cropCanvas.width / cropCanvas.height;
                    const scaledWidth = OCR_TARGET_HEIGHT * aspectRatio;
                    
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = scaledWidth;
                    tempCanvas.height = OCR_TARGET_HEIGHT;
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    // Scale the cropped image to optimal resolution
                    tempCtx.drawImage(cropCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
                    
                    // Copy scaled image back to cropCanvas
                    cropCanvas.width = tempCanvas.width;
                    cropCanvas.height = tempCanvas.height;
                    cropCtx.drawImage(tempCanvas, 0, 0);
                    
                    console.log(`📏 Scaled crop to optimal OCR size: ${Math.round(scaledWidth)}×${OCR_TARGET_HEIGHT}px`);
                }

                // *** CRITICAL: Image preprocessing for OCR ***
                const imageData = cropCtx.getImageData(0, 0, cropCanvas.width, cropCanvas.height);
                const data = imageData.data;

                // Advanced adaptive thresholding for better OCR accuracy
                const blockSize = 32; // Size of neighborhood to consider
                const C = 5; // Constant subtracted from mean
                
                // First pass: convert to grayscale
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg;
                    data[i + 1] = avg;
                    data[i + 2] = avg;
                }
                
                // Second pass: adaptive thresholding
                for (let y = 0; y < cropCanvas.height; y++) {
                    for (let x = 0; x < cropCanvas.width; x++) {
                        let sum = 0;
                        let count = 0;
                        
                        // Calculate local mean for block around (x,y)
                        const startY = Math.max(0, y - Math.floor(blockSize / 2));
                        const endY = Math.min(cropCanvas.height, y + Math.floor(blockSize / 2));
                        const startX = Math.max(0, x - Math.floor(blockSize / 2));
                        const endX = Math.min(cropCanvas.width, x + Math.floor(blockSize / 2));
                        
                        for (let by = startY; by < endY; by++) {
                            for (let bx = startX; bx < endX; bx++) {
                                const pixelIndex = (by * cropCanvas.width + bx) * 4;
                                sum += data[pixelIndex]; // Already grayscale
                                count++;
                            }
                        }
                        
                        const localThreshold = (sum / count) - C;
                        const pixelIndex = (y * cropCanvas.width + x) * 4;
                        const pixelValue = data[pixelIndex];
                        const value = pixelValue > localThreshold ? 255 : 0;
                        
                        data[pixelIndex] = value;
                        data[pixelIndex + 1] = value;
                        data[pixelIndex + 2] = value;
                    }
                }
                
                // Apply the processed image data back to canvas
                cropCtx.putImageData(imageData, 0, 0);

                // DEBUG: Show processed crop image (if enabled)
                if (showDebugCanvas) {
                    renderDebugCanvas(cropCanvas);
                }

                // Show processing state
                document.getElementById('processing-state').classList.remove('hidden');

                const startTime = Date.now();
                const result = await ocrWorker.recognize(cropCanvas);
                const processingTime = Date.now() - startTime;

                // Hide processing state
                document.getElementById('processing-state').classList.add('hidden');

                const ocrText = result.data.text.trim();
                const ocrConfidence = result.data.confidence;
                
                console.log(`🔍 OCR Result: "${ocrText}" (confidence: ${Math.round(ocrConfidence)}%)`);
                
                // Update debug display with OCR result
                updateDebugText(ocrText, ocrConfidence);
                
                if (ocrConfidence > sensitivity) {
                    const text = result.data.text.trim();
                    if (text && text.length > 2 && text !== lastText) {
                        displayText(text, result.data.confidence, processingTime);
                        lastText = text;
                        
                        console.log(`📝 New text detected: "${text}"`);
                        
                        if (autoRead) {
                            console.log(`🔊 Auto-reading enabled, speaking text...`);
                            speak(text);
                        }
                    } else if (text === lastText) {
                        console.log(`🔄 Same text as before, skipping...`);
                    } else {
                        console.log(`📏 Text too short (${text.length} chars), skipping...`);
                    }
                } else {
                    console.log(`🎯 Confidence ${Math.round(result.data.confidence)}% below threshold ${sensitivity}%`);
                    
                    // Enhanced user feedback for low confidence OCR results
                    if (ocrConfidence < 20) {
                        updateStatus('No readable text found', 'bg-red-400');
                        updateDebugText('No clear text detected. Try adjusting lighting, focus, or crop area.', ocrConfidence);
                    } else if (ocrConfidence < sensitivity) {
                        updateStatus('Text detected but low quality', 'bg-yellow-400');
                        updateDebugText(`Text detected but confidence (${Math.round(ocrConfidence)}%) below threshold (${sensitivity}%). Consider lowering sensitivity.`, ocrConfidence);
                    }
                }
            } catch (error) {
                document.getElementById('processing-state').classList.add('hidden');
                console.error('❌ OCR processing error:', error);
            }
        }

        function displayText(text, confidence, processingTime) {
            document.getElementById('detected-text').textContent = text;
            document.getElementById('confidence-score').textContent = Math.round(confidence);
            document.getElementById('processing-time').textContent = processingTime;
            document.getElementById('text-display').classList.remove('hidden');
        }

        function speak(text) {
            if (!text || !text.trim()) return;
            
            // Cancel any current speech
            speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = speechRate;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Try to get a voice
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                // Prefer English voices
                const englishVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
                utterance.voice = englishVoice;
            }

            utterance.onstart = () => {
                console.log('🔊 Speaking:', text.substring(0, 50) + '...');
                document.getElementById('stop-speech-btn').classList.remove('hidden');
                updateStatus('Speaking...', 'bg-blue-400 animate-pulse');
            };
            
            utterance.onend = () => {
                console.log('🔇 Speech completed');
                document.getElementById('stop-speech-btn').classList.add('hidden');
                updateStatus(isMonitoring ? 'Monitoring active' : 'Ready', 'bg-green-400');
            };
            
            utterance.onerror = (event) => {
                console.error('🔇 Speech error:', event.error);
                document.getElementById('stop-speech-btn').classList.add('hidden');
                updateStatus('Speech error', 'bg-red-400');
            };

            // Ensure voices are loaded before speaking
            if (voices.length === 0) {
                speechSynthesis.addEventListener('voiceschanged', () => {
                    speechSynthesis.speak(utterance);
                }, { once: true });
            } else {
                speechSynthesis.speak(utterance);
            }
        }

        function updateStatus(text, dotClass) {
            document.getElementById('status-text').textContent = text;
            const dot = document.getElementById('status-dot');
            dot.className = `w-2 h-2 rounded-full ${dotClass}`;
        }

        async function switchOCREngine(engine) {
            console.log(`🔄 Switching to ${engine} OCR engine...`);
            currentOCREngine = engine;
            
            // Update UI
            const tesseractBtn = document.getElementById('ocr-tesseract');
            const paddleBtn = document.getElementById('ocr-paddle');
            const infoDiv = document.getElementById('ocr-engine-info');
            
            if (engine === 'tesseract') {
                tesseractBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-primary-600 text-white';
                paddleBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-dark-600 hover:bg-dark-500 text-white';
                infoDiv.innerHTML = '<p>Tesseract.js - Fast, lightweight, good for general text</p>';
                
                // Initialize Tesseract if needed
                if (!ocrWorker) {
                    await initOCR();
                }
            } else {
                tesseractBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-dark-600 hover:bg-dark-500 text-white';
                paddleBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-primary-600 text-white';
                infoDiv.innerHTML = '<p>PaddleOCR - Higher accuracy, larger download, slower processing</p>';
                
                // Load PaddleOCR dynamically
                await loadPaddleOCR();
            }
        }

        async function loadPaddleOCR() {
            if (paddleOCRLoaded) return;
            
            try {
                updateStatus('Loading PaddleOCR...', 'bg-yellow-400 animate-pulse');
                
                // Dynamically load PaddleOCR.js
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/paddleocr@1.0.0/dist/paddleocr.min.js';
                script.onload = () => {
                    console.log('✅ PaddleOCR loaded successfully');
                    paddleOCRLoaded = true;
                    updateStatus('PaddleOCR ready', 'bg-green-400');
                };
                script.onerror = () => {
                    console.error('❌ Failed to load PaddleOCR');
                    updateStatus('PaddleOCR load failed', 'bg-red-400');
                    // Fallback to Tesseract
                    switchOCREngine('tesseract');
                };
                document.head.appendChild(script);
                
            } catch (error) {
                console.error('❌ PaddleOCR loading error:', error);
                updateStatus('OCR error', 'bg-red-400');
                switchOCREngine('tesseract');
            }
        }

        function populateVoiceSelect() {
            const select = document.getElementById('voice-select');
            if (!select) {
                console.warn('⚠️ Voice select element not found');
                return;
            }
            
            // Use cached voices or get fresh ones
            const currentVoices = voicesLoaded ? voices : speechSynthesis.getVoices();
            
            if (currentVoices.length === 0) {
                console.warn('⚠️ No voices available yet');
                select.innerHTML = '<option value="">Loading voices...</option>';
                return;
            }
            
            select.innerHTML = '<option value="">Default Voice</option>';
            
            currentVoices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name} (${voice.lang})`;
                select.appendChild(option);
            });
            
            console.log(`🗣️ Populated voice select with ${currentVoices.length} voices`);
        }

        function updateModalAutoReadToggle() {
            const toggle = document.getElementById('auto-read-toggle-modal');
            const thumb = toggle.querySelector('span');
            
            if (autoRead) {
                toggle.classList.add('bg-primary-600');
                toggle.classList.remove('bg-dark-600');
                thumb.classList.add('translate-x-6');
                thumb.classList.remove('translate-x-1');
            } else {
                toggle.classList.remove('bg-primary-600');
                toggle.classList.add('bg-dark-600');
                thumb.classList.remove('translate-x-6');
                thumb.classList.add('translate-x-1');
            }
        }

        function updateDebugToggle() {
            const toggle = document.getElementById('debug-toggle');
            const thumb = toggle.querySelector('span');
            
            if (showDebugCanvas) {
                toggle.classList.add('bg-primary-600');
                toggle.classList.remove('bg-dark-600');
                thumb.classList.add('translate-x-6');
                thumb.classList.remove('translate-x-1');
            } else {
                toggle.classList.remove('bg-primary-600');
                toggle.classList.add('bg-dark-600');
                thumb.classList.remove('translate-x-6');
                thumb.classList.add('translate-x-1');
            }
        }

        function updateSettingsModalValues() {
            // Update all modal controls with current values
            document.getElementById('speech-rate-modal').value = speechRate;
            document.getElementById('rate-value-modal').textContent = speechRate;
            
            document.getElementById('sensitivity-modal').value = sensitivity;
            document.getElementById('sensitivity-value-modal').textContent = sensitivity;
            
            document.getElementById('threshold-slider-modal').value = imageThreshold;
            document.getElementById('threshold-value-modal').textContent = imageThreshold;
            
            document.getElementById('processing-interval').value = processingInterval;
            document.getElementById('interval-value').textContent = processingInterval;
            
            // Update toggles
            updateModalAutoReadToggle();
            updateDebugToggle();
            
            // Update OCR engine buttons
            const tesseractBtn = document.getElementById('ocr-tesseract');
            const paddleBtn = document.getElementById('ocr-paddle');
            if (currentOCREngine === 'tesseract') {
                tesseractBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-primary-600 text-white';
                paddleBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-dark-600 hover:bg-dark-500 text-white';
            } else {
                tesseractBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-dark-600 hover:bg-dark-500 text-white';
                paddleBtn.className = 'flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-primary-600 text-white';
            }
        }

        // Cleanup camera resources on page unload
        function cleanupCamera() {
            console.log('🧹 Cleaning up camera resources...');
            
            if (stream) {
                // Stop all tracks to release camera
                stream.getTracks().forEach(track => {
                    console.log(`🛑 Stopping track: ${track.kind} (${track.label})`);
                    track.stop();
                });
                stream = null;
                mediaStreamTrack = null;
            }

            // Stop monitoring
            if (window.monitoringInterval) {
                clearInterval(window.monitoringInterval);
                window.monitoringInterval = null;
            }

            // Cleanup OCR worker
            if (ocrWorker) {
                ocrWorker.terminate().catch(e => console.warn('OCR cleanup error:', e));
                ocrWorker = null;
            }

            console.log('✅ Camera resources cleaned up');
        }

        // Critical: Add multiple cleanup event listeners
        window.addEventListener('beforeunload', cleanupCamera);
        window.addEventListener('unload', cleanupCamera);
        window.addEventListener('pagehide', cleanupCamera);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('📱 Page hidden, cleaning up camera...');
                cleanupCamera();
            }
        });

        // Cleanup on focus loss (important for mobile)
        window.addEventListener('blur', () => {
            console.log('👁️ Window lost focus, pausing camera...');
            if (isMonitoring) {
                toggleMonitoring(); // Stop monitoring to reduce resource usage
            }
        });

        // Debug console functionality
        let debugConsole = null;
        
        function toggleDebugConsole() {
            if (debugConsole && !debugConsole.closed) {
                debugConsole.close();
                debugConsole = null;
                return;
            }
            
            createDebugConsole();
        }
        
        function createDebugConsole() {
            // Create floating debug console
            const consoleDiv = document.createElement('div');
            consoleDiv.id = 'debug-console';
            consoleDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80vw;
                max-width: 600px;
                height: 70vh;
                background: rgba(15, 23, 42, 0.95);
                border: 2px solid #0ea5e9;
                border-radius: 12px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                font-family: 'JetBrains Mono', monospace;
                backdrop-filter: blur(12px);
            `;
            
            const header = document.createElement('div');
            header.style.cssText = `
                padding: 12px 16px;
                background: #0ea5e9;
                color: white;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 10px 10px 0 0;
            `;
            header.innerHTML = `
                <span>🔍 CaptnReverse Debug Console</span>
                <button id="close-debug" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">✖️</button>
            `;
            
            const content = document.createElement('div');
            content.style.cssText = `
                flex: 1;
                padding: 16px;
                overflow-y: auto;
                background: #0f172a;
                color: #e2e8f0;
                font-size: 12px;
                line-height: 1.4;
            `;
            
            const controls = document.createElement('div');
            controls.style.cssText = `
                padding: 12px 16px;
                background: #1e293b;
                border-top: 1px solid #334155;
                display: flex;
                gap: 8px;
                border-radius: 0 0 10px 10px;
            `;
            controls.innerHTML = `
                <button id="clear-debug" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px;">Clear</button>
                <button id="export-debug" style="padding: 6px 12px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px;">Export</button>
                <button id="test-settings" style="padding: 6px 12px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px;">Test Settings</button>
            `;
            
            consoleDiv.appendChild(header);
            consoleDiv.appendChild(content);
            consoleDiv.appendChild(controls);
            document.body.appendChild(consoleDiv);
            
            // Add event listeners
            document.getElementById('close-debug').addEventListener('click', () => {
                consoleDiv.remove();
                debugConsole = null;
            });
            
            document.getElementById('clear-debug').addEventListener('click', () => {
                debugLogs = [];
                updateDebugDisplay();
            });
            
            document.getElementById('export-debug').addEventListener('click', () => {
                const data = JSON.stringify({
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    logs: debugLogs,
                    settings: {
                        autoRead, speechRate, sensitivity, imageThreshold, 
                        processingInterval, showDebugCanvas, currentOCREngine
                    }
                }, null, 2);
                
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `captn-debug-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
            });
            
            document.getElementById('test-settings').addEventListener('click', () => {
                testSettingsButton();
            });
            
            debugConsole = { closed: false };
            
            // Initial display update
            updateDebugDisplay();
        }
        
        function testSettingsButton() {
            console.log('🧪 Testing settings button functionality...');
            const settingsBtn = document.getElementById('settings-btn');
            const settingsModal = document.getElementById('settings-modal');
            
            console.log('Settings button element:', settingsBtn);
            console.log('Settings modal element:', settingsModal);
            console.log('Button click listeners:', getEventListeners ? getEventListeners(settingsBtn) : 'getEventListeners not available');
            
            if (settingsBtn) {
                console.log('✅ Settings button found');
                console.log('Button styles:', getComputedStyle(settingsBtn).display);
                console.log('Button visibility:', settingsBtn.offsetParent !== null);
                
                // Try triggering click programmatically
                console.log('🖱️ Triggering click event...');
                settingsBtn.click();
                
                setTimeout(() => {
                    const isVisible = settingsModal && !settingsModal.classList.contains('hidden');
                    console.log('Modal visible after click:', isVisible);
                }, 100);
            } else {
                console.error('❌ Settings button not found');
            }
            
            if (settingsModal) {
                console.log('✅ Settings modal found');
                console.log('Modal classes:', settingsModal.className);
                console.log('Modal styles:', getComputedStyle(settingsModal).display);
            } else {
                console.error('❌ Settings modal not found');
            }
        }

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', init);

        // Live reload for development
        if (location.hostname === 'localhost') {
            let lastModified = null;
            setInterval(async () => {
                try {
                    const response = await fetch(location.href, { method: 'HEAD' });
                    const modified = response.headers.get('Last-Modified');
                    if (lastModified && modified !== lastModified) {
                        location.reload();
                    }
                    lastModified = modified;
                } catch (error) {
                    // Ignore
                }
            }, 3000);
        }
    </script>
