// Script to run Jest tests for the Family App
const { spawn } = require('child_process');

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

const args = process.argv.slice(2);
let jestArgs = ['--config', 'jest.config.js'];

// Add additional arguments based on command line options
if (args.includes('--watch')) {
  jestArgs.push('--watch');
} else if (args.includes('--coverage')) {
  jestArgs.push('--coverage');
}

console.log(`Running Jest with arguments: ${jestArgs.join(' ')}`);

// Run Jest with the specified configuration
const jest = spawn('npx', ['jest', ...jestArgs], { stdio: 'inherit' });

jest.on('close', (code) => {
  process.exit(code);
});