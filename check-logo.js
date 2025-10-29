// Run this in browser console (F12 -> Console tab)
console.log('🔍 Checking rendered HTML...');

// Find all logo-related elements
const header = document.querySelector('header');
if (header) {
  console.log('📍 Header found:', header);
  
  // Check for Logo component
  const logoImg = header.querySelector('img[alt*="Logo"]');
  if (logoImg) {
    console.log('✅ Logo img found:', logoImg);
    console.log('   src:', logoImg.src);
    console.log('   width:', logoImg.width);
    console.log('   height:', logoImg.height);
    console.log('   visible:', logoImg.offsetWidth > 0);
  } else {
    console.log('❌ No logo img found in header!');
  }
  
  // Check for SVG icons
  const svgIcons = header.querySelectorAll('svg');
  if (svgIcons.length > 0) {
    console.warn('⚠️ Found SVG icons in header:', svgIcons.length);
    svgIcons.forEach((svg, i) => {
      console.log(`   SVG ${i + 1}:`, svg);
    });
  }
  
  // Check parent div
  const logoContainer = header.querySelector('.flex.items-center.space-x-3');
  if (logoContainer) {
    console.log('📍 Logo container found:', logoContainer);
    console.log('   children:', logoContainer.children.length);
    Array.from(logoContainer.children).forEach((child, i) => {
      console.log(`   Child ${i + 1}:`, child.tagName, child.className);
    });
  }
} else {
  console.error('❌ Header not found!');
}

// Check React root
const root = document.getElementById('root');
if (root) {
  const hasLogo = root.innerHTML.includes('logo.jpg') || root.innerHTML.includes('Logo');
  console.log('✅ Found "Logo" in root HTML:', hasLogo);
}
