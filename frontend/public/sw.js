const CACHE_NAME = 'quizzly-v4';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  // Add other static assets that should be cached
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache installation failed:', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Don't cache API calls, POST requests, or non-GET requests
  if (url.pathname.startsWith('/api/') || 
      event.request.method !== 'GET' ||
      event.request.url.includes('logo.jpg')) {
    // Always fetch from network for API calls and POST requests
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Only cache GET requests for static assets
          if (event.request.method === 'GET') {
            // Clone the response
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache).catch((err) => {
                  console.log('Cache put failed (non-critical):', err);
                });
              });
          }
          
          return response;
        }).catch(() => {
          // If both cache and network fail, show offline page
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all old caches (including pdf-ai-study-partner-v1, quizzly-v2, quizzly-v3)
          if (cacheName !== CACHE_NAME || 
              cacheName.includes('pdf-ai-study-partner') || 
              cacheName.includes('quizzly-v2') ||
              cacheName.includes('quizzly-v3')) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Handle background sync (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('Background sync triggered')
    );
  }
});

// Handle push notifications (if needed in future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Open App',
          icon: '/icons/icon-192x192.svg'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/icon-192x192.svg'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

