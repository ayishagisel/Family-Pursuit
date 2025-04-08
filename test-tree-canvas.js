#!/usr/bin/env node

/**
 * TreeCanvas Component Test Script
 * 
 * This script specifically tests the TreeCanvas component which is
 * the main visualization component for family trees. It verifies that
 * the recent fixes for handling relationships and type safety
 * are functioning correctly.
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

// Function to run a specific test and check for critical issues
function runSpecificTest(testFile, issuePattern = null) {
  logHeader(`Testing ${path.basename(testFile)}`);
  
  log(`Running tests for ${testFile}...`, colors.blue);
  
  const result = runCommand(
    `npx vitest run ${testFile}`,
    { silent: true, ignoreError: true }
  );
  
  if (result.success) {
    logSuccess(`Tests for ${path.basename(testFile)} passed!`);
    return { success: true };
  } else {
    logError(`Tests for ${path.basename(testFile)} failed.`);
    
    // If an issue pattern was provided, check if it appears in the output
    if (issuePattern && result.error && result.error.stdout) {
      const errorOutput = result.error.stdout.toString();
      if (errorOutput.includes(issuePattern)) {
        return { 
          success: false, 
          criticalIssue: true,
          message: `Critical issue detected: ${issuePattern}` 
        };
      }
    }
    
    return { success: false, criticalIssue: false };
  }
}

// Main function to run the TreeCanvas tests
async function runTreeCanvasTests() {
  logHeader('TreeCanvas Component Tests');
  
  const componentPath = 'client/src/components/family-tree';
  const testsDir = `${componentPath}/tests`;
  
  // First check if the test files exist
  if (!fs.existsSync(`${testsDir}/TreeCanvas.test.tsx`)) {
    logError(`Test file not found: ${testsDir}/TreeCanvas.test.tsx`);
    logWarning('Make sure to create the test file first or run the install-test-dependencies.js script.');
    return false;
  }
  
  // Run tests for the TreeCanvas component
  const canvasResult = runSpecificTest(
    `${testsDir}/TreeCanvas.test.tsx`, 
    'TypeError: Cannot read properties of undefined'
  );
  
  // Run tests for the RelationshipLine component (used by TreeCanvas)
  const lineResult = runSpecificTest(
    `${testsDir}/RelationshipLine.test.tsx`,
    'Invalid prop `type`'
  );
  
  // Run tests for the TreeNode component (used by TreeCanvas)
  const nodeResult = runSpecificTest(
    `${testsDir}/TreeNode.test.tsx`
  );
  
  // Generate test summary
  logHeader('Test Results Summary');
  
  if (canvasResult.success && lineResult.success && nodeResult.success) {
    logSuccess('All TreeCanvas component tests passed!');
    log('\nThe recent fixes for handling relationships and type safety are working correctly.');
    log('The TreeCanvas component is rendering correctly in all visualization modes.', colors.green);
    return true;
  } else {
    logError('Some tests failed. Check the test output for details.');
    
    if (canvasResult.criticalIssue) {
      logWarning('Critical issue detected in TreeCanvas: possible null/undefined access.');
    }
    
    if (lineResult.criticalIssue) {
      logWarning('Critical issue detected in RelationshipLine: invalid property types.');
    }
    
    log('\nRecommendations:', colors.bright);
    if (!canvasResult.success) {
      log('- Review the TreeCanvas component\'s handling of hierarchical data and relationships.', colors.yellow);
    }
    if (!lineResult.success) {
      log('- Check the RelationshipLine component\'s prop type validation.', colors.yellow);
    }
    if (!nodeResult.success) {
      log('- Verify the TreeNode component\'s rendering and interaction behavior.', colors.yellow);
    }
    
    return false;
  }
}

// Run the tests
runTreeCanvasTests();