#!/usr/bin/env node

/**
 * Family Tree Testing Script
 * 
 * This script runs comprehensive tests for the family tree rendering functionality
 * including backend data transformation, API endpoints, frontend components,
 * and end-to-end flows.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Function to check if required dependencies are installed
function checkDependencies() {
  logHeader('Checking Dependencies');
  
  // Check for Jest
  const jestResult = runCommand('npx jest --version', { silent: true, ignoreError: true });
  if (!jestResult.success) {
    logWarning('Jest is not installed. Installing required testing dependencies...');
    runCommand('npm install --save-dev jest @types/jest supertest ts-jest');
    logSuccess('Testing dependencies installed');
  } else {
    logSuccess(`Jest is installed (version ${jestResult.output.trim()})`);
  }
  
  // Check for Vitest (for frontend tests)
  const vitestResult = runCommand('npx vitest --version', { silent: true, ignoreError: true });
  if (!vitestResult.success) {
    logWarning('Vitest is not installed. Installing frontend testing dependencies...');
    runCommand('npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom');
    logSuccess('Frontend testing dependencies installed');
  } else {
    logSuccess(`Vitest is installed (version ${vitestResult.output.trim()})`);
  }
}

// Function to run backend tests
async function runBackendTests() {
  logHeader('Running Backend Tests');
  
  // Run the database transformation tests
  log('Running database transformation tests...', colors.blue);
  const dbTestResult = runCommand(
    'npx jest server/tests/hierarchical-data.test.ts --detectOpenHandles',
    { silent: true, ignoreError: true }
  );
  
  if (dbTestResult.success) {
    logSuccess('Database transformation tests passed');
  } else {
    logError('Database transformation tests failed');
  }
  
  // Run the API endpoint tests
  log('Running API endpoint tests...', colors.blue);
  const apiTestResult = runCommand(
    'npx jest server/tests/relationship-api.test.ts --detectOpenHandles',
    { silent: true, ignoreError: true }
  );
  
  if (apiTestResult.success) {
    logSuccess('API endpoint tests passed');
  } else {
    logError('API endpoint tests failed');
  }
  
  // Run end-to-end tests
  log('Running end-to-end tests...', colors.blue);
  const e2eTestResult = runCommand(
    'npx jest server/tests/end-to-end.test.ts --detectOpenHandles',
    { silent: true, ignoreError: true }
  );
  
  if (e2eTestResult.success) {
    logSuccess('End-to-end tests passed');
  } else {
    logError('End-to-end tests failed');
  }
  
  return dbTestResult.success && apiTestResult.success && e2eTestResult.success;
}

// Function to run frontend component tests
async function runFrontendTests() {
  logHeader('Running Frontend Component Tests');
  
  // Run the TreeCanvas component tests
  log('Running TreeCanvas component tests...', colors.blue);
  const canvasTestResult = runCommand(
    'npx vitest run client/src/components/family-tree/tests/TreeCanvas.test.tsx',
    { silent: true, ignoreError: true }
  );
  
  if (canvasTestResult.success) {
    logSuccess('TreeCanvas component tests passed');
  } else {
    logError('TreeCanvas component tests failed');
  }
  
  // Run the RelationshipLine component tests
  log('Running RelationshipLine component tests...', colors.blue);
  const lineTestResult = runCommand(
    'npx vitest run client/src/components/family-tree/tests/RelationshipLine.test.tsx',
    { silent: true, ignoreError: true }
  );
  
  if (lineTestResult.success) {
    logSuccess('RelationshipLine component tests passed');
  } else {
    logError('RelationshipLine component tests failed');
  }
  
  // Run the TreeNode component tests
  log('Running TreeNode component tests...', colors.blue);
  const nodeTestResult = runCommand(
    'npx vitest run client/src/components/family-tree/tests/TreeNode.test.tsx',
    { silent: true, ignoreError: true }
  );
  
  if (nodeTestResult.success) {
    logSuccess('TreeNode component tests passed');
  } else {
    logError('TreeNode component tests failed');
  }
  
  return canvasTestResult.success && lineTestResult.success && nodeTestResult.success;
}

// Generate test report
function generateTestReport(backendSuccess, frontendSuccess) {
  logHeader('Generating Test Report');
  
  const reportPath = path.join(process.cwd(), 'FAMILY_TREE_TEST_REPORT.md');
  const timestamp = new Date().toISOString();
  
  const report = `# Family Tree Rendering Test Report
  
Generated: ${new Date().toLocaleString()}

## Summary

- Backend Tests: ${backendSuccess ? '✅ PASSED' : '❌ FAILED'}
- Frontend Tests: ${frontendSuccess ? '✅ PASSED' : '❌ FAILED'}
- Overall Status: ${backendSuccess && frontendSuccess ? '✅ PASSED' : '❌ FAILED'}

## Test Components

### Backend Tests
- Database Transformation Logic: Tests the conversion of flat relationship data into hierarchical structures
- API Endpoints: Tests the relationship endpoints and visualization type handling
- End-to-End Flows: Tests the complete process of creating, updating, and retrieving family relationships

### Frontend Tests
- TreeCanvas Component: Tests the main canvas rendering different visualization types
- RelationshipLine Component: Tests the relationship line rendering with different styles
- TreeNode Component: Tests the family member node rendering and interactions

## Recommendations

${backendSuccess && frontendSuccess 
  ? '- All tests passed successfully! The family tree rendering logic is working as expected.'
  : '- Some tests have failed. Please review the test output for more details on the issues.'}
${!backendSuccess 
  ? '\n- Backend issues need to be addressed to ensure proper data transformation and API responses.'
  : ''}
${!frontendSuccess 
  ? '\n- Frontend component issues need to be addressed to ensure proper visualization rendering.'
  : ''}

## Next Steps

- Consider adding more comprehensive tests for edge cases
- Continue monitoring performance with larger family datasets
- Implement additional visualization types as needed

`;

  fs.writeFileSync(reportPath, report);
  logSuccess(`Test report generated: ${reportPath}`);
  
  return reportPath;
}

// Main test execution function
async function runAllTests() {
  try {
    logHeader('Family Tree Rendering Test Suite');
    log('Starting comprehensive tests for family tree rendering functionality...\n');
    
    // Check and install dependencies if needed
    checkDependencies();
    
    // Run backend tests
    const backendSuccess = await runBackendTests();
    
    // Run frontend component tests
    const frontendSuccess = await runFrontendTests();
    
    // Generate test report
    const reportPath = generateTestReport(backendSuccess, frontendSuccess);
    
    // Output final results
    logHeader('Test Results Summary');
    if (backendSuccess && frontendSuccess) {
      logSuccess('All tests passed successfully!');
    } else {
      logError('Some tests failed. See the test report for details.');
    }
    
    log(`\nDetailed report available at: ${reportPath}`, colors.bright);
    log('\nTesting complete.');
    
    return backendSuccess && frontendSuccess;
  } catch (error) {
    logError('Error running tests:');
    console.error(error);
    return false;
  }
}

// Run all the tests
runAllTests();