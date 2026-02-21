// PWA Service Worker Registration
export const registerServiceWorker = () => {
  // Unregister any existing service workers first to avoid conflicts
  if ('serviceWorker' in navigator) {
    // Unregister all service workers first
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        console.log('Unregistering old service worker:', registration.scope);
        registration.unregister().then((success) => {
          if (success) {
            console.log('Service worker unregistered successfully');
          }
        });
      }
    }).catch((error) => {
      console.log('Error unregistering service workers:', error);
    });
  }
  
  // Service worker is disabled - don't register new one
  // This prevents caching issues and the POST request error
  if (false && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates (without auto-reload in development)
          if (process.env.NODE_ENV !== 'development') {
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content is available, show update notification
                    if (window.confirm('New version available! Reload to update?')) {
                      window.location.reload();
                    }
                  }
                });
              }
            });
          }
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// PWA Installation utilities
export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

export const isPWAInstallable = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Offline detection
export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const addOnlineListener = (callback: () => void) => {
  window.addEventListener('online', callback);
};

export const addOfflineListener = (callback: () => void) => {
  window.addEventListener('offline', callback);
};

// Cache management
export const clearCache = async (): Promise<void> => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  }
};

export const getCacheSize = async (): Promise<number> => {
  if (!('caches' in window)) return 0;
  
  let totalSize = 0;
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
};
