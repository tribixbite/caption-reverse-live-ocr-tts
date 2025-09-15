/**
 * Service Worker for CaptnReverse Gaming Companion PWA
 * Provides offline functionality and caching for gaming scenarios
 */

const CACHE_NAME = 'captn-reverse-gaming-v2.1.0';
const STATIC_CACHE = 'captn-reverse-static-v2.1.0';

// Files to cache for offline gaming companion use
const CORE_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',

  // JavaScript modules
  '/js/app.js',
  '/js/config.js',
  '/js/camera.js',
  '/js/ocr.js',
  '/js/speech.js',
  '/js/ui.js',
  '/js/settings.js',
  '/js/debug.js',
  '/js/performance.js',
  '/js/hotkeys.js',
  '/js/history.js',
  '/js/multimonitor.js',
  '/js/voice-commands.js',
  '/js/preprocessing.worker.js',

  // External dependencies
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/tesseract.js@6.0.0/dist/tesseract.min.js',

  // Test images for calibration
  '/tests/test2.png'
];

// Optional gaming assets (cache if available)
const GAMING_ASSETS = [
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache core files
self.addEventListener('install', (event) => {
  console.log('🎮 Service Worker: Installing gaming companion...');

  event.waitUntil(
    Promise.all([
      // Cache core files
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Caching core gaming companion files...');
        return cache.addAll(CORE_FILES);
      }),

      // Cache gaming assets (optional)
      caches.open(CACHE_NAME).then(cache => {
        console.log('🎨 Caching gaming assets...');
        return Promise.allSettled(
          GAMING_ASSETS.map(asset => cache.add(asset))
        );
      })
    ]).then(() => {
      console.log('✅ Gaming companion cached for offline use');
      self.skipWaiting(); // Activate immediately
    }).catch(error => {
      console.error('❌ Gaming companion caching failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating gaming companion...');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('🧹 Cleaning up old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Gaming companion activated');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other protocol requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Gaming-optimized caching strategy
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        console.log('📦 Serving from cache:', url.pathname);
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request).then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone response for caching
        const responseToCache = response.clone();

        // Cache for future use
        caches.open(CACHE_NAME).then(cache => {
          console.log('💾 Caching new resource:', url.pathname);
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(error => {
        console.error('❌ Network fetch failed:', error);

        // Try to serve a cached fallback for HTML requests
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/');
        }

        throw error;
      });
    })
  );
});

// Background sync for gaming session data
self.addEventListener('sync', (event) => {
  if (event.tag === 'gaming-session-sync') {
    console.log('🎮 Syncing gaming session data...');
    event.waitUntil(syncGamingSessionData());
  }
});

// Sync gaming session data
async function syncGamingSessionData() {
  try {
    // Get gaming session data from IndexedDB or localStorage
    const clients = await self.clients.matchAll();

    for (const client of clients) {
      client.postMessage({
        type: 'sync-gaming-session',
        timestamp: Date.now()
      });
    }

    console.log('✅ Gaming session sync completed');
  } catch (error) {
    console.error('❌ Gaming session sync failed:', error);
  }
}

// Handle messages from main application
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'skip-waiting':
      self.skipWaiting();
      break;

    case 'cache-gaming-assets':
      cacheGamingAssets(data.assets);
      break;

    case 'clear-cache':
      clearAllCaches();
      break;

    case 'get-cache-status':
      getCacheStatus().then(status => {
        event.ports[0]?.postMessage(status);
      });
      break;

    default:
      console.log('Unknown service worker message:', type);
  }
});

// Cache additional gaming assets
async function cacheGamingAssets(assets) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(assets.map(asset => cache.add(asset)));
    console.log('🎨 Additional gaming assets cached');
  } catch (error) {
    console.error('❌ Failed to cache gaming assets:', error);
  }
}

// Clear all caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('🧹 All caches cleared');
  } catch (error) {
    console.error('❌ Failed to clear caches:', error);
  }
}

// Get cache status
async function getCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    const status = {
      caches: cacheNames,
      version: CACHE_NAME,
      coreFilesCached: false,
      gamingAssetsCached: false
    };

    // Check if core files are cached
    const staticCache = await caches.open(STATIC_CACHE);
    const coreFilesCheck = await Promise.all(
      CORE_FILES.map(file => staticCache.match(file))
    );
    status.coreFilesCached = coreFilesCheck.every(response => response);

    // Check gaming assets
    const gamingCache = await caches.open(CACHE_NAME);
    const gamingAssetsCheck = await Promise.all(
      GAMING_ASSETS.map(asset => gamingCache.match(asset))
    );
    status.gamingAssetsCached = gamingAssetsCheck.some(response => response);

    return status;
  } catch (error) {
    console.error('❌ Failed to get cache status:', error);
    return { error: error.message };
  }
}

console.log('🎮 CaptnReverse Gaming Companion Service Worker loaded!');