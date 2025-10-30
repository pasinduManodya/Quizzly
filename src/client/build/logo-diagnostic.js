// Run this in browser console (F12 -> Console tab)
console.log('🔍 Logo Diagnostic Script');
console.log('===================');

// Test 1: Check if logo file exists
fetch('/logo.jpg')
  .then(response => {
    console.log('✅ Logo file accessible:', response.status === 200);
    console.log('   Status:', response.status);
    console.log('   URL:', response.url);
    return response.blob();
  })
  .then(blob => {
    console.log('✅ Logo file size:', blob.size, 'bytes');
  })
  .catch(error => {
    console.error('❌ Logo file NOT accessible:', error);
  });

// Test 2: Check for img elements
const logoImages = document.querySelectorAll('img[src*="logo"]');
console.log('📸 Found logo images:', logoImages.length);
logoImages.forEach((img, index) => {
  console.log(`   Image ${index + 1}:`, {
    src: img.src,
    alt: img.alt,
    visible: img.offsetWidth > 0 && img.offsetHeight > 0,
    complete: img.complete,
    naturalWidth: img.naturalWidth
  });
  
  // Check if image loaded
  if (!img.complete) {
    console.warn(`   ⚠️ Image ${index + 1} not loaded yet`);
  }
  if (img.naturalWidth === 0) {
    console.error(`   ❌ Image ${index + 1} failed to load`);
  }
});

// Test 3: Check for old SVG icons
const svgIcons = document.querySelectorAll('svg[viewBox="0 0 24 24"]');
console.log('🎨 Found SVG icons:', svgIcons.length);
if (svgIcons.length > 0) {
  console.warn('   ⚠️ Old SVG icons still present - browser cache issue!');
}

// Test 4: Check service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('🔧 Service Workers:', registrations.length);
    if (registrations.length > 0) {
      console.warn('   ⚠️ Service worker active - might be caching old files!');
      console.log('   💡 Unregister in Application tab -> Service Workers');
    }
  });
}

console.log('===================');
console.log('✅ Diagnostic complete!');

