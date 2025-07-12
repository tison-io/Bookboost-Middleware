import { Test, TestingModule } from '@nestjs/testing';
import { VisbookIntegrationService } from './visbook.integration.service';
import { VisbookService } from './visbook.service';
import { BookboostService } from '../../bookboost/bookboost.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  VisbookLoginMethod,
  VisbookPaymentType,
  VisbookCheckoutStatus,
  VisbookUserDto,
  VisbookReservationDto,
} from './visbook.dto';
import { Logger } from '@nestjs/common';

describe('VisbookIntegrationService', () => {
  let service: VisbookIntegrationService;
  let visbookService: VisbookService;
  let bookboostService: BookboostService;
  let schedulerRegistry: SchedulerRegistry;

  const mockVisbookService = {
    createReservation: jest.fn(),
    login: jest.fn(),
    validate: jest.fn(),
    checkoutReservation: jest.fn(),
    pingReservation: jest.fn(),
  };

  const mockBookboostService = {
    upsertUser: jest.fn(),
    linkExternalRef: jest.fn(),
    tagUser: jest.fn(),
  };

  const mockSchedulerRegistry = {
    addInterval: jest.fn(),
    deleteInterval: jest.fn(),
    doesExist: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisbookIntegrationService,
        {
          provide: VisbookService,
          useValue: mockVisbookService,
        },
        {
          provide: BookboostService,
          useValue: mockBookboostService,
        },
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
      ],
    }).compile();

    service = module.get<VisbookIntegrationService>(VisbookIntegrationService);
    visbookService = module.get<VisbookService>(VisbookService);
    bookboostService = module.get<BookboostService>(BookboostService);
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);

    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('initiateReservationAndLogin', () => {
    const mockReservationDto: VisbookReservationDto = {
      webentity: 123,
      fromDate: '2025-07-15T00:00:00.000Z',
      toDate: '2025-07-17T00:00:00.000Z',
      priceId: '789',
      numberOfPeople: 2,
      webProductId: '456',
    };

    it('should successfully initiate reservation with email login', async () => {
      const mockReservationResponse = {
        reservationId: 'res_123456',
        encryptedCompanyId: 'enc_company_123',
      };

      mockVisbookService.createReservation.mockResolvedValue(
        mockReservationResponse,
      );
      mockVisbookService.login.mockResolvedValue({});

      const result = await service.initiateReservationAndLogin(
        123,
        VisbookLoginMethod.EMAIL,
        { email: 'test@example.com' },
        mockReservationDto,
      );

      expect(mockVisbookService.createReservation).toHaveBeenCalledWith(
        mockReservationDto,
      );
      expect(mockVisbookService.login).toHaveBeenCalledWith({
        method: VisbookLoginMethod.EMAIL,
        webentity: 123,
        body: { email: 'test@example.com' },
      });
      expect(mockSchedulerRegistry.addInterval).toHaveBeenCalled();
      expect(result).toEqual({
        reservationId: 'res_123456',
        message:
          'Login code sent via email. Please use completeCheckoutWithToken() with the received code.',
      });
    });

    it('should successfully initiate reservation with SMS login', async () => {
      const mockReservationResponse = {
        reservationId: 'res_789012',
        encryptedCompanyId: 'enc_company_456',
      };

      mockVisbookService.createReservation.mockResolvedValue(
        mockReservationResponse,
      );
      mockVisbookService.login.mockResolvedValue({});

      const result = await service.initiateReservationAndLogin(
        456,
        VisbookLoginMethod.SMS,
        { phoneNumber: '+1234567890', countryCode: '1' },
        mockReservationDto,
      );

      expect(mockVisbookService.login).toHaveBeenCalledWith({
        method: VisbookLoginMethod.SMS,
        webentity: 456,
        body: { phoneNumber: '+1234567890', countryCode: '1' },
      });
      expect(result).toEqual({
        reservationId: 'res_789012',
        message:
          'Login code sent via sms. Please use completeCheckoutWithToken() with the received code.',
      });
    });

    it('should handle reservation creation failure', async () => {
      const mockError = new Error('Failed to create reservation');
      mockVisbookService.createReservation.mockRejectedValue(mockError);

      await expect(
        service.initiateReservationAndLogin(
          123,
          VisbookLoginMethod.EMAIL,
          { email: 'test@example.com' },
          mockReservationDto,
        ),
      ).rejects.toThrow('Failed to create reservation');

      expect(mockVisbookService.login).not.toHaveBeenCalled();
    });

    it('should handle login failure and update reservation status', async () => {
      const mockReservationResponse = {
        reservationId: 'res_123456',
        encryptedCompanyId: 'enc_company_123',
      };

      mockVisbookService.createReservation.mockResolvedValue(
        mockReservationResponse,
      );
      mockVisbookService.login.mockRejectedValue(new Error('Login failed'));

      await expect(
        service.initiateReservationAndLogin(
          123,
          VisbookLoginMethod.EMAIL,
          { email: 'test@example.com' },
          mockReservationDto,
        ),
      ).rejects.toThrow('Login failed');

      expect(service.getReservationStatus('res_123456')).toBe('failed');
    });

    it('should throw error for missing email in email login', async () => {
      await expect(
        service.initiateReservationAndLogin(
          123,
          VisbookLoginMethod.EMAIL,
          {},
          mockReservationDto,
        ),
      ).rejects.toThrow('Email is required for email login method');
    });

    it('should throw error for missing phone data in SMS login', async () => {
      await expect(
        service.initiateReservationAndLogin(
          123,
          VisbookLoginMethod.SMS,
          { phoneNumber: '+1234567890' },
          mockReservationDto,
        ),
      ).rejects.toThrow(
        'Phone number and country code are required for SMS login method',
      );
    });
  });

  describe('completeCheckoutWithToken', () => {
    const mockCustomerData: VisbookUserDto = {
      email: 'customer@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    beforeEach(() => {
      // Setup a reservation in the service
      service['reservations'].set('res_123456', {
        status: 'created',
        encryptedCompanyId: 'enc_company_123',
        webentity: 123,
        createdAt: new Date(),
        lastPing: new Date(),
      });
    });

    it('should successfully complete checkout', async () => {
      const mockValidationResponse = {
        id: 12345,
        email: 'customer@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockCheckoutResponse = {
        terminalUrl: 'https://payment.example.com/terminal/123',
        checkoutStatus: VisbookCheckoutStatus.OK,
        customerId: 'visbook_customer_123',
      };

      const mockBookboostUser = {
        id: 'bb_user_123',
        email: 'customer@example.com',
      };

      mockVisbookService.validate.mockResolvedValue(mockValidationResponse);
      mockVisbookService.checkoutReservation.mockResolvedValue(
        mockCheckoutResponse,
      );
      mockBookboostService.upsertUser.mockResolvedValue(mockBookboostUser);
      mockBookboostService.linkExternalRef.mockResolvedValue(undefined);
      mockBookboostService.tagUser.mockResolvedValue(undefined);

      await service.completeCheckoutWithToken(
        'res_123456',
        123,
        'token_abc123',
        VisbookLoginMethod.EMAIL,
        mockCustomerData,
      );

      expect(mockVisbookService.validate).toHaveBeenCalledWith({
        webentity: 123,
        token: 'token_abc123',
        method: VisbookLoginMethod.EMAIL,
      });

      expect(mockVisbookService.checkoutReservation).toHaveBeenCalledWith({
        webentity: 123,
        reservations: [
          {
            reservationId: 'res_123456',
            encryptedCompanyId: 'enc_company_123',
          },
        ],
        successUrl: 'https://your-domain.com/success',
        errorUrl: 'https://your-domain.com/error',
        paymentType: VisbookPaymentType.NO_ONLINE_PAYMENT,
        amount: 0,
        customer: mockCustomerData,
        acceptedTerms: true,
        externalReference: 'visbook-res_123456',
      });

      expect(mockBookboostService.upsertUser).toHaveBeenCalledWith({
        email: 'customer@example.com',
        phone: undefined,
        first_name: 'John',
        last_name: 'Doe',
        address: undefined,
        city: undefined,
        country: undefined,
        zip_code: undefined,
        company: undefined,
        source: 'visbook',
        external_id: 'visbook_customer_123',
      });

      expect(mockBookboostService.linkExternalRef).toHaveBeenCalledWith(
        'bb_user_123',
        'visbook_customer_123',
      );

      expect(mockBookboostService.tagUser).toHaveBeenCalledWith('bb_user_123', [
        'visbook-guest',
        'recent-checkout',
      ]);

      expect(service.getReservationStatus('res_123456')).toBe('completed');
    });

    it('should handle non-existent reservation', async () => {
      await expect(
        service.completeCheckoutWithToken(
          'res_nonexistent',
          123,
          'token_abc123',
          VisbookLoginMethod.EMAIL,
          mockCustomerData,
        ),
      ).rejects.toThrow('Reservation res_nonexistent not found');
    });

    it('should handle reservation in invalid state', async () => {
      service['reservations'].set('res_failed', {
        status: 'failed',
        encryptedCompanyId: 'enc_company_456',
        webentity: 123,
        createdAt: new Date(),
      });

      await expect(
        service.completeCheckoutWithToken(
          'res_failed',
          123,
          'token_abc123',
          VisbookLoginMethod.EMAIL,
          mockCustomerData,
        ),
      ).rejects.toThrow(
        'Reservation res_failed is not in a valid state for checkout. Status: failed',
      );
    });

    it('should handle validation failure', async () => {
      mockVisbookService.validate.mockResolvedValue(null);

      await expect(
        service.completeCheckoutWithToken(
          'res_123456',
          123,
          'invalid_token',
          VisbookLoginMethod.EMAIL,
          mockCustomerData,
        ),
      ).rejects.toThrow(
        'Guest validation failed - no authentication cookie received',
      );
    });

    it('should handle checkout with expired reservations', async () => {
      const mockValidationResponse = {
        id: 12345,
        email: 'customer@example.com',
      };

      const mockCheckoutResponse = {
        checkoutStatus: VisbookCheckoutStatus.SOME_RESERVATIONS_EXPIRED,
      };

      mockVisbookService.validate.mockResolvedValue(mockValidationResponse);
      mockVisbookService.checkoutReservation.mockResolvedValue(
        mockCheckoutResponse,
      );

      await expect(
        service.completeCheckoutWithToken(
          'res_123456',
          123,
          'token_abc123',
          VisbookLoginMethod.EMAIL,
          mockCustomerData,
        ),
      ).rejects.toThrow('Some reservations expired during checkout');
    });

    it('should handle checkout failure', async () => {
      const mockValidationResponse = {
        id: 12345,
        email: 'customer@example.com',
      };

      const mockCheckoutResponse = {
        checkoutStatus: VisbookCheckoutStatus.NO_PAYMENT,
      };

      mockVisbookService.validate.mockResolvedValue(mockValidationResponse);
      mockVisbookService.checkoutReservation.mockResolvedValue(
        mockCheckoutResponse,
      );

      await expect(
        service.completeCheckoutWithToken(
          'res_123456',
          123,
          'token_abc123',
          VisbookLoginMethod.EMAIL,
          mockCustomerData,
        ),
      ).rejects.toThrow('Checkout failed with status: noPayment');

      expect(service.getReservationStatus('res_123456')).toBe('failed');
    });
  });

  describe('ping functionality', () => {
    beforeEach(() => {
      service['reservations'].set('res_ping_test', {
        status: 'created',
        encryptedCompanyId: 'enc_company_ping',
        webentity: 123,
        createdAt: new Date(),
        lastPing: new Date(),
      });
    });

    it('should successfully ping a reservation', async () => {
      mockVisbookService.pingReservation.mockResolvedValue({ statusCode: 200 });

      await service['pingSpecificReservation']('res_ping_test', 123);

      expect(mockVisbookService.pingReservation).toHaveBeenCalledWith(123);

      const reservationData = service.getReservationData('res_ping_test');
      expect(reservationData?.lastPing).toBeDefined();
    });
  });

  describe('cleanup operations', () => {
    it('should cleanup expired reservations', async () => {
      const oldDate = new Date(Date.now() - 35 * 60 * 1000); // 35 minutes ago

      service['reservations'].set('res_expired', {
        status: 'created',
        encryptedCompanyId: 'enc_company_expired',
        webentity: 123,
        createdAt: oldDate,
      });

      service['reservations'].set('res_recent', {
        status: 'created',
        encryptedCompanyId: 'enc_company_recent',
        webentity: 123,
        createdAt: new Date(),
      });

      await service.cleanupExpiredReservations();

      expect(service.getReservationStatus('res_expired')).toBe('cancelled');
      expect(service.getReservationStatus('res_recent')).toBe('created');
    });

    it('should get ping statistics', () => {
      service['reservations'].set('res_active_1', {
        status: 'created',
        encryptedCompanyId: 'enc1',
        webentity: 123,
        createdAt: new Date(),
      });

      service['reservations'].set('res_active_2', {
        status: 'created',
        encryptedCompanyId: 'enc2',
        webentity: 123,
        createdAt: new Date(),
      });

      service['reservations'].set('res_completed', {
        status: 'completed',
        encryptedCompanyId: 'enc3',
        webentity: 123,
        createdAt: new Date(),
      });

      mockSchedulerRegistry.doesExist.mockReturnValue(true);

      const stats = service.getPingStatistics();

      expect(stats.totalReservations).toBe(3);
      expect(stats.activeReservations).toBe(2);
      expect(stats.scheduledPingJobs).toBe(3);
    });

    it('should cancel a reservation', async () => {
      service['reservations'].set('res_to_cancel', {
        status: 'created',
        encryptedCompanyId: 'enc_cancel',
        webentity: 123,
        createdAt: new Date(),
      });

      await service.cancelReservation('res_to_cancel');

      expect(service.getReservationStatus('res_to_cancel')).toBe('cancelled');
      expect(mockSchedulerRegistry.deleteInterval).toHaveBeenCalled();
    });

    it('should cleanup reservation', () => {
      service['reservations'].set('res_cleanup', {
        status: 'completed',
        encryptedCompanyId: 'enc_cleanup',
        webentity: 123,
        createdAt: new Date(),
      });

      service.cleanupReservation('res_cleanup');

      expect(service.getReservationData('res_cleanup')).toBeUndefined();
      expect(mockSchedulerRegistry.deleteInterval).toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    it('should get all active reservations', () => {
      service['reservations'].set('res_1', {
        status: 'created',
        encryptedCompanyId: 'enc1',
        webentity: 123,
        createdAt: new Date(),
      });

      service['reservations'].set('res_2', {
        status: 'completed',
        encryptedCompanyId: 'enc2',
        webentity: 456,
        createdAt: new Date(),
      });

      const activeReservations = service.getActiveReservations();

      expect(activeReservations.size).toBe(2);
      expect(activeReservations.has('res_1')).toBe(true);
      expect(activeReservations.has('res_2')).toBe(true);
    });

    it('should extract guest data correctly', () => {
      const customerData: VisbookUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        company: 'Test Corp',
        city: 'New York',
        country: 'USA',
        address: '123 Test St',
        zipCode: '10001',
      };

      const checkoutResponse = {
        customerId: 'visbook_123',
      };

      const guestData = service['extractGuestData'](
        customerData,
        checkoutResponse,
      );

      expect(guestData).toEqual({
        email: 'test@example.com',
        phone: '+1234567890',
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Test St',
        city: 'New York',
        country: 'USA',
        zipCode: '10001',
        company: 'Test Corp',
        visbookId: 'visbook_123',
      });
    });

    it('should extract guest data with fallback visbookId', () => {
      const customerData: VisbookUserDto = {
        email: 'test@example.com',
      };

      const checkoutResponse = {};

      const guestData = service['extractGuestData'](
        customerData,
        checkoutResponse,
      );

      expect(guestData.visbookId).toMatch(/^visbook-\d+$/);
    });
  });

  describe('ping health check', () => {
    it('should identify stale reservations and restart ping jobs', async () => {
      const staleDate = new Date(Date.now() - 3 * 60 * 1000); // 3 minutes ago

      service['reservations'].set('res_stale', {
        status: 'created',
        encryptedCompanyId: 'enc_stale',
        webentity: 123,
        createdAt: new Date(),
        lastPing: staleDate,
      });

      service['reservations'].set('res_healthy', {
        status: 'created',
        encryptedCompanyId: 'enc_healthy',
        webentity: 123,
        createdAt: new Date(),
        lastPing: new Date(),
      });

      await service.pingHealthCheck();

      expect(mockSchedulerRegistry.deleteInterval).toHaveBeenCalledWith(
        'ping-reservation-res_stale',
      );
      expect(mockSchedulerRegistry.addInterval).toHaveBeenCalled();
    });
  });
});
