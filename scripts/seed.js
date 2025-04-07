#!/usr/bin/env node

/**
 * Helper script to run the TypeScript seed file
 */

const { exec } = require('child_process');

console.log('👨‍👩‍👧‍👦 Seeding Family App database with sample data...');

// Run the TypeScript seed file
exec('npx tsx scripts/seed-family-data.ts', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error seeding data:', error);
    console.error(stderr);
    process.exit(1);
  }
  
  console.log(stdout);
  console.log('✅ Family data seeded successfully!');
  console.log('\n📝 You can now log in with:');
  console.log('  Username: admin');
  console.log('  Password: password123');
  console.log('\nOr:');
  console.log('  Username: user');
  console.log('  Password: password123');
});