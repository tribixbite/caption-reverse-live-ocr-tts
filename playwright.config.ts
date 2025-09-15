import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Gaming-specific permissions
    permissions: ['camera', 'microphone'],

    // Fake media for consistent testing
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--enable-gpu',
        '--enable-hardware-acceleration'
      ]
    }
  },

  projects: [
    {
      name: 'gaming-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        permissions: ['camera', 'microphone'],
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--enable-gpu',
            '--enable-hardware-acceleration',
            '--enable-features=VaapiVideoDecoder'
          ]
        }
      },
    },

    {
      name: 'gaming-firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
        permissions: ['camera', 'microphone']
      },
    },

    {
      name: 'gaming-safari',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
        permissions: ['camera', 'microphone']
      },
    },

    // Mobile gaming devices
    {
      name: 'mobile-gaming',
      use: {
        ...devices['iPhone 13 Pro'],
        permissions: ['camera', 'microphone']
      },
    },

    {
      name: 'tablet-gaming',
      use: {
        ...devices['iPad Pro'],
        permissions: ['camera', 'microphone']
      },
    },

    // Steam Deck simulation
    {
      name: 'steam-deck',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        permissions: ['camera', 'microphone'],
        hasTouch: true
      },
    }
  ],

  webServer: {
    command: 'python3 -m http.server 3000',
    port: 3000,
    cwd: '/data/data/com.termux/files/home/git/captn-reverse-web'
  },
});