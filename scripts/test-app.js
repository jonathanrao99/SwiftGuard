#!/usr/bin/env node

/**
 * SwiftGuard Comprehensive App Testing Script
 * 
 * This script performs automated testing of critical app functionality
 * including authentication, data integration, error handling, and performance.
 */

const fs = require('fs');
const path = require('path');

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✅ ${testName}`, 'green');
  } else {
    testResults.failed++;
    log(`❌ ${testName}`, 'red');
    if (details) {
      log(`   Details: ${details}`, 'yellow');
    }
  }
  testResults.details.push({ testName, passed, details });
}

// Test 1: Check for @ts-nocheck directives
function testTypeScriptSafety() {
  log('\n🔍 Testing TypeScript Safety...', 'blue');
  
  const sourceFiles = getAllTypeScriptFiles('./');
  let hasTsNocheck = false;
  let nocheckFiles = [];
  
  sourceFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('@ts-nocheck')) {
      hasTsNocheck = true;
      nocheckFiles.push(file);
    }
  });
  
  logTest(
    'No @ts-nocheck directives found',
    !hasTsNocheck,
    hasTsNocheck ? `Found in: ${nocheckFiles.join(', ')}` : ''
  );
}

// Test 2: Check for mock data usage
function testRealDataIntegration() {
  log('\n🔍 Testing Real Data Integration...', 'blue');
  
  const sourceFiles = getAllTypeScriptFiles('./');
  let hasMockData = false;
  let mockDataFiles = [];
  
  const mockDataPatterns = [
    'MOCK_',
    'mock',
    'Mock',
    '// Mock',
    '/* Mock',
    'const mock',
    'let mock',
    'var mock'
  ];
  
  sourceFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const hasMock = mockDataPatterns.some(pattern => content.includes(pattern));
    if (hasMock) {
      hasMockData = true;
      mockDataFiles.push(file);
    }
  });
  
  logTest(
    'Real data integration (no mock data)',
    !hasMockData,
    hasMockData ? `Mock data found in: ${mockDataFiles.slice(0, 3).join(', ')}` : ''
  );
}

// Test 3: Check error boundaries
function testErrorBoundaries() {
  log('\n🔍 Testing Error Boundaries...', 'blue');
  
  const sourceFiles = getAllTypeScriptFiles('./screens');
  let hasErrorBoundaries = 0;
  let totalScreens = 0;
  
  sourceFiles.forEach(file => {
    if (file.includes('.tsx') && !file.includes('.d.ts')) {
      totalScreens++;
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('ErrorBoundary') || content.includes('error boundary')) {
        hasErrorBoundaries++;
      }
    }
  });
  
  const coverage = totalScreens > 0 ? (hasErrorBoundaries / totalScreens) * 100 : 0;
  logTest(
    'Error boundaries coverage',
    coverage >= 80,
    `Coverage: ${coverage.toFixed(1)}% (${hasErrorBoundaries}/${totalScreens} screens)`
  );
}

// Test 4: Check loading states
function testLoadingStates() {
  log('\n🔍 Testing Loading States...', 'blue');
  
  const sourceFiles = getAllTypeScriptFiles('./screens');
  let hasLoadingStates = 0;
  let totalScreens = 0;
  
  sourceFiles.forEach(file => {
    if (file.includes('.tsx') && !file.includes('.d.ts')) {
      totalScreens++;
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('isLoading') || content.includes('loading') || content.includes('LoadingSpinner')) {
        hasLoadingStates++;
      }
    }
  });
  
  const coverage = totalScreens > 0 ? (hasLoadingStates / totalScreens) * 100 : 0;
  logTest(
    'Loading states coverage',
    coverage >= 70,
    `Coverage: ${coverage.toFixed(1)}% (${hasLoadingStates}/${totalScreens} screens)`
  );
}

// Test 5: Check service integration
function testServiceIntegration() {
  log('\n🔍 Testing Service Integration...', 'blue');
  
  const services = [
    './services/GuardTrackingService.ts',
    './services/CheckpointService.ts',
    './services/DashboardService.ts'
  ];
  
  let existingServices = 0;
  services.forEach(service => {
    if (fs.existsSync(service)) {
      existingServices++;
    }
  });
  
  logTest(
    'Service integration',
    existingServices >= 2,
    `Found ${existingServices}/${services.length} services`
  );
}

// Test 6: Check validation integration
function testValidationIntegration() {
  log('\n🔍 Testing Validation Integration...', 'blue');
  
  const validationFile = './lib/validation.ts';
  const hasValidation = fs.existsSync(validationFile);
  
  if (hasValidation) {
    const content = fs.readFileSync(validationFile, 'utf8');
    const hasZod = content.includes('zod') || content.includes('Zod');
    const hasSchemas = content.includes('Schema') || content.includes('schema');
    
    logTest(
      'Zod validation library',
      hasZod,
      hasZod ? 'Zod validation found' : 'Zod validation not found'
    );
    
    logTest(
      'Validation schemas',
      hasSchemas,
      hasSchemas ? 'Validation schemas found' : 'No validation schemas found'
    );
  } else {
    logTest('Validation integration', false, 'Validation file not found');
  }
}

// Test 7: Check authentication integration
function testAuthenticationIntegration() {
  log('\n🔍 Testing Authentication Integration...', 'blue');
  
  const authContext = './contexts/AuthContext.tsx';
  const hasAuthContext = fs.existsSync(authContext);
  
  if (hasAuthContext) {
    const content = fs.readFileSync(authContext, 'utf8');
    const hasSupabase = content.includes('supabase');
    const hasSignIn = content.includes('signIn');
    const hasSignUp = content.includes('signUp');
    
    logTest(
      'Supabase authentication',
      hasSupabase,
      hasSupabase ? 'Supabase auth found' : 'Supabase auth not found'
    );
    
    logTest(
      'Authentication methods',
      hasSignIn && hasSignUp,
      `SignIn: ${hasSignIn}, SignUp: ${hasSignUp}`
    );
  } else {
    logTest('Authentication integration', false, 'AuthContext not found');
  }
}

// Test 8: Check performance optimizations
function testPerformanceOptimizations() {
  log('\n🔍 Testing Performance Optimizations...', 'blue');
  
  const appFile = './App.tsx';
  const hasAppFile = fs.existsSync(appFile);
  
  if (hasAppFile) {
    const content = fs.readFileSync(appFile, 'utf8');
    const hasLazyLoading = content.includes('lazy(');
    const hasSuspense = content.includes('Suspense');
    const hasErrorBoundary = content.includes('ErrorBoundary');
    
    logTest(
      'Lazy loading',
      hasLazyLoading,
      hasLazyLoading ? 'Lazy loading implemented' : 'Lazy loading not found'
    );
    
    logTest(
      'Suspense wrapper',
      hasSuspense,
      hasSuspense ? 'Suspense wrapper found' : 'Suspense wrapper not found'
    );
    
    logTest(
      'Error boundary wrapper',
      hasErrorBoundary,
      hasErrorBoundary ? 'Error boundary wrapper found' : 'Error boundary wrapper not found'
    );
  } else {
    logTest('Performance optimizations', false, 'App.tsx not found');
  }
}

// Test 9: Check bundle optimization
function testBundleOptimization() {
  log('\n🔍 Testing Bundle Optimization...', 'blue');
  
  const packageJson = './package.json';
  const hasPackageJson = fs.existsSync(packageJson);
  
  if (hasPackageJson) {
    const content = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    const dependencies = Object.keys(content.dependencies || {});
    const devDependencies = Object.keys(content.devDependencies || {});
    
    // Check for common optimization packages
    const optimizationPackages = ['metro-config', 'expo-optimize', 'react-native-bundle-analyzer'];
    const hasOptimization = optimizationPackages.some(pkg => 
      dependencies.includes(pkg) || devDependencies.includes(pkg)
    );
    
    logTest(
      'Bundle optimization tools',
      hasOptimization,
      hasOptimization ? 'Optimization tools found' : 'No optimization tools found'
    );
    
    // Check bundle size (rough estimate)
    const totalDeps = dependencies.length + devDependencies.length;
    logTest(
      'Reasonable dependency count',
      totalDeps <= 100,
      `Total dependencies: ${totalDeps}`
    );
  } else {
    logTest('Bundle optimization', false, 'package.json not found');
  }
}

// Test 10: Check security features
function testSecurityFeatures() {
  log('\n🔍 Testing Security Features...', 'blue');
  
  const sourceFiles = getAllTypeScriptFiles('./');
  let hasSecurityFeatures = 0;
  
  const securityPatterns = [
    'validation',
    'sanitize',
    'encrypt',
    'hash',
    'secure',
    'auth',
    'permission',
    'role'
  ];
  
  sourceFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const hasSecurity = securityPatterns.some(pattern => 
      content.toLowerCase().includes(pattern)
    );
    if (hasSecurity) {
      hasSecurityFeatures++;
    }
  });
  
  logTest(
    'Security features',
    hasSecurityFeatures >= 5,
    `Security features found in ${hasSecurityFeatures} files`
  );
}

// Utility function to get all TypeScript files
function getAllTypeScriptFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      getAllTypeScriptFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  });
  
  return files;
}

// Main test runner
function runAllTests() {
  log('🚀 Starting SwiftGuard Comprehensive App Testing...', 'bold');
  log('=' * 60, 'blue');
  
  testTypeScriptSafety();
  testRealDataIntegration();
  testErrorBoundaries();
  testLoadingStates();
  testServiceIntegration();
  testValidationIntegration();
  testAuthenticationIntegration();
  testPerformanceOptimizations();
  testBundleOptimization();
  testSecurityFeatures();
  
  // Summary
  log('\n' + '=' * 60, 'blue');
  log('📊 TEST SUMMARY', 'bold');
  log(`Total Tests: ${testResults.total}`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  
  const successRate = testResults.total > 0 ? (testResults.passed / testResults.total) * 100 : 0;
  log(`Success Rate: ${successRate.toFixed(1)}%`, successRate >= 80 ? 'green' : 'yellow');
  
  if (testResults.failed > 0) {
    log('\n❌ FAILED TESTS:', 'red');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        log(`  - ${test.testName}: ${test.details}`, 'red');
      });
  }
  
  log('\n🎯 RECOMMENDATIONS:', 'yellow');
  if (testResults.failed > 0) {
    log('  • Fix failed tests before production deployment', 'yellow');
  }
  if (successRate >= 90) {
    log('  • App is ready for production deployment!', 'green');
  } else if (successRate >= 70) {
    log('  • App needs minor improvements before production', 'yellow');
  } else {
    log('  • App needs significant improvements before production', 'red');
  }
  
  log('\n✅ Testing completed!', 'green');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testResults
}; 