// Test setup for BookboostService tests
import { config } from 'dotenv';

// Suppress dotenv logging
const originalConsoleLog = console.log;
console.log = jest.fn();

// Load environment variables for testing (suppress errors if file doesn't exist)
try {
  config({ path: '.env.test' });
} catch (error) {
  // Ignore if .env.test doesn't exist
}

// Restore console.log
console.log = originalConsoleLog;

// Set default test environment variables if not present
process.env.BOOKBOOST_TOKEN = process.env.BOOKBOOST_TOKEN || 'test-token';
process.env.BOOKBOOST_BASE_URL =
  process.env.BOOKBOOST_BASE_URL || 'https://api.bookboost.test';

// Global test timeout
jest.setTimeout(30000);

// Suppress console logs during tests unless explicitly needed
const originalConsoleError = console.error;

beforeEach(() => {
  // Suppress console logs during tests
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Restore console functions after each test
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    phone: '+1234567890',
    ...overrides,
  }),

  createMockMessage: (overrides = {}) => ({
    user_id: 'user-123',
    message: 'Test message',
    channel: 'email' as const,
    ...overrides,
  }),

  createMockError: (status: number, message: string, data = {}) => ({
    response: {
      status,
      data: {
        message,
        ...data,
      },
    },
  }),
};
