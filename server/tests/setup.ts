// Global test setup file
import dotenv from 'dotenv';

// Load environment variables from .env file for tests
dotenv.config();

// Set a longer timeout for tests that might take longer
jest.setTimeout(10000);

// Global test teardown
afterAll(async () => {
  // Any cleanup code here
});