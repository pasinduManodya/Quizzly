// PWA Test Script
// Run this in the browser console to test PWA features

console.log('🚀 Quizzly PWA Test');

// Test 1: Check if service worker is registered
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('✅ Service Worker Status:', registrations.length > 0 ? 'Registered' : 'Not Registered');
    if (registrations.length > 0) {
      console.log('📋 Service Worker Details:', registrations[0]);
    }
  });
} else {
  console.log('❌ Service Worker not supported');
}

// Test 2: Check PWA installation capability
if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('✅ PWA Installation: Supported');
} else {
  console.log('❌ PWA Installation: Not Supported');
}

// Test 3: Check if app is already installed
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('✅ App Status: Already Installed');
} else {
  console.log('📱 App Status: Not Installed (can be installed)');
}

// Test 4: Check manifest
fetch('/manifest.json')
  .then(response => response.json())
  .then(manifest => {
    console.log('✅ Manifest:', manifest);
    console.log('📱 App Name:', manifest.name);
    console.log('🎨 Theme Color:', manifest.theme_color);
    console.log('🖼️ Icons Count:', manifest.icons.length);
  })
  .catch(error => {
    console.log('❌ Manifest Error:', error);
  });

// Test 5: Check cache
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log('✅ Cache Status:', cacheNames.length > 0 ? 'Active' : 'No Cache');
    console.log('📦 Cache Names:', cacheNames);
  });
} else {
  console.log('❌ Cache API not supported');
}

// Test 6: Check online status
console.log('🌐 Online Status:', navigator.onLine ? 'Online' : 'Offline');

console.log('🎉 PWA Test Complete!');
