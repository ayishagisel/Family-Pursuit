/**
 * JWT Token Expiration Test
 * 
 * This script tests the JWT expiration functionality by:
 * 1. Creating a token with a very short expiration (e.g., 5 seconds)
 * 2. Verifying it works immediately
 * 3. Waiting for expiration
 * 4. Verifying it no longer works
 */

import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

// Configuration
const BASE_URL = 'http://localhost:5000';
const SECRET_KEY = 'family-app-jwt-secret-key-12345'; // Must match the one in authService.ts
const SHORT_EXPIRY = '5s'; // 5 seconds expiration

// Create a test user payload
const testPayload = {
  id: 999, // A user ID that won't conflict with real users
  username: 'expiry_test_user',
  email: 'expiry@test.com'
};

// Generate a short-lived token
function generateShortLivedToken() {
  return jwt.sign(testPayload, SECRET_KEY, { expiresIn: SHORT_EXPIRY });
}

// Utility function for testing token access
async function testTokenAccess(token, expectSuccess) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // For this test, we consider 401 as expired token (which is expected)
    // and any other status as token still valid (since auth passed)
    const isExpired = response.status === 401;
    const success = !isExpired;
    const status = response.status;
    
    // Optional: Get more details if needed
    let details = '';
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      details = JSON.stringify(data);
    }
    
    // Check if result matches expectation
    const testPassed = (success === expectSuccess);
    console.log(`${testPassed ? '✅' : '❌'} Token ${expectSuccess ? 'should work' : 'should be expired'}: ${isExpired ? 'Expired' : 'Valid'} (Status: ${status}${details ? ` - ${details}` : ''})`);
    return testPassed;
  } catch (error) {
    console.log(`❌ Error testing token: ${error.message}`);
    return false;
  }
}

// Decode and print token info
function decodeAndPrintToken(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    console.log('\nToken details:');
    console.log('Header:', JSON.stringify(decoded.header));
    console.log('Payload:', JSON.stringify(decoded.payload));
    
    const now = Math.floor(Date.now() / 1000);
    const exp = decoded.payload.exp;
    const iat = decoded.payload.iat;
    
    console.log(`\nIssued at: ${new Date(iat * 1000).toLocaleString()}`);
    console.log(`Expires at: ${new Date(exp * 1000).toLocaleString()}`);
    console.log(`Current time: ${new Date(now * 1000).toLocaleString()}`);
    console.log(`Time until expiration: ${exp - now} seconds\n`);
  } catch (error) {
    console.log('Error decoding token:', error.message);
  }
}

// Main test function
async function testTokenExpiration() {
  console.log('🔒 Testing JWT Token Expiration 🔒\n');
  
  // Step 1: Generate a short-lived token
  const token = generateShortLivedToken();
  console.log(`Generated short-lived token (expires in ${SHORT_EXPIRY}):`);
  console.log(token);
  
  decodeAndPrintToken(token);
  
  // Step 2: Test token immediately (should work)
  console.log('Testing token before expiration:');
  await testTokenAccess(token, true);
  
  // Step 3: Wait for expiration
  const waitTime = 6000; // 6 seconds (to ensure expiration)
  console.log(`\nWaiting ${waitTime}ms for token to expire...`);
  
  await new Promise(resolve => setTimeout(resolve, waitTime));
  
  // Step 4: Test token after expiration (should fail)
  console.log('\nTesting token after expiration:');
  await testTokenAccess(token, false);
  
  console.log('\n🔒 JWT Token Expiration Test Completed 🔒');
}

// Run the test
testTokenExpiration();