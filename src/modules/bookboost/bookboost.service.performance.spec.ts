import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { BookboostService } from './bookboost.service';

// Mock the config
jest.mock('../../config/bookboost.config', () => ({
  bookboostConfig: {
    BASE_URL: 'https://api.bookboost.test',
    TOKEN: 'test-token',
  },
}));

describe('BookboostService Performance Tests', () => {
  let service: BookboostService;
  let httpService: jest.Mocked<HttpService>;

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookboostService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<BookboostService>(BookboostService);
    httpService = module.get(HttpService);

    jest.clearAllMocks();
  });

  describe('Performance and Load Testing', () => {
    it('should handle bulk user creation efficiently', async () => {
      const userCount = 100;
      const users = Array.from({ length: userCount }, (_, i) => ({
        email: `user${i}@example.com`,
        first_name: `User${i}`,
        last_name: `Test${i}`,
      }));

      const responses = users.map(
        (user, index) =>
          ({
            data: { id: `user-${index}`, ...user },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          }) as AxiosResponse,
      );

      // Mock all responses
      httpService.post.mockImplementation((url, data: any) => {
        const index = users.findIndex((u) => u.email === data.email);
        return of(responses[index]);
      });

      const startTime = Date.now();
      const results = await Promise.all(
        users.map((user) => service.upsertUser(user)),
      );
      const endTime = Date.now();

      expect(results).toHaveLength(userCount);
      expect(httpService.post).toHaveBeenCalledTimes(userCount);

      // Performance assertion: should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });

    it('should handle concurrent messaging operations', async () => {
      const messageCount = 50;
      const messages = Array.from({ length: messageCount }, (_, i) => ({
        user_id: `user-${i}`,
        message: `Message ${i}`,
        channel: i % 2 === 0 ? ('email' as const) : ('sms' as const),
      }));

      httpService.post.mockReturnValue(
        of({
          data: { message_id: 'msg-123' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        } as AxiosResponse),
      );

      const startTime = Date.now();
      const results = await Promise.all(
        messages.map((msg) => service.sendMessage(msg)),
      );
      const endTime = Date.now();

      expect(results).toHaveLength(messageCount);
      expect(httpService.post).toHaveBeenCalledTimes(messageCount);

      // Performance assertion
      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds
    });

    it('should handle mixed operations efficiently', async () => {
      const operations: Promise<any>[] = [];

      // Create users
      for (let i = 0; i < 20; i++) {
        operations.push(
          service.upsertUser({
            email: `user${i}@example.com`,
            first_name: `User${i}`,
            last_name: `Test${i}`,
          }),
        );
      }

      // Send messages
      for (let i = 0; i < 20; i++) {
        operations.push(
          service.sendMessage({
            user_id: `user-${i}`,
            message: `Message ${i}`,
            channel: 'email' as const,
          }),
        );
      }

      // Tag users
      for (let i = 0; i < 20; i++) {
        operations.push(
          service.tagUser(`user-${i}`, [`tag-${i}`, 'bulk-test']),
        );
      }

      httpService.post.mockReturnValue(
        of({
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        } as AxiosResponse),
      );

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const endTime = Date.now();

      expect(results).toHaveLength(60);
      expect(httpService.post).toHaveBeenCalledTimes(60);

      // Performance assertion
      expect(endTime - startTime).toBeLessThan(4000); // 4 seconds
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle partial failures in bulk operations', async () => {
      const users = [
        { email: 'user1@example.com', first_name: 'User1', last_name: 'Test1' },
        { email: 'user2@example.com', first_name: 'User2', last_name: 'Test2' },
        { email: 'user3@example.com', first_name: 'User3', last_name: 'Test3' },
      ];

      let callCount = 0;
      httpService.post.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return throwError(() => ({
            response: {
              status: 500,
              data: { message: 'Internal server error' },
            },
          }));
        }
        return of({
          data: { id: `user-${callCount}`, success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        } as AxiosResponse);
      });

      const results = await Promise.allSettled(
        users.map((user) => service.upsertUser(user)),
      );

      expect(results).toHaveLength(3);
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });

    it('should handle rate limiting gracefully', async () => {
      const rateLimitError = {
        response: {
          status: 429,
          data: {
            message: 'Rate limit exceeded',
            retry_after: 1,
          },
        },
      };

      httpService.post.mockReturnValue(throwError(() => rateLimitError));

      const startTime = Date.now();

      await expect(
        service.upsertUser({ email: 'test@example.com' }),
      ).rejects.toThrow();

      const endTime = Date.now();

      // Should fail fast without hanging
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle timeout scenarios efficiently', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'Request timeout',
      };

      httpService.post.mockReturnValue(throwError(() => timeoutError));

      const startTime = Date.now();

      await expect(
        service.upsertUser({ email: 'test@example.com' }),
      ).rejects.toThrow();

      const endTime = Date.now();

      // Should fail fast
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        httpService.post.mockReturnValue(
          of({
            data: { id: `user-${i}` },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse),
        );
        await service.upsertUser({
          email: `user${i}@example.com`,
          first_name: `User${i}`,
          last_name: `Test${i}`,
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large payloads efficiently', async () => {
      const largeUser = {
        email: 'large@example.com',
        first_name: 'Large',
        last_name: 'User',
        metadata: {
          preferences: Array.from({ length: 1000 }, (_, i) => `pref-${i}`),
          history: Array.from({ length: 500 }, (_, i) => `event-${i}`),
        },
      };

      httpService.post.mockReturnValue(
        of({
          data: { id: 'large-user', ...largeUser },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        } as AxiosResponse),
      );

      const startTime = Date.now();
      const result = await service.upsertUser(largeUser);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(2000); // 2 seconds
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid successive calls', async () => {
      const rapidCalls = 20;
      const promises: Promise<void>[] = [];

      httpService.post.mockReturnValue(
        of({
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        } as AxiosResponse),
      );

      const startTime = Date.now();

      for (let i = 0; i < rapidCalls; i++) {
        promises.push(
          service.sendMessage({
            user_id: `user-${i}`,
            message: `Rapid message ${i}`,
            channel: 'email' as const,
          }),
        );
      }

      await Promise.all(promises);
      const endTime = Date.now();

      expect(httpService.post).toHaveBeenCalledTimes(rapidCalls);
      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds
    });

    it('should handle mixed error and success scenarios', async () => {
      const operations: Promise<any>[] = [];
      let successCount = 0;
      let errorCount = 0;

      httpService.post.mockImplementation(() => {
        const shouldFail = Math.random() > 0.7; // 30% failure rate
        if (shouldFail) {
          errorCount++;
          return throwError(() => ({
            response: {
              status: 500,
              data: { message: 'Random error' },
            },
          }));
        } else {
          successCount++;
          return of({
            data: { success: true },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse);
        }
      });

      // Create 50 operations
      for (let i = 0; i < 50; i++) {
        operations.push(
          service
            .upsertUser({
              email: `user${i}@example.com`,
              first_name: `User${i}`,
              last_name: `Test${i}`,
            })
            .catch(() => null), // Catch errors to continue
        );
      }

      const results = await Promise.allSettled(operations);
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      expect(results).toHaveLength(50);
      expect(successful + failed).toBe(50);
    });
  });
});
