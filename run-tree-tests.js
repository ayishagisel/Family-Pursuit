#!/usr/bin/env node

/**
 * Family Tree Testing Script
 * 
 * This script runs comprehensive tests for the family tree rendering functionality
 * including backend data transformation, API endpoints, frontend components,
 * and end-to-end flows.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  backendTests: [
    'server/tests/hierarchical-data.test.ts',
    'server/tests/relationship-api.test.ts',
    'server/tests/end-to-end.test.ts',
  ],
  frontendTests: [
    'client/src/components/family-tree/tests/TreeCanvas.test.tsx',
    'client/src/components/family-tree/tests/RelationshipLine.test.tsx',
    'client/src/components/family-tree/tests/TreeNode.test.tsx',
    'client/src/components/family-tree/tests/performance.test.tsx',
  ],
  testTimeout: 60000, // 60 seconds
  logFile: 'tree-tests-results.log',
};

// Setup logging
const logStream = fs.createWriteStream(config.logFile, { flags: 'w' });
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
};

// Run backend tests with Jest
async function runBackendTests() {
  log('Starting backend tests...');
  
  for (const testFile of config.backendTests) {
    log(`Running test: ${testFile}`);
    
    try {
      const result = await runCommand('npx', ['jest', testFile, '--verbose'], {
        timeout: config.testTimeout,
      });
      log(`✅ Test ${testFile} completed successfully`);
      log(result);
    } catch (error) {
      log(`❌ Test ${testFile} failed`);
      log(error);
    }
  }
}

// Run frontend tests with Vitest
async function runFrontendTests() {
  log('Starting frontend tests...');
  
  for (const testFile of config.frontendTests) {
    log(`Running test: ${testFile}`);
    
    try {
      const result = await runCommand('npx', ['vitest', 'run', testFile, '--config', 'vite.config.ts'], {
        timeout: config.testTimeout,
      });
      log(`✅ Test ${testFile} completed successfully`);
      log(result);
    } catch (error) {
      log(`❌ Test ${testFile} failed`);
      log(error);
    }
  }
}

// Helper function to run a command and return a promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    // Set timeout
    let timeoutId;
    if (options.timeout) {
      timeoutId = setTimeout(() => {
        child.kill();
        reject(`Command timed out after ${options.timeout}ms: ${command} ${args.join(' ')}`);
      }, options.timeout);
    }
    
    child.on('close', (code) => {
      if (timeoutId) clearTimeout(timeoutId);
      
      if (code === 0) {
        resolve(output);
      } else {
        reject(errorOutput || `Command failed with exit code ${code}`);
      }
    });
  });
}

// Main function to run all tests
async function runAllTests() {
  const startTime = Date.now();
  log('=== Starting Family Tree Comprehensive Testing ===');
  
  try {
    await runBackendTests();
    await runFrontendTests();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    log(`=== Test Suite Completed in ${duration.toFixed(2)} seconds ===`);
    
    // Generate summary
    log('');
    log('=== Test Summary ===');
    log(`Backend Tests: ${config.backendTests.length}`);
    log(`Frontend Tests: ${config.frontendTests.length}`);
    log(`Total Duration: ${duration.toFixed(2)} seconds`);
    log(`Results saved to: ${config.logFile}`);
    
    logStream.end();
  } catch (error) {
    log(`Test suite failed: ${error}`);
    logStream.end();
    process.exit(1);
  }
}

// Run the tests
runAllTests();