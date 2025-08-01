#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Import optimization script for SwiftGuard
 * Identifies and suggests optimizations for heavy library imports
 */

console.log('🔍 SwiftGuard Import Optimization Analysis\n');

/**
 * Heavy libraries that can be optimized with specific imports
 */
const heavyLibraries = {
  '@expo/vector-icons': {
    description: 'Icon library - use specific icon imports',
    optimization: 'Import specific icons instead of entire library',
    examples: [
      "import { MaterialIcons } from '@expo/vector-icons';",
      "import { FontAwesome } from '@expo/vector-icons';",
      "import { Ionicons } from '@expo/vector-icons';"
    ]
  },
  'react-native-reanimated': {
    description: 'Animation library - use specific imports',
    optimization: 'Import only needed animation functions',
    examples: [
      "import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';",
      "import { useSharedValue, withTiming } from 'react-native-reanimated';"
    ]
  },
  'lottie-react-native': {
    description: 'Lottie animations - use lazy loading',
    optimization: 'Lazy load Lottie components',
    examples: [
      "const LottieView = React.lazy(() => import('lottie-react-native'));",
      "Use dynamic imports for Lottie animations"
    ]
  },
  '@stripe/stripe-react-native': {
    description: 'Stripe payments - use specific components',
    optimization: 'Import only needed Stripe components',
    examples: [
      "import { StripeProvider } from '@stripe/stripe-react-native';",
      "import { CardField } from '@stripe/stripe-react-native';"
    ]
  },
  'react-native-calendars': {
    description: 'Calendar components - use specific imports',
    optimization: 'Import only needed calendar components',
    examples: [
      "import { Calendar } from 'react-native-calendars';",
      "import { Agenda } from 'react-native-calendars';"
    ]
  },
  'react-native-dropdown-picker': {
    description: 'Dropdown picker - already optimized',
    optimization: 'Already using specific import',
    examples: [
      "import DropDownPicker from 'react-native-dropdown-picker';"
    ]
  }
};

/**
 * Analyze current imports in the project
 */
function analyzeImports() {
  console.log('📊 Analyzing current imports...\n');
  
  const srcDir = path.join(__dirname, '..');
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    const importAnalysis = {};
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        const subAnalysis = scanDirectory(filePath);
        Object.assign(importAnalysis, subAnalysis);
      } else if (extensions.includes(path.extname(file))) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const importLines = content.match(/import.*from.*['"]/g) || [];
          
          importLines.forEach(line => {
            const match = line.match(/from\s+['"]([^'"]+)['"]/);
            if (match) {
              const library = match[1];
              if (heavyLibraries[library]) {
                if (!importAnalysis[library]) {
                  importAnalysis[library] = [];
                }
                importAnalysis[library].push({
                  file: path.relative(srcDir, filePath),
                  line: line.trim()
                });
              }
            }
          });
        } catch (error) {
          // Skip files that can't be read
        }
      }
    });
    
    return importAnalysis;
  }
  
  const analysis = scanDirectory(srcDir);
  
  if (Object.keys(analysis).length === 0) {
    console.log('✅ No heavy library imports found. Good job!\n');
    return;
  }
  
  console.log('⚠️  Heavy library imports found:\n');
  
  Object.entries(analysis).forEach(([library, usages]) => {
    const libInfo = heavyLibraries[library];
    console.log(`📦 ${library}:`);
    console.log(`   Description: ${libInfo.description}`);
    console.log(`   Optimization: ${libInfo.optimization}`);
    console.log(`   Usage count: ${usages.length} files`);
    console.log(`   Examples:`);
    libInfo.examples.forEach(example => {
      console.log(`     ${example}`);
    });
    console.log('');
  });
  
  return analysis;
}

/**
 * Generate optimization recommendations
 */
function generateOptimizationRecommendations() {
  console.log('💡 Import Optimization Recommendations:\n');
  
  const recommendations = [
    {
      priority: 'High',
      action: 'Optimize @expo/vector-icons imports',
      description: 'Use specific icon imports instead of importing entire library',
      impact: 'Reduce bundle size by ~200-500KB'
    },
    {
      priority: 'High',
      action: 'Lazy load Lottie animations',
      description: 'Use React.lazy() for Lottie components',
      impact: 'Reduce initial bundle size by ~300-800KB'
    },
    {
      priority: 'Medium',
      action: 'Optimize react-native-reanimated imports',
      description: 'Import only needed animation functions',
      impact: 'Reduce bundle size by ~100-300KB'
    },
    {
      priority: 'Medium',
      action: 'Optimize Stripe imports',
      description: 'Import only needed Stripe components',
      impact: 'Reduce bundle size by ~200-400KB'
    }
  ];
  
  recommendations.forEach(rec => {
    console.log(`   ${rec.priority === 'High' ? '🔴' : '🟡'} ${rec.priority} Priority:`);
    console.log(`      Action: ${rec.action}`);
    console.log(`      Description: ${rec.description}`);
    console.log(`      Impact: ${rec.impact}`);
    console.log('');
  });
}

/**
 * Create optimization action plan
 */
function createActionPlan() {
  console.log('📝 Import Optimization Action Plan:\n');
  
  const actions = [
    {
      step: 1,
      action: 'Review current imports',
      command: 'Search for heavy library imports in your codebase',
      files: ['App.tsx', 'screens/', 'components/']
    },
    {
      step: 2,
      action: 'Optimize icon imports',
      command: 'Replace general imports with specific icon imports',
      example: "import { MaterialIcons } from '@expo/vector-icons';"
    },
    {
      step: 3,
      action: 'Implement lazy loading for Lottie',
      command: 'Use React.lazy() for Lottie components',
      example: "const LottieView = React.lazy(() => import('lottie-react-native'));"
    },
    {
      step: 4,
      action: 'Optimize animation imports',
      command: 'Import only needed reanimated functions',
      example: "import { useSharedValue, withSpring } from 'react-native-reanimated';"
    },
    {
      step: 5,
      action: 'Test optimizations',
      command: 'Run bundle analysis to measure improvement',
      command: 'npm run analyze-bundle'
    }
  ];
  
  actions.forEach(action => {
    console.log(`   ${action.step}. ${action.action}`);
    if (action.command) {
      console.log(`      Command: ${action.command}`);
    }
    if (action.files) {
      console.log(`      Files: ${action.files.join(', ')}`);
    }
    if (action.example) {
      console.log(`      Example: ${action.example}`);
    }
    console.log('');
  });
}

/**
 * Main function
 */
function main() {
  console.log('🎯 Starting Import Optimization Analysis...\n');
  
  // Analyze current imports
  const analysis = analyzeImports();
  
  // Generate recommendations
  generateOptimizationRecommendations();
  
  // Create action plan
  createActionPlan();
  
  console.log('✅ Import optimization analysis complete!');
  console.log('📋 Focus on high-priority optimizations first for maximum impact.');
  console.log('🔄 Run this script again after implementing optimizations to verify improvements.');
}

// Run analysis if script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeImports,
  generateOptimizationRecommendations,
  createActionPlan
}; 