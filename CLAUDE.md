# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Server
- `python3 -m http.server 3000`: Start development server on port 3000 (currently running)
- `node watch.js`: Start file watcher for live reload (runs alongside server)

### Testing
- `node test.js`: Run basic connectivity and Web API compatibility tests
- `npx playwright test`: Run end-to-end tests (requires Playwright installation)
- `npx playwright test --ui`: Run tests with visual test runner

### Development Utilities
- `curl http://localhost:3000`: Test server connectivity
- Access app at: `http://localhost:3000` or `http://127.0.0.1:3000`

## Architecture

### Application Structure
This is a **single-page web application** built with vanilla JavaScript and modern Web APIs. The entire application logic is contained in `index.html` (~1500 lines) with embedded CSS and JavaScript.

### Key Technologies
- **Frontend**: Pure HTML/CSS/JavaScript (no build system)
- **Styling**: Tailwind CSS via CDN with custom dark theme and glass morphism
- **OCR Engine**: Tesseract.js v5.1.1 with WebAssembly acceleration
- **Camera**: MediaDevices API with advanced constraints (zoom, focus)
- **Text-to-Speech**: Web Speech API with voice selection
- **Development**: Python HTTP server with Node.js file watcher

### Core Application Flow
1. **Setup Phase**: Camera permission request and initial configuration
2. **Crop Selection**: Interactive area selection using Canvas API for focused text recognition
3. **Monitoring Mode**: Real-time OCR processing with configurable intervals
4. **Speech Synthesis**: Automatic or manual text-to-speech with Web Speech API

### State Management
- **Settings Persistence**: LocalStorage for user preferences (crop areas, TTS settings, monitoring intervals)
- **Camera State**: MediaStream management with device switching and constraint control
- **OCR State**: Processing status, confidence thresholds, text filtering, and duplicate prevention

### Privacy & Security
- **Client-side Processing**: All OCR and TTS operations happen entirely in browser
- **No Data Upload**: Images and recognized text never leave the user's device
- **Secure Context**: Requires HTTPS for camera access (localhost exception applies)

## Testing Strategy

### Test Files
- `test.js`: Basic connectivity and Web API support checks
- `tests/captn-reverse.spec.ts`: Comprehensive Playwright end-to-end tests
- `tests/test.ts`, `tests/optimize-ocr.ts`: Additional test utilities
- `playwright.config.ts`: Test configuration with camera permissions and fake media devices

### Test Coverage Areas
- UI responsiveness and dark theme rendering
- Camera permission handling and graceful fallbacks
- OCR processing states and confidence filtering
- Web Speech API integration and voice selection
- Settings persistence across browser sessions
- Accessibility and keyboard navigation

## Development Patterns

### File Organization
- **Single File Architecture**: All code in `index.html` for simplicity and deployment
- **Embedded Styles**: Custom CSS within `<style>` tags using Tailwind utilities and custom properties
- **Inline JavaScript**: Application logic embedded in `<script>` tags with modular function organization

### Modern Web APIs Integration
- **MediaDevices API**: Advanced camera access with constraint management
- **Canvas API**: Real-time crop overlay rendering and image processing
- **Web Speech API**: Cross-browser TTS with error handling and voice management
- **Permissions API**: Graceful permission state checking and user guidance

### Error Handling Philosophy
- **Graceful Degradation**: Fallbacks for unsupported APIs or permission denials
- **User Feedback**: Clear error messages and recovery suggestions
- **Development Logging**: Comprehensive console output for debugging

## Browser Compatibility

### Fully Supported
- Chrome/Edge 88+ (full MediaDevices and Web Speech API)
- Firefox 85+ (complete feature support)
- Safari 14+ (iOS 14.3+, with some mobile limitations)

### Required Features
- WebAssembly (for Tesseract.js OCR processing)
- ES6 Modules and modern JavaScript syntax
- MediaDevices API (camera access and advanced constraints)
- Web Speech API (text-to-speech synthesis)
- Canvas 2D Context (image processing and crop visualization)
- LocalStorage (settings persistence)

## HTTPS Requirements

### Camera Access Limitations
Modern browsers require HTTPS for camera access except for:
- `localhost` and `127.0.0.1` (development exception)
- `file://` protocol (limited functionality)

### Development vs Production
- **Development**: Uses Python HTTP server on localhost:3000
- **Production**: Requires HTTPS hosting for external access and full camera API functionality