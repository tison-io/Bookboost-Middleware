import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { VisbookService } from './visbook.service';
import { VisbookLoginMethod, VisbookPaymentType } from './visbook.dto';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

jest.mock('src/config/visbook.config', () => ({
  visbookConfig: {
    BASE_URL: 'https://api.visbook.com',
    LINKS: {
      LOGIN_EMAIL: (webentity: number) =>
        `/api/${webentity}/login/request/email`,
      LOGIN_SMS: (webentity: number) => `/api/${webentity}/login/request/sms`,
      VALIDATE_EMAIL: (webentity: number, token: string) =>
        `/api/${webentity}/validation/email/${token}`,
      VALIDATE_MOBILE: (webentity: number, token: string) =>
        `/api/${webentity}/validation/mobile/${token}`,
      RESERVATIONS_ADD: (webentity: number) => `/api/${webentity}/reservations`,
      RESERVATION_UPDATE: (
        webentity: number,
        encryptedCompanyId: string,
        reservationId: number,
      ) =>
        `/api/${webentity}/reservations/${encryptedCompanyId}/${reservationId}`,
      RESERVATIONS_PING: (webentity: number) =>
        `/api/${webentity}/reservations/ping`,
      CHECKOUT: (webentity: number) => `/api/${webentity}/checkout`,
    },
  },
}));

describe('VisbookService', () => {
  let service: VisbookService;
  let httpService: HttpService;

  const mockHttpService = {
    request: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisbookService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<VisbookService>(VisbookService);
    httpService = module.get<HttpService>(HttpService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with email', async () => {
      const mockResponse: AxiosResponse = {
        data: {},
        status: 204,
        statusText: 'No Content',
        headers: {},
        config: {} as any,
      };

      mockHttpService.request.mockReturnValue(of(mockResponse));

      const loginDto = {
        method: VisbookLoginMethod.EMAIL,
        webentity: 123,
        body: { email: 'test@example.com' },
      };

      const result = await service.login(loginDto);

      expect(mockHttpService.request).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.visbook.com/api/123/login/request/email',
        data: { email: 'test@example.com' },
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      expect(result).toEqual({});
    });

    it('should successfully login with SMS', async () => {
      const mockResponse: AxiosResponse = {
        data: {},
        status: 204,
        statusText: 'No Content',
        headers: {},
        config: {} as any,
      };

      mockHttpService.request.mockReturnValue(of(mockResponse));

      const loginDto = {
        method: VisbookLoginMethod.SMS,
        webentity: 123,
        body: { phoneNumber: '1234567890', countryCode: '1' },
      };

      const result = await service.login(loginDto);

      expect(mockHttpService.request).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.visbook.com/api/123/login/request/sms',
        data: { phoneNumber: '1234567890', countryCode: '1' },
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      expect(result).toEqual({});
    });

    it('should throw error for unsupported login method', async () => {
      const loginDto = {
        method: 'invalid' as VisbookLoginMethod,
        webentity: 123,
        body: { email: 'test@example.com' },
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        'Unsupported login method: invalid',
      );
    });

    it('should handle API errors', async () => {
      const mockError = {
        message: 'Network error',
        response: {
          data: { error: 'Invalid email' },
        },
      };

      mockHttpService.request.mockReturnValue(throwError(mockError));

      const loginDto = {
        method: VisbookLoginMethod.EMAIL,
        webentity: 123,
        body: { email: 'invalid@example.com' },
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        'Visbook API request failed: Network error',
      );
    });
  });

  describe('validate', () => {
    it('should successfully validate email token', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          id: 12345,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          encryptedCompanyId: 'enc_company_123',
          country: 578,
          followupAccepted: false,
          anonymization: {
            canBeAnonymized: true,
            when: null,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.request.mockReturnValue(of(mockResponse));

      const result = await service.validate({
        webentity: 123,
        token: '123456',
        method: VisbookLoginMethod.EMAIL,
      });

      expect(mockHttpService.request).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.visbook.com/api/123/validation/email/123456',
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      expect(result).toEqual({
        id: 12345,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        encryptedCompanyId: 'enc_company_123',
        country: 578,
        followupAccepted: false,
        anonymization: {
          canBeAnonymized: true,
          when: null,
        },
      });
    });

    it('should successfully validate SMS token', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          id: 54321,
          email: 'mobile@example.com',
          mobile: '+1234567890',
          encryptedCompanyId: 'enc_company_456',
          country: 840,
          followupAccepted: true,
          anonymization: {
            canBeAnonymized: false,
            when: null,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.request.mockReturnValue(of(mockResponse));

      const result = await service.validate({
        webentity: 123,
        token: '654321',
        method: VisbookLoginMethod.SMS,
      });

      expect(mockHttpService.request).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.visbook.com/api/123/validation/mobile/654321',
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      expect(result).toEqual({
        id: 54321,
        email: 'mobile@example.com',
        mobile: '+1234567890',
        encryptedCompanyId: 'enc_company_456',
        country: 840,
        followupAccepted: true,
        anonymization: {
          canBeAnonymized: false,
          when: null,
        },
      });
    });

    it('should throw error for unsupported validation method', async () => {
      await expect(
        service.validate({
          webentity: 123,
          token: '123456',
          method: 'invalid' as VisbookLoginMethod,
        }),
      ).rejects.toThrow('Unsupported validation method: invalid');
    });
  });

  describe('createReservation', () => {
    it('should successfully create a reservation', async () => {
      const mockResponse: AxiosResponse = {
        data: [
          {
            reservationId: 123456,
            encryptedCompanyId: 'enc_company_123',
          },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.request.mockReturnValue(of(mockResponse));

      const reservationDto = {
        webentity: 123,
        fromDate: '2025-07-15T00:00:00.000Z',
        toDate: '2025-07-17T00:00:00.000Z',
        priceId: '789',
        numberOfPeople: 2,
        webProductId: '456',
      };

      const result = await service.createReservation(reservationDto);

      expect(mockHttpService.request).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.visbook.com/api/123/reservations',
        data: {
          fromDate: '2025-07-15T00:00:00.000Z',
          toDate: '2025-07-17T00:00:00.000Z',
          priceId: '789',
          numberOfPeople: 2,
          webProductId: '456',
        },
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      expect(result).toEqual([
        {
          reservationId: 123456,
          encryptedCompanyId: 'enc_company_123',
        },
      ]);
    });
  });

  describe('updateReservation', () => {
    it('should successfully update a reservation', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          statusCode: 200,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.request.mockReturnValue(of(mockResponse));

      const updateDto = {
        webentity: 123,
        encryptedCompanyId: 'enc_company_123',
        reservationId: 456,
        fromDate: '2025-07-16T00:00:00.000Z',
        toDate: '2025-07-18T00:00:00.000Z',
        priceId: '789',
        numberOfPeople: 3,
      };

      const result = await service.updateReservation(updateDto);

      expect(mockHttpService.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: 'https://api.visbook.com/api/123/reservations/enc_company_123/456',
        data: {
          fromDate: '2025-07-16T00:00:00.000Z',
          toDate: '2025-07-18T00:00:00.000Z',
          priceId: '789',
          numberOfPeople: 3,
        },
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      expect(result).toEqual({ statusCode: 200 });
    });
  });

  describe('pingReservation', () => {
    it('should successfully ping reservation', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          statusCode: 200,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.request.mockReturnValue(of(mockResponse));

      const result = await service.pingReservation(123);

      expect(mockHttpService.request).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.visbook.com/api/123/reservations/ping',
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      expect(result).toEqual({ statusCode: 200 });
    });

    it('should handle ping with expired reservations', async () => {
      const mockResponse: AxiosResponse = {
        data: [
          {
            reservationId: 456,
            encryptedCompanyId: 'enc_company_expired',
          },
        ],
        status: 202,
        statusText: 'Accepted',
        headers: {},
        config: {} as any,
      };

      mockHttpService.request.mockReturnValue(of(mockResponse));

      const result = await service.pingReservation(123);

      expect(result).toEqual([
        {
          reservationId: 456,
          encryptedCompanyId: 'enc_company_expired',
        },
      ]);
    });
  });

  describe('checkoutReservation', () => {
    it('should successfully checkout reservation', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          terminalUrl: 'https://payment.example.com/terminal/123',
          checkoutStatus: 'ok',
          expiredReservations: null,
          giftcardsBalance: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.request.mockReturnValue(of(mockResponse));

      const checkoutDto = {
        webentity: 123,
        reservations: [
          {
            reservationId: '123456',
            encryptedCompanyId: 'enc_company_123',
          },
        ],
        successUrl: 'https://example.com/success',
        errorUrl: 'https://example.com/error',
        paymentType: VisbookPaymentType.NO_ONLINE_PAYMENT,
        amount: 99.99,
        customer: {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          country: '578',
        },
        acceptedTerms: true,
        externalReference: 'ext_ref_123',
      };

      const result = await service.checkoutReservation(checkoutDto);

      expect(mockHttpService.request).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.visbook.com/api/123/checkout',
        data: {
          reservations: [
            {
              reservationId: '123456',
              encryptedCompanyId: 'enc_company_123',
            },
          ],
          successUrl: 'https://example.com/success',
          errorUrl: 'https://example.com/error',
          paymentType: VisbookPaymentType.NO_ONLINE_PAYMENT,
          amount: 99.99,
          customer: {
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            country: '578',
          },
          acceptedTerms: true,
          externalReference: 'ext_ref_123',
        },
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      expect(result).toEqual({
        terminalUrl: 'https://payment.example.com/terminal/123',
        checkoutStatus: 'ok',
        expiredReservations: null,
        giftcardsBalance: null,
      });
    });

    it('should handle checkout with expired reservations', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          terminalUrl: 'https://payment.example.com/terminal/123',
          checkoutStatus: 'someReservationsExpired',
          expiredReservations: [
            {
              reservationId: 'res_expired',
              encryptedCompanyId: 'enc_company_expired',
            },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.request.mockReturnValue(of(mockResponse));

      const checkoutDto = {
        webentity: 123,
        reservations: [
          {
            reservationId: 'res_123456',
            encryptedCompanyId: 'enc_company_123',
          },
        ],
        successUrl: 'https://example.com/success',
        errorUrl: 'https://example.com/error',
        paymentType: VisbookPaymentType.NO_ONLINE_PAYMENT,
        amount: 99.99,
        customer: {
          email: 'test@example.com',
        },
        acceptedTerms: true,
      };

      const result = await service.checkoutReservation(checkoutDto);

      expect(result.checkoutStatus).toBe('someReservationsExpired');
      expect(result.expiredReservations).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('should log error details and throw descriptive error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockError = {
        message: 'Request failed',
        response: {
          data: { error: 'Invalid parameters', code: 'INVALID_PARAMS' },
        },
      };

      mockHttpService.request.mockReturnValue(throwError(mockError));

      const loginDto = {
        method: VisbookLoginMethod.EMAIL,
        webentity: 123,
        body: { email: 'test@example.com' },
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        'Visbook API request failed: Request failed',
      );

      expect(consoleSpy).toHaveBeenCalledWith({
        error: { error: 'Invalid parameters', code: 'INVALID_PARAMS' },
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Visbook API request failed: Request failed',
      );

      consoleSpy.mockRestore();
    });

    it('should handle errors without response data', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockError = {
        message: 'Network timeout',
      };

      mockHttpService.request.mockReturnValue(throwError(mockError));

      const loginDto = {
        method: VisbookLoginMethod.EMAIL,
        webentity: 123,
        body: { email: 'test@example.com' },
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        'Visbook API request failed: Network timeout',
      );

      expect(consoleSpy).toHaveBeenCalledWith({ error: undefined });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Visbook API request failed: Network timeout',
      );

      consoleSpy.mockRestore();
    });
  });
});
