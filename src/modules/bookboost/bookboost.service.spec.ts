import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { BookboostService } from './bookboost.service';
import { bookboostConfig } from '../../config/bookboost.config';

// Mock the config
jest.mock('../../config/bookboost.config', () => ({
  bookboostConfig: {
    BASE_URL: 'https://api.bookboost.test',
    TOKEN: 'test-token',
  },
}));

describe('BookboostService', () => {
  let service: BookboostService;
  let httpService: jest.Mocked<HttpService>;

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  // Helper function to create proper AxiosResponse mock
  const createMockAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  });

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

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor and initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with correct config values', () => {
      expect(service['baseUrl']).toBe(bookboostConfig.BASE_URL);
      expect(service['token']).toBe(bookboostConfig.TOKEN);
    });
  });

  describe('getHeaders', () => {
    it('should return correct headers', () => {
      const headers = service['getHeaders']();

      expect(headers).toEqual({
        Authorization: `Bearer ${bookboostConfig.TOKEN}`,
        'Content-Type': 'application/json',
      });
    });
  });

  describe('upsertUser', () => {
    const mockUserPayload = {
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
    };

    const mockResponse: AxiosResponse = {
      data: {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    it('should successfully create/update a user', async () => {
      httpService.post.mockReturnValue(of(mockResponse));

      const result = await service.upsertUser(mockUserPayload);

      expect(httpService.post).toHaveBeenCalledWith(
        `${bookboostConfig.BASE_URL}/users`,
        mockUserPayload,
        {
          headers: {
            Authorization: `Bearer ${bookboostConfig.TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors and throw HttpException', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'Invalid user data',
            errors: ['Email is required'],
          },
        },
      };

      httpService.post.mockReturnValue(throwError(() => errorResponse));

      await expect(service.upsertUser(mockUserPayload)).rejects.toThrow(
        HttpException,
      );

      await expect(service.upsertUser(mockUserPayload)).rejects.toMatchObject({
        message: '[BookboostService:upsertUser] Invalid user data',
        status: 400,
      });
    });

    it('should handle network errors and throw HttpException with 500 status', async () => {
      const networkError = new Error('Network error');
      httpService.post.mockReturnValue(throwError(() => networkError));

      await expect(service.upsertUser(mockUserPayload)).rejects.toThrow(
        HttpException,
      );

      await expect(service.upsertUser(mockUserPayload)).rejects.toMatchObject({
        message: '[BookboostService:upsertUser] Network error',
        status: 500,
      });
    });

    it('should handle error with empty response data', async () => {
      const error = {
        response: {
          status: 204,
          data: null,
        },
      };

      httpService.post.mockReturnValue(throwError(() => error));

      await expect(
        service.upsertUser({ email: 'test@example.com' }),
      ).rejects.toMatchObject({
        message: '[BookboostService:upsertUser] undefined',
        status: 204,
      });
    });
  });

  describe('linkExternalRef', () => {
    const userId = 'user-123';
    const externalId = 'visbook-user-456';

    it('should successfully link external reference', async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      httpService.post.mockReturnValue(of(mockResponse));

      await service.linkExternalRef(userId, externalId);

      expect(httpService.post).toHaveBeenCalledWith(
        `${bookboostConfig.BASE_URL}/user-external-reference`,
        {
          user_id: userId,
          external_id: externalId,
          source: 'visbook',
        },
        {
          headers: {
            Authorization: `Bearer ${bookboostConfig.TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should handle API errors and throw HttpException', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: {
            message: 'User not found',
          },
        },
      };

      httpService.post.mockReturnValue(throwError(() => errorResponse));

      await expect(service.linkExternalRef(userId, externalId)).rejects.toThrow(
        HttpException,
      );

      await expect(
        service.linkExternalRef(userId, externalId),
      ).rejects.toMatchObject({
        message: '[BookboostService:linkExternalRef] User not found',
        status: 404,
      });
    });
  });

  describe('tagUser', () => {
    const userId = 'user-123';
    const tags = ['premium', 'newsletter'];

    it('should successfully tag a user', async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      httpService.post.mockReturnValue(of(mockResponse));

      await service.tagUser(userId, tags);

      expect(httpService.post).toHaveBeenCalledWith(
        `${bookboostConfig.BASE_URL}/user-tags`,
        {
          user_id: userId,
          tags,
        },
        {
          headers: {
            Authorization: `Bearer ${bookboostConfig.TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should handle API errors and throw HttpException', async () => {
      const errorResponse = {
        response: {
          status: 403,
          data: {
            message: 'Insufficient permissions',
          },
        },
      };

      httpService.post.mockReturnValue(throwError(() => errorResponse));

      await expect(service.tagUser(userId, tags)).rejects.toThrow(
        HttpException,
      );

      await expect(service.tagUser(userId, tags)).rejects.toMatchObject({
        message: '[BookboostService:tagUser] Insufficient permissions',
        status: 403,
      });
    });

    it('should handle empty tags array', async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      httpService.post.mockReturnValue(of(mockResponse));

      await service.tagUser(userId, []);

      expect(httpService.post).toHaveBeenCalledWith(
        `${bookboostConfig.BASE_URL}/user-tags`,
        {
          user_id: userId,
          tags: [],
        },
        {
          headers: {
            Authorization: `Bearer ${bookboostConfig.TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );
    });
  });

  describe('sendMessage', () => {
    const basePayload = {
      user_id: 'user-123',
      message: 'Hello from Bookboost!',
    };

    it('should successfully send email message', async () => {
      const mockResponse: AxiosResponse = {
        data: { message_id: 'msg-456' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      httpService.post.mockReturnValue(of(mockResponse));

      const payload = { ...basePayload, channel: 'email' as const };

      await service.sendMessage(payload);

      expect(httpService.post).toHaveBeenCalledWith(
        `${bookboostConfig.BASE_URL}/message/email`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${bookboostConfig.TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should successfully send SMS message', async () => {
      const mockResponse: AxiosResponse = {
        data: { message_id: 'msg-789' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      httpService.post.mockReturnValue(of(mockResponse));

      const payload = { ...basePayload, channel: 'sms' as const };

      await service.sendMessage(payload);

      expect(httpService.post).toHaveBeenCalledWith(
        `${bookboostConfig.BASE_URL}/message/sms`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${bookboostConfig.TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should handle email API errors and throw HttpException', async () => {
      const errorResponse = {
        response: {
          status: 422,
          data: {
            message: 'Invalid email format',
          },
        },
      };

      httpService.post.mockReturnValue(throwError(() => errorResponse));

      const payload = { ...basePayload, channel: 'email' as const };

      await expect(service.sendMessage(payload)).rejects.toThrow(HttpException);

      await expect(service.sendMessage(payload)).rejects.toMatchObject({
        message: '[BookboostService:sendMessage] Invalid email format',
        status: 422,
      });
    });

    it('should handle SMS API errors and throw HttpException', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'Invalid phone number',
          },
        },
      };

      httpService.post.mockReturnValue(throwError(() => errorResponse));

      const payload = { ...basePayload, channel: 'sms' as const };

      await expect(service.sendMessage(payload)).rejects.toThrow(HttpException);

      await expect(service.sendMessage(payload)).rejects.toMatchObject({
        message: '[BookboostService:sendMessage] Invalid phone number',
        status: 400,
      });
    });
  });

  describe('handleError', () => {
    it('should handle error with response data', () => {
      const error = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
          },
        },
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        service['handleError'](error, 'testMethod');
      }).toThrow(HttpException);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[BookboostService:testMethod] Internal server error',
        { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      );

      consoleSpy.mockRestore();
    });

    it('should handle error without response data', () => {
      const error = new Error('Network timeout');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        service['handleError'](error, 'testMethod');
      }).toThrow(HttpException);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[BookboostService:testMethod] Network timeout',
        {},
      );

      consoleSpy.mockRestore();
    });

    it('should handle error with response but no data', () => {
      const error = {
        response: {
          status: 404,
        },
        message: 'Not found',
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        service['handleError'](error, 'testMethod');
      }).toThrow(HttpException);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[BookboostService:testMethod] Not found',
        {},
      );

      consoleSpy.mockRestore();
    });
  });

  describe('error handling edge cases', () => {
    it('should handle axios error with no response', async () => {
      const axiosError = {
        message: 'Request timeout',
        code: 'ECONNABORTED',
      };

      httpService.post.mockReturnValue(throwError(() => axiosError));

      await expect(
        service.upsertUser({ email: 'test@example.com' }),
      ).rejects.toMatchObject({
        message: '[BookboostService:upsertUser] Request timeout',
        status: 500,
      });
    });

    it('should handle error with empty response data', async () => {
      const error = {
        response: {
          status: 204,
          data: null,
        },
      };

      httpService.post.mockReturnValue(throwError(() => error));

      await expect(
        service.upsertUser({ email: 'test@example.com' }),
      ).rejects.toMatchObject({
        message: '[BookboostService:upsertUser] undefined',
        status: 204,
      });
    });
  });
});
