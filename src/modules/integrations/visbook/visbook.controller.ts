import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { VisbookIntegrationService } from './visbook.integration.service';
import { VisbookLoginMethod, VisbookPaymentType } from './visbook.dto';

@Controller('visbook')
export class VisbookController {
  constructor(private readonly visbookService: VisbookIntegrationService) {}

  @Post('initiate-reservation')
  async testInitiateReservation(
    @Body()
    createReservationDto: {
      webentity: number;
      loginMethod: VisbookLoginMethod;
      loginCredentials: {
        email?: string;
        phoneNumber?: string;
        countryCode?: string;
      };
      reservationData: {
        webentity: number;
        fromDate: string;
        toDate: string;
        priceId: string;
        numberOfPeople: number;
        notes?: string;
        guestsNames?: string[];
        guestsAges?: number[];
        additionalServices?: {
          id: string;
          encryptedCompanyId: string;
          count: number;
        }[];
        additionalMerchandises?: {
          id: string;
          encryptedCompanyId: string;
          count: number;
        }[];
        webProductId: string;
      };
    },
  ) {
    const { webentity, loginMethod, loginCredentials, reservationData } =
      createReservationDto;

    try {
      const result = await this.visbookService.initiateReservationAndLogin(
        webentity,
        loginMethod,
        loginCredentials,
        reservationData,
      );

      return {
        success: true,
        data: result,
        message:
          'Reservation initiated successfully. Please check your email/SMS for validation code.',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to initiate reservation',
      };
    }
  }

  @Post('complete-checkout')
  async testCompleteCheckout(
    @Body()
    completeCheckoutDto: {
      reservationId: string;
      webentity: number;
      validationToken: string;
      loginMethod: VisbookLoginMethod;
      customerData: {
        company?: string;
        city?: string;
        country?: string;
        firstName?: string;
        lastName?: string;
        address?: string;
        email: string;
        phone?: string;
        zipCode?: string;
        mobile?: string;
        passportNumber?: string;
        title?: string;
        extra1?: string;
        extra2?: string;
        extra3?: string;
        extra4?: string;
        extra5?: string;
        followupAccepted?: boolean;
        organizationNumber?: string;
      };
      paymentType?: VisbookPaymentType;
      amount?: number;
      successUrl?: string;
      errorUrl?: string;
    },
  ) {
    const {
      reservationId,
      webentity,
      validationToken,
      loginMethod,
      customerData,
      paymentType = VisbookPaymentType.NO_ONLINE_PAYMENT,
      amount = 0,
      successUrl = 'https://your-domain.com/success',
      errorUrl = 'https://your-domain.com/error',
    } = completeCheckoutDto;

    try {
      await this.visbookService.completeCheckoutWithToken(
        reservationId,
        webentity,
        validationToken,
        loginMethod,
        customerData,
        paymentType,
        amount,
        successUrl,
        errorUrl,
      );

      return {
        success: true,
        message:
          'Checkout completed and guest synchronized with Bookboost successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to complete checkout',
      };
    }
  }
}
