#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Asset optimization script for SwiftGuard
 * Optimizes Lottie animations and other assets for better performance
 */

const ASSETS_DIR = path.join(__dirname, '../assets');
const OPTIMIZED_DIR = path.join(__dirname, '../assets/optimized');

// Create optimized directory if it doesn't exist
if (!fs.existsSync(OPTIMIZED_DIR)) {
  fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
}

/**
 * Optimize Lottie JSON by removing unnecessary properties
 */
function optimizeLottieAnimation(jsonPath) {
  try {
    const content = fs.readFileSync(jsonPath, 'utf8');
    const animation = JSON.parse(content);
    
    // Remove unnecessary properties to reduce file size
    const optimized = {
      v: animation.v, // version
      fr: animation.fr, // frameRate
      ip: animation.ip, // inPoint
      op: animation.op, // outPoint
      w: animation.w, // width
      h: animation.h, // height
      nm: animation.nm, // name
      ddd: animation.ddd, // 3D
      assets: animation.assets,
      layers: animation.layers,
      markers: animation.markers,
      chars: animation.chars,
      fonts: animation.fonts,
      // Remove metadata and other non-essential properties
    };
    
    const optimizedPath = path.join(OPTIMIZED_DIR, path.basename(jsonPath));
    fs.writeFileSync(optimizedPath, JSON.stringify(optimized));
    
    const originalSize = fs.statSync(jsonPath).size;
    const optimizedSize = fs.statSync(optimizedPath).size;
    const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ Optimized ${path.basename(jsonPath)}: ${originalSize}KB → ${optimizedSize}KB (${reduction}% reduction)`);
    
    return { originalSize, optimizedSize, reduction };
  } catch (error) {
    console.error(`❌ Failed to optimize ${jsonPath}:`, error.message);
    return null;
  }
}

/**
 * Generate asset manifest
 */
function generateAssetManifest() {
  const manifest = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    assets: {}
  };
  
  const files = fs.readdirSync(ASSETS_DIR);
  
  files.forEach(file => {
    if (file.endsWith('.json') || file.endsWith('.png') || file.endsWith('.mp4')) {
      const filePath = path.join(ASSETS_DIR, file);
      const stats = fs.statSync(filePath);
      
      manifest.assets[file] = {
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
        type: path.extname(file).substring(1)
      };
    }
  });
  
  const manifestPath = path.join(ASSETS_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('📋 Generated asset manifest');
}

/**
 * Main optimization function
 */
function optimizeAssets() {
  console.log('🚀 Starting asset optimization...\n');
  
  const files = fs.readdirSync(ASSETS_DIR);
  const lottieFiles = files.filter(file => file.endsWith('.json'));
  
  if (lottieFiles.length === 0) {
    console.log('ℹ️  No Lottie animations found to optimize');
    return;
  }
  
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  
  lottieFiles.forEach(file => {
    const filePath = path.join(ASSETS_DIR, file);
    const result = optimizeLottieAnimation(filePath);
    
    if (result) {
      totalOriginalSize += result.originalSize;
      totalOptimizedSize += result.optimizedSize;
    }
  });
  
  if (totalOriginalSize > 0) {
    const totalReduction = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
    console.log(`\n📊 Total optimization: ${(totalOriginalSize / 1024).toFixed(1)}KB → ${(totalOptimizedSize / 1024).toFixed(1)}KB (${totalReduction}% reduction)`);
  }
  
  generateAssetManifest();
  
  console.log('\n✅ Asset optimization complete!');
  console.log('💡 Replace original files with optimized versions in assets/optimized/');
}

// Run optimization if script is executed directly
if (require.main === module) {
  optimizeAssets();
}

module.exports = { optimizeAssets, optimizeLottieAnimation }; 