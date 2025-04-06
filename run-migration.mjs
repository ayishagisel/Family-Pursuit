#!/usr/bin/env node

// Simple script to run database migrations
import { spawn } from 'child_process';

console.log('Running database migration...');

const migrationProcess = spawn('tsx', ['server/migrate.ts'], {
  stdio: 'inherit',
  shell: true
});

migrationProcess.on('close', (code) => {
  if (code === 0) {
    console.log('Migration completed successfully!');
  } else {
    console.error(`Migration failed with code ${code}`);
    process.exit(code);
  }
});