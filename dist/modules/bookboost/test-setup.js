"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const originalConsoleLog = console.log;
console.log = jest.fn();
try {
    (0, dotenv_1.config)({ path: '.env.test' });
}
catch (error) {
}
console.log = originalConsoleLog;
process.env.BOOKBOOST_TOKEN = process.env.BOOKBOOST_TOKEN || 'test-token';
process.env.BOOKBOOST_BASE_URL =
    process.env.BOOKBOOST_BASE_URL || 'https://api.bookboost.test';
jest.setTimeout(30000);
const originalConsoleError = console.error;
beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
});
afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
});
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
        channel: 'email',
        ...overrides,
    }),
    createMockError: (status, message, data = {}) => ({
        response: {
            status,
            data: {
                message,
                ...data,
            },
        },
    }),
};
//# sourceMappingURL=test-setup.js.map