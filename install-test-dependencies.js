#!/usr/bin/env node

/**
 * Test Dependencies Installation Script
 * 
 * This script installs all the dependencies needed for running 
 * the family tree tests, including both backend and frontend test frameworks.
 */

const { execSync } = require('child_process');

// ANSI color codes for prettier output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Logging utility functions
function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n');
  log('═'.repeat(80), colors.cyan);
  log(`  ${message}`, colors.bright + colors.cyan);
  log('═'.repeat(80), colors.cyan);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

// Helper function to run commands
function runCommand(command, options = {}) {
  const { silent = false, ignoreError = false } = options;
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return { success: true, output };
  } catch (error) {
    if (!ignoreError) {
      logError(`Command failed: ${command}`);
      if (error.stdout) log(error.stdout);
      if (error.stderr) logError(error.stderr);
    }
    return { success: false, error };
  }
}

async function installDependencies() {
  logHeader('Installing Test Dependencies');
  
  // Backend test dependencies
  log('Installing backend test dependencies...', colors.blue);
  const backendResult = runCommand(
    'npm install --save-dev jest @types/jest supertest ts-jest',
    { ignoreError: true }
  );
  
  if (backendResult.success) {
    logSuccess('Backend test dependencies installed successfully');
  } else {
    logError('Failed to install backend test dependencies');
  }
  
  // Frontend test dependencies
  log('Installing frontend test dependencies...', colors.blue);
  const frontendResult = runCommand(
    'npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom',
    { ignoreError: true }
  );
  
  if (frontendResult.success) {
    logSuccess('Frontend test dependencies installed successfully');
  } else {
    logError('Failed to install frontend test dependencies');
  }
  
  // Setting up test configuration
  log('Setting up test configuration...', colors.blue);
  try {
    // Check if vitest.config.ts already exists
    const hasVitestConfig = runCommand('test -f vitest.config.ts', { silent: true, ignoreError: true }).success;
    
    if (!hasVitestConfig) {
      log('Creating Vitest configuration...', colors.blue);
      const vitestConfig = `
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./client/src/tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@shared': resolve(__dirname, './shared'),
    },
  },
});
`;

      // Create vitest.config.ts
      runCommand(`cat > vitest.config.ts << 'EOL'
${vitestConfig}
EOL`);
      
      logSuccess('Created Vitest configuration');
    } else {
      logSuccess('Vitest configuration already exists');
    }

    // Create test setup file
    const setupDir = './client/src/tests';
    runCommand(`mkdir -p ${setupDir}`, { silent: true, ignoreError: true });
    
    const setupContent = `
// client/src/tests/setup.ts
import '@testing-library/jest-dom';

// Mock SVG measurement functions since jsdom doesn't support them
window.SVGElement.prototype.getBBox = () => ({
  x: 0,
  y: 0,
  width: 100,
  height: 50,
  toString: () => '',
});
`;

    runCommand(`cat > ${setupDir}/setup.ts << 'EOL'
${setupContent}
EOL`);
    
    logSuccess('Created test setup file');
    
    logSuccess('Test configuration completed');
  } catch (error) {
    logError('Failed to set up test configuration');
    console.error(error);
  }
  
  // Final status
  const allSuccess = backendResult.success && frontendResult.success;
  
  logHeader('Installation Summary');
  if (allSuccess) {
    logSuccess('All test dependencies installed successfully!');
    log('\nYou can now run the family tree tests using:', colors.bright);
    log('  node run-family-tree-tests.js', colors.yellow);
  } else {
    logError('Some dependencies failed to install. Please check the errors above.');
  }
}

// Run the installation
installDependencies();