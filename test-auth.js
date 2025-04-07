/**
 * JWT Authentication Test Script
 * 
 * This script tests the JWT authentication implementation in the Family App.
 */

import fetch from 'node-fetch';
const BASE_URL = 'http://localhost:5000';

// Test user data
const testUser = {
  username: `testuser_${Date.now()}`,
  password: 'Password123!',
  email: `testuser_${Date.now()}@example.com`,
  name: 'Test User'
};

let authToken = null;

// Utility function to log test results
function logResult(testName, success, message) {
  console.log(`${success ? '✅' : '❌'} ${testName}: ${message}`);
}

// 1. Test registration
async function testRegistration() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      authToken = data.token;
      logResult('Registration', true, `Successfully registered user: ${testUser.username}`);
      return true;
    } else {
      logResult('Registration', false, `Failed to register: ${data.message || response.statusText}`);
      return false;
    }
  } catch (error) {
    logResult('Registration', false, `Error: ${error.message}`);
    return false;
  }
}

// 2. Test login with valid credentials
async function testValidLogin() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      authToken = data.token;
      logResult('Valid Login', true, `Successfully logged in user: ${testUser.username}`);
      return true;
    } else {
      logResult('Valid Login', false, `Failed to login: ${data.message || response.statusText}`);
      return false;
    }
  } catch (error) {
    logResult('Valid Login', false, `Error: ${error.message}`);
    return false;
  }
}

// 3. Test login with invalid credentials
async function testInvalidLogin() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: testUser.username,
        password: 'WrongPassword123!'
      })
    });
    
    if (!response.ok && response.status === 401) {
      logResult('Invalid Login', true, 'Correctly rejected invalid credentials');
      return true;
    } else {
      const data = await response.json();
      logResult('Invalid Login', false, `Unexpected response: ${data.message || response.statusText}`);
      return false;
    }
  } catch (error) {
    logResult('Invalid Login', false, `Error: ${error.message}`);
    return false;
  }
}

// 4. Test protected route with valid token
async function testProtectedRouteWithValidToken() {
  if (!authToken) {
    logResult('Protected Route (Valid Token)', false, 'No auth token available');
    return false;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      logResult('Protected Route (Valid Token)', true, `Successfully accessed protected route as: ${data.username}`);
      return true;
    } else {
      logResult('Protected Route (Valid Token)', false, `Failed to access protected route: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    logResult('Protected Route (Valid Token)', false, `Error: ${error.message}`);
    return false;
  }
}

// 5. Test protected route with invalid token
async function testProtectedRouteWithInvalidToken() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid.token.string'
      }
    });
    
    if (!response.ok && response.status === 401) {
      logResult('Protected Route (Invalid Token)', true, 'Correctly rejected invalid token');
      return true;
    } else {
      logResult('Protected Route (Invalid Token)', false, `Unexpected response: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    logResult('Protected Route (Invalid Token)', false, `Error: ${error.message}`);
    return false;
  }
}

// 6. Test protected route with no token
async function testProtectedRouteWithNoToken() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET'
    });
    
    if (!response.ok && response.status === 401) {
      logResult('Protected Route (No Token)', true, 'Correctly required authentication');
      return true;
    } else {
      logResult('Protected Route (No Token)', false, `Unexpected response: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    logResult('Protected Route (No Token)', false, `Error: ${error.message}`);
    return false;
  }
}

// Main test sequence
async function runTests() {
  console.log('🔒 Running JWT Authentication Tests 🔒\n');
  
  // Test registration first
  const registrationSuccess = await testRegistration();
  
  if (registrationSuccess) {
    // If registration succeeds, run the other tests
    await testValidLogin();
    await testInvalidLogin();
    await testProtectedRouteWithValidToken();
  } else {
    console.log('\n⚠️ Skipping login tests due to registration failure');
  }
  
  // These tests don't depend on registration success
  await testProtectedRouteWithInvalidToken();
  await testProtectedRouteWithNoToken();
  
  console.log('\n🔒 JWT Authentication Tests Completed 🔒');
}

// Run the tests
runTests();