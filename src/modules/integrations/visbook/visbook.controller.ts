import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { VisbookIntegrationService } from './visbook.integration.service';
import {
  VisbookCompleteCheckoutDto,
  VisbookInitiateReservationDto,
  VisbookPaymentType,
} from './visbook.dto';

@ApiTags('VisBook Integration')
@Controller('visbook')
export class VisbookController {
  constructor(private readonly visbookService: VisbookIntegrationService) {}

  @Post('initiate-reservation')
  @ApiOperation({
    summary: 'Initiate reservation with login',
    description:
      'Creates a reservation and sends a login token via email or SMS',
  })
  @ApiBody({
    type: VisbookInitiateReservationDto,
    description: 'Reservation initiation data with login credentials',
  })
  @ApiResponse({
    status: 200,
    description: 'Reservation initiated successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        data: {
          type: 'object',
          description: 'Reservation data',
        },
        message: {
          type: 'string',
          example:
            'Reservation initiated successfully. Please check your email/SMS for validation code.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: false,
        },
        error: {
          type: 'string',
          example: 'Invalid reservation data',
        },
        message: {
          type: 'string',
          example: 'Failed to initiate reservation',
        },
      },
    },
  })
  async testInitiateReservation(
    @Body()
    createReservationDto: VisbookInitiateReservationDto,
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
  @ApiOperation({
    summary: 'Complete checkout with validation token',
    description:
      'Completes the checkout process using a validation token and synchronizes guest data with Bookboost',
  })
  @ApiBody({
    type: VisbookCompleteCheckoutDto,
    description:
      'Checkout completion data with validation token and customer information',
  })
  @ApiResponse({
    status: 200,
    description: 'Checkout completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example:
            'Checkout completed and guest synchronized with Bookboost successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data or validation token',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: false,
        },
        error: {
          type: 'string',
          example: 'Invalid validation token',
        },
        message: {
          type: 'string',
          example: 'Failed to complete checkout',
        },
      },
    },
  })
  async testCompleteCheckout(
    @Body()
    completeCheckoutDto: VisbookCompleteCheckoutDto,
  ) {
    const {
      reservationId,
      webentity,
      validationToken,
      loginMethod,
      customerData,
      paymentType = VisbookPaymentType.NO_ONLINE_PAYMENT,
      amount = 0,
      successUrl = 'https://bookboost.io/success',
      errorUrl = 'https://bookboost.io/error',
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
