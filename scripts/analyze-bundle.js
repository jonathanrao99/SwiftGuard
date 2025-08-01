#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Bundle analyzer for SwiftGuard
 * Identifies large dependencies and optimization opportunities
 */

const BUNDLE_DIR = path.join(__dirname, '../dist/_expo/static/js');

/**
 * Analyze bundle size and dependencies
 */
function analyzeBundle() {
  console.log('🔍 Analyzing bundle size...\n');
  
  if (!fs.existsSync(BUNDLE_DIR)) {
    console.log('❌ Bundle directory not found. Run "eas update" first to generate bundles.');
    return;
  }
  
  const platforms = ['ios', 'android'];
  
  platforms.forEach(platform => {
    const bundlePath = path.join(BUNDLE_DIR, platform);
    if (fs.existsSync(bundlePath)) {
      const files = fs.readdirSync(bundlePath);
      const bundleFile = files.find(file => file.endsWith('.hbc'));
      
      if (bundleFile) {
        const fullPath = path.join(bundlePath, bundleFile);
        const stats = fs.statSync(fullPath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`📱 ${platform.toUpperCase()}: ${sizeInMB}MB`);
        
        if (stats.size > 5 * 1024 * 1024) { // 5MB
          console.log(`⚠️  Bundle is large (${sizeInMB}MB). Consider optimization.`);
        }
      }
    }
  });
}

/**
 * Analyze dependencies for size optimization
 */
function analyzeDependencies() {
  console.log('\n📦 Analyzing dependencies...\n');
  
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Large dependencies to watch out for
  const largeDeps = [
    'lottie-react-native',
    'react-native-reanimated',
    '@stripe/stripe-react-native',
    'react-native-calendars',
    'react-native-dropdown-picker',
    'react-native-super-grid',
    'react-native-skeleton-placeholder',
    'react-native-tab-view',
    'react-native-toast-message',
    'sonner-native',
    'tailwindcss',
    'tailwindcss-animate'
  ];
  
  const foundLargeDeps = largeDeps.filter(dep => dependencies[dep]);
  
  if (foundLargeDeps.length > 0) {
    console.log('⚠️  Large dependencies detected:');
    foundLargeDeps.forEach(dep => {
      console.log(`   - ${dep}`);
    });
    console.log('\n💡 Consider lazy loading or alternatives for these dependencies.');
  } else {
    console.log('✅ No large dependencies detected.');
  }
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations() {
  console.log('\n💡 Bundle Optimization Recommendations:\n');
  
  const recommendations = [
    '1. Enable code splitting for large components',
    '2. Lazy load non-critical screens and components',
    '3. Optimize Lottie animations (use optimized versions)',
    '4. Remove unused dependencies',
    '5. Use dynamic imports for heavy libraries',
    '6. Optimize images and assets',
    '7. Enable Hermes engine (if not already)',
    '8. Use tree shaking for unused code'
  ];
  
  recommendations.forEach(rec => console.log(rec));
}

/**
 * Create bundle optimization script
 */
function createOptimizationScript() {
  const scriptPath = path.join(__dirname, 'optimize-bundle.js');
  
  const script = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Bundle optimization script
 */

function optimizeBundle() {
  console.log('🚀 Starting bundle optimization...');
  
  // Add your optimization logic here
  console.log('✅ Bundle optimization complete!');
}

if (require.main === module) {
  optimizeBundle();
}
`;

  fs.writeFileSync(scriptPath, script);
  console.log('\n📝 Created optimization script: scripts/optimize-bundle.js');
}

/**
 * Main analysis function
 */
function main() {
  console.log('🔍 SwiftGuard Bundle Analyzer\n');
  
  analyzeBundle();
  analyzeDependencies();
  generateRecommendations();
  createOptimizationScript();
  
  console.log('\n✅ Analysis complete!');
}

// Run analysis if script is executed directly
if (require.main === module) {
  main();
}

module.exports = { analyzeBundle, analyzeDependencies, generateRecommendations }; 