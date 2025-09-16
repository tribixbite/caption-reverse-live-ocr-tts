# CaptnReverse Gaming Companion 🎮

**The Ultimate OCR & Text-to-Speech Gaming Companion**

Advanced OCR system optimized for gaming with hotkeys, voice commands, multi-monitor support, and professional-grade performance.

![Gaming Companion](https://img.shields.io/badge/Gaming-Companion-blue?style=for-the-badge&logo=gamepad)
![OCR Engine](https://img.shields.io/badge/OCR-Tesseract.js%20v6.0.0-green?style=for-the-badge)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-purple?style=for-the-badge)
![Steam Deck](https://img.shields.io/badge/Steam%20Deck-Optimized-orange?style=for-the-badge)

## 🚀 Features

### Modern Browser APIs
- **MediaDevices API**: Advanced camera access with device selection and constraints
- **Web Speech API**: Natural text-to-speech with voice customization  
- **Tesseract.js**: Client-side OCR powered by WebAssembly
- **Screen Capture API**: Optional screen sharing capabilities
- **Permissions API**: Graceful permission handling

### Elegant Design
- **Dark Mode First**: Sophisticated dark theme with glass morphism
- **Tailwind CSS**: Utility-first styling with custom design system
- **Responsive Design**: Mobile-first approach with desktop enhancements
- **Smooth Animations**: Modern transitions and micro-interactions
- **Accessibility**: Semantic HTML and keyboard navigation

### Advanced Functionality
- **Real-time OCR**: Live text recognition from camera feed
- **Intelligent Cropping**: Interactive area selection for focused scanning
- **Smart Text Detection**: Confidence-based filtering and duplicate prevention
- **Persistent Settings**: LocalStorage-based configuration
- **Multi-device Support**: Front/rear camera switching
- **Performance Optimized**: Efficient processing with WebWorkers

## 🛠️ Technical Stack

- **Runtime**: Modern ES6+ JavaScript with async/await
- **UI Framework**: Vanilla JS with reactive patterns  
- **Styling**: Tailwind CSS with custom design tokens
- **OCR Engine**: Tesseract.js v5.x with WebAssembly
- **Build Tool**: Vite (configured, fallback to simple HTTP server)
- **Testing**: Playwright (configured for when platform supports it)

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (#0ea5e9 to #0284c7)
- **Dark Theme**: Slate scale (#020617 to #f8fafc) 
- **Accent Colors**: Status indicators and interactive elements

### Typography  
- **Font**: JetBrains Mono for code-like aesthetic
- **Hierarchy**: Clear heading scales with proper contrast
- **Readability**: Optimized line heights and spacing

### Components
- **Glass Cards**: Backdrop blur effects with subtle borders
- **Gradient Buttons**: Primary actions with hover animations
- **Interactive Controls**: Custom styled form elements
- **Status Indicators**: Real-time feedback with animations

## 📱 Usage

### Initial Setup
1. Open http://localhost:3000 in your browser
2. Grant camera permission when prompted
3. Select crop area for text recognition
4. Configure TTS settings as needed

### Text Recognition
1. Click "Start Monitoring" to begin real-time OCR
2. Point camera at text you want to read
3. Adjust crop area to focus on specific regions
4. Use "Read Now" for manual text capture

### Settings
- **Auto Read**: Toggle automatic speech synthesis
- **Reading Delay**: Adjust processing frequency (500ms - 5s)
- **OCR Sensitivity**: Confidence threshold for text detection
- **Speech Rate**: TTS speed control (0.5x - 2.0x)

## 🔒 Privacy & Security

- **Local Processing**: All OCR and TTS happens in your browser
- **No Data Upload**: Text and images never leave your device
- **Secure Context**: Requires HTTPS for camera access (localhost exception)
- **Permission Based**: Explicit user consent for camera access
- **Storage Control**: Settings stored locally, user controlled

## 🌟 Browser Compatibility

### Fully Supported
- **Chrome/Edge**: 88+ (full MediaDevices and Web Speech API)
- **Firefox**: 85+ (full feature support)
- **Safari**: 14+ (iOS 14.3+, some limitations on mobile)

### Required Features
- **WebAssembly**: For Tesseract.js OCR processing
- **ES6 Modules**: Modern JavaScript features
- **MediaDevices API**: Camera access and constraints
- **Web Speech API**: Text-to-speech synthesis
- **Canvas API**: Image processing and cropping

## 🚀 Getting Started

The app is currently running on **http://localhost:3000** with a Python HTTP server.

### Quick Start
```bash
# Server is already running in background
curl http://localhost:3000  # Test connectivity
```

### Development
```bash  
# For future development with full build system:
npm run dev     # Vite dev server (when platform issues resolved)
npm run build   # Production build
npm run preview # Preview production build
```

### Testing
```bash
node test.js    # Run basic connectivity tests
# Playwright tests available when platform supports it
```

## 📋 Current Status

✅ **Server Running**: Python HTTP server on port 3000  
✅ **Modern UI**: Dark theme with glass morphism effects  
✅ **Web APIs**: Camera, OCR, TTS integration complete  
✅ **Responsive Design**: Mobile-first with desktop enhancements  
✅ **Persistence**: Settings and crop areas saved locally  
⚠️ **Testing**: Basic tests only (Playwright unsupported on Android)  

## 🔄 Watch Mode

The development server is running in watch mode. Any changes to the HTML file will be reflected immediately in the browser.

**Access the app at: http://localhost:3000**