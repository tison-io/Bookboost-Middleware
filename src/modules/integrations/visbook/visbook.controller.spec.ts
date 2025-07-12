import { Test, TestingModule } from '@nestjs/testing';
import { VisbookController } from './visbook.controller';
import { VisbookIntegrationService } from './visbook.integration.service';
import {
  VisbookInitiateReservationDto,
  VisbookCompleteCheckoutDto,
  VisbookLoginMethod,
  VisbookPaymentType,
} from './visbook.dto';

describe('VisbookController', () => {
  let controller: VisbookController;
  let integrationService: VisbookIntegrationService;

  const mockIntegrationService = {
    initiateReservationAndLogin: jest.fn(),
    completeCheckoutWithToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisbookController],
      providers: [
        {
          provide: VisbookIntegrationService,
          useValue: mockIntegrationService,
        },
      ],
    }).compile();

    controller = module.get<VisbookController>(VisbookController);
    integrationService = module.get<VisbookIntegrationService>(
      VisbookIntegrationService,
    );

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('testInitiateReservation', () => {
    it('should successfully initiate a reservation with email login', async () => {
      const mockResult = {
        reservationId: 'res_123456',
        message:
          'Login code sent via email. Please use completeCheckoutWithToken() with the received code.',
      };

      mockIntegrationService.initiateReservationAndLogin.mockResolvedValue(
        mockResult,
      );

      const initiateReservationDto: VisbookInitiateReservationDto = {
        webentity: 123,
        loginMethod: VisbookLoginMethod.EMAIL,
        loginCredentials: {
          email: 'test@example.com',
        },
        reservationData: {
          webentity: 123,
          fromDate: '2025-07-15T00:00:00.000Z',
          toDate: '2025-07-17T00:00:00.000Z',
          priceId: '789',
          numberOfPeople: 2,
          webProductId: '456',
        },
      };

      const result = await controller.testInitiateReservation(
        initiateReservationDto,
      );

      expect(
        mockIntegrationService.initiateReservationAndLogin,
      ).toHaveBeenCalledWith(
        123,
        VisbookLoginMethod.EMAIL,
        { email: 'test@example.com' },
        {
          webentity: 123,
          fromDate: '2025-07-15T00:00:00.000Z',
          toDate: '2025-07-17T00:00:00.000Z',
          priceId: '789',
          numberOfPeople: 2,
          webProductId: '456',
        },
      );

      expect(result).toEqual({
        success: true,
        data: mockResult,
        message:
          'Reservation initiated successfully. Please check your email/SMS for validation code.',
      });
    });

    it('should successfully initiate a reservation with SMS login', async () => {
      const mockResult = {
        reservationId: 'res_789012',
        message:
          'Login code sent via sms. Please use completeCheckoutWithToken() with the received code.',
      };

      mockIntegrationService.initiateReservationAndLogin.mockResolvedValue(
        mockResult,
      );

      const initiateReservationDto: VisbookInitiateReservationDto = {
        webentity: 456,
        loginMethod: VisbookLoginMethod.SMS,
        loginCredentials: {
          phoneNumber: '+1234567890',
          countryCode: '1',
        },
        reservationData: {
          webentity: 456,
          fromDate: '2025-08-01T00:00:00.000Z',
          toDate: '2025-08-03T00:00:00.000Z',
          priceId: '999',
          numberOfPeople: 4,
          webProductId: '789',
          notes: 'Special request',
          guestsNames: ['John Doe', 'Jane Doe'],
        },
      };

      const result = await controller.testInitiateReservation(
        initiateReservationDto,
      );

      expect(
        mockIntegrationService.initiateReservationAndLogin,
      ).toHaveBeenCalledWith(
        456,
        VisbookLoginMethod.SMS,
        { phoneNumber: '+1234567890', countryCode: '1' },
        {
          webentity: 456,
          fromDate: '2025-08-01T00:00:00.000Z',
          toDate: '2025-08-03T00:00:00.000Z',
          priceId: '999',
          numberOfPeople: 4,
          webProductId: '789',
          notes: 'Special request',
          guestsNames: ['John Doe', 'Jane Doe'],
        },
      );

      expect(result).toEqual({
        success: true,
        data: mockResult,
        message:
          'Reservation initiated successfully. Please check your email/SMS for validation code.',
      });
    });

    it('should handle errors during reservation initiation', async () => {
      const mockError = new Error('Failed to create reservation');
      mockIntegrationService.initiateReservationAndLogin.mockRejectedValue(
        mockError,
      );

      const initiateReservationDto: VisbookInitiateReservationDto = {
        webentity: 123,
        loginMethod: VisbookLoginMethod.EMAIL,
        loginCredentials: {
          email: 'invalid@example.com',
        },
        reservationData: {
          webentity: 123,
          fromDate: '2025-07-15T00:00:00.000Z',
          toDate: '2025-07-17T00:00:00.000Z',
          priceId: '789',
          numberOfPeople: 2,
          webProductId: '456',
        },
      };

      const result = await controller.testInitiateReservation(
        initiateReservationDto,
      );

      expect(result).toEqual({
        success: false,
        error: 'Failed to create reservation',
        message: 'Failed to initiate reservation',
      });
    });
  });

  describe('testCompleteCheckout', () => {
    it('should successfully complete checkout with minimal data', async () => {
      mockIntegrationService.completeCheckoutWithToken.mockResolvedValue(
        undefined,
      );

      const completeCheckoutDto: VisbookCompleteCheckoutDto = {
        reservationId: 'res_123456',
        webentity: 123,
        validationToken: 'token_abc123',
        loginMethod: VisbookLoginMethod.EMAIL,
        customerData: {
          email: 'customer@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const result = await controller.testCompleteCheckout(completeCheckoutDto);

      expect(
        mockIntegrationService.completeCheckoutWithToken,
      ).toHaveBeenCalledWith(
        'res_123456',
        123,
        'token_abc123',
        VisbookLoginMethod.EMAIL,
        {
          email: 'customer@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        VisbookPaymentType.NO_ONLINE_PAYMENT,
        0,
        'https://your-domain.com/success',
        'https://your-domain.com/error',
      );

      expect(result).toEqual({
        success: true,
        message:
          'Checkout completed and guest synchronized with Bookboost successfully',
      });
    });

    it('should successfully complete checkout with full data', async () => {
      mockIntegrationService.completeCheckoutWithToken.mockResolvedValue(
        undefined,
      );

      const completeCheckoutDto: VisbookCompleteCheckoutDto = {
        reservationId: 'res_789012',
        webentity: 456,
        validationToken: 'token_xyz789',
        loginMethod: VisbookLoginMethod.SMS,
        customerData: {
          email: 'customer@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          company: 'ABC Corp',
          city: 'New York',
          country: 'USA',
          address: '123 Main St',
          phone: '+1234567890',
          zipCode: '10001',
        },
        paymentType: VisbookPaymentType.NET_AXEPT,
        amount: 299.99,
        successUrl: 'https://custom-domain.com/success',
        errorUrl: 'https://custom-domain.com/error',
      };

      const result = await controller.testCompleteCheckout(completeCheckoutDto);

      expect(
        mockIntegrationService.completeCheckoutWithToken,
      ).toHaveBeenCalledWith(
        'res_789012',
        456,
        'token_xyz789',
        VisbookLoginMethod.SMS,
        {
          email: 'customer@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          company: 'ABC Corp',
          city: 'New York',
          country: 'USA',
          address: '123 Main St',
          phone: '+1234567890',
          zipCode: '10001',
        },
        VisbookPaymentType.NET_AXEPT,
        299.99,
        'https://custom-domain.com/success',
        'https://custom-domain.com/error',
      );

      expect(result).toEqual({
        success: true,
        message:
          'Checkout completed and guest synchronized with Bookboost successfully',
      });
    });

    it('should handle errors during checkout completion', async () => {
      const mockError = new Error('Invalid validation token');
      mockIntegrationService.completeCheckoutWithToken.mockRejectedValue(
        mockError,
      );

      const completeCheckoutDto: VisbookCompleteCheckoutDto = {
        reservationId: 'res_invalid',
        webentity: 123,
        validationToken: 'invalid_token',
        loginMethod: VisbookLoginMethod.EMAIL,
        customerData: {
          email: 'customer@example.com',
        },
      };

      const result = await controller.testCompleteCheckout(completeCheckoutDto);

      expect(result).toEqual({
        success: false,
        error: 'Invalid validation token',
        message: 'Failed to complete checkout',
      });
    });

    it('should use default values for optional parameters', async () => {
      mockIntegrationService.completeCheckoutWithToken.mockResolvedValue(
        undefined,
      );

      const completeCheckoutDto: VisbookCompleteCheckoutDto = {
        reservationId: 'res_defaults',
        webentity: 999,
        validationToken: 'token_defaults',
        loginMethod: VisbookLoginMethod.EMAIL,
        customerData: {
          email: 'defaults@example.com',
        },
      };

      await controller.testCompleteCheckout(completeCheckoutDto);

      expect(
        mockIntegrationService.completeCheckoutWithToken,
      ).toHaveBeenCalledWith(
        'res_defaults',
        999,
        'token_defaults',
        VisbookLoginMethod.EMAIL,
        {
          email: 'defaults@example.com',
        },
        VisbookPaymentType.NO_ONLINE_PAYMENT,
        0,
        'https://your-domain.com/success',
        'https://your-domain.com/error',
      );
    });
  });
});
