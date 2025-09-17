export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        performance: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        alert: "readonly",
        confirm: "readonly",
        prompt: "readonly",
        self: "readonly",
        importScripts: "readonly",
        postMessage: "readonly",
        addEventListener: "readonly",
        removeEventListener: "readonly",
        Worker: "readonly",
        AudioContext: "readonly",
        webkitAudioContext: "readonly",
        SpeechSynthesisUtterance: "readonly",
        speechSynthesis: "readonly",
        SpeechRecognition: "readonly",
        webkitSpeechRecognition: "readonly",
        MediaDevices: "readonly",
        MediaStream: "readonly",
        MediaStreamTrack: "readonly",
        ImageData: "readonly",
        CanvasRenderingContext2D: "readonly",
        HTMLCanvasElement: "readonly",
        HTMLVideoElement: "readonly",
        HTMLImageElement: "readonly",
        Tesseract: "readonly",
        DiscordSDK: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": "off",
      "no-debugger": "warn",
      "prefer-const": "warn",
      "no-var": "error",
      "eqeqeq": "warn",
      "curly": "warn",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "no-multiple-empty-lines": ["warn", { "max": 2 }],
      "semi": ["warn", "always"],
      "quotes": ["warn", "single", { "allowTemplateLiterals": true }],
      "indent": ["warn", 4, { "SwitchCase": 1 }],
      "comma-dangle": ["warn", "never"],
      "object-curly-spacing": ["warn", "always"],
      "array-bracket-spacing": ["warn", "never"],
      "space-before-function-paren": ["warn", "never"],
      "keyword-spacing": "warn",
      "space-infix-ops": "warn"
    }
  },
  {
    files: ["**/*.worker.js"],
    languageOptions: {
      globals: {
        self: "readonly",
        importScripts: "readonly",
        postMessage: "readonly",
        addEventListener: "readonly",
        removeEventListener: "readonly",
        console: "readonly",
        performance: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly"
      }
    }
  },
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "*.min.js",
      "test-*.js",
      "*.cjs"
    ]
  }
];