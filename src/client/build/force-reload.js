// Force reload script - run this in browser console
(function() {
  console.log('🔄 Forcing cache clear...');
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
        console.log('✅ Deleted cache:', name);
      });
    });
  }
  
  // Clear service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => {
        reg.unregister();
        console.log('✅ Unregistered service worker');
      });
    });
  }
  
  // Clear storage
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ Cleared storage');
  
  console.log('🔄 Now reloading page...');
  setTimeout(() => {
    window.location.reload(true);
  }, 1000);
})();

