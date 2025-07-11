import { BookboostService } from 'src/modules/bookboost/bookboost.service';
import {
  VisbookReservationDto,
  VisbookLoginMethod,
  VisbookPaymentType,
  VisbookCheckoutStatus,
  VisbookUserDto,
} from './visbook.dto';
import { VisbookService } from './visbook.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class VisbookIntegrationService {
  private reservations: Map<
    string,
    {
      status: string;
      encryptedCompanyId?: string;
      webentity: number;
      createdAt: Date;
      lastPing?: Date;
    }
  > = new Map();
  private readonly logger = new Logger(VisbookIntegrationService.name);

  constructor(
    private readonly visbookService: VisbookService,
    private readonly bookboostService: BookboostService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  /**
   * Phase 1: Create reservation and request login code
   * Returns the reservation ID for use in Phase 2
   */
  async initiateReservationAndLogin(
    webentity: number,
    loginMethod: VisbookLoginMethod,
    loginCredentials: {
      email?: string;
      phoneNumber?: string;
      countryCode?: string;
    },
    createReservationDto: VisbookReservationDto,
  ): Promise<{ reservationId: string; message: string }> {
    let reservationId: string | null = null;

    try {
      // Step 1: Create product reservations via /reservations endpoint
      this.logger.log('Creating reservation in Visbook...');
      const reservationResponse =
        await this.visbookService.createReservation(createReservationDto);

      reservationId = reservationResponse.reservationId;
      if (!reservationId) {
        throw new Error('Failed to get reservation ID from Visbook response');
      }

      // Track reservation status and encrypted company ID
      this.reservations.set(reservationId, {
        status: 'created',
        encryptedCompanyId: reservationResponse.encryptedCompanyId,
        webentity,
        createdAt: new Date(),
        lastPing: new Date(),
      });
      this.logger.log(`Reservation created with ID: ${reservationId}`);

      // Step 2: Schedule ping job for this specific reservation
      this.scheduleReservationPing(reservationId, webentity);

      // Step 3: Request login code via /login endpoint
      this.logger.log('Requesting login code...');
      const loginBody = this.buildLoginBody(loginMethod, loginCredentials);

      await this.visbookService.login({
        method: loginMethod,
        webentity,
        body: loginBody,
      });

      this.logger.log('Login code sent successfully');

      return {
        reservationId,
        message: `Login code sent via ${loginMethod}. Please use completeCheckoutWithToken() with the received code.`,
      };
    } catch (error) {
      this.logger.error('Error in reservation and login initiation:', error);

      // Update reservation status to failed
      if (reservationId) {
        const existingData = this.reservations.get(reservationId);
        this.reservations.set(reservationId, {
          ...existingData,
          webentity: existingData?.webentity as number,
          createdAt: existingData?.createdAt || new Date(),
          lastPing: existingData?.lastPing || new Date(),
          status: 'failed',
        });
        // Clean up scheduled ping
        this.unscheduleReservationPing(reservationId);
      }

      throw error;
    }
  }

  /**
   * Phase 2: Complete the checkout process with validation token
   */
  async completeCheckoutWithToken(
    reservationId: string,
    webentity: number,
    validationToken: string,
    loginMethod: VisbookLoginMethod,
    customerData: VisbookUserDto,
    paymentType: VisbookPaymentType = VisbookPaymentType.NO_ONLINE_PAYMENT,
    amount: number = 0,
    successUrl: string = 'https://your-domain.com/success',
    errorUrl: string = 'https://your-domain.com/error',
  ): Promise<void> {
    try {
      // Get reservation details for checkout
      const reservationData = this.reservations.get(reservationId);
      if (!reservationData) {
        throw new Error(`Reservation ${reservationId} not found`);
      }

      if (reservationData.status !== 'created') {
        throw new Error(
          `Reservation ${reservationId} is not in a valid state for checkout. Status: ${reservationData.status}`,
        );
      }

      // Validate the token to get authentication cookie
      this.logger.log('Validating authentication token...');
      const validationResponse = await this.visbookService.validate({
        webentity,
        token: validationToken,
        method: loginMethod,
      });

      if (!validationResponse) {
        throw new Error(
          'Guest validation failed - no authentication cookie received',
        );
      }

      this.logger.log(
        'Guest validated successfully, authentication cookie received',
      );

      // Complete the order via /checkout
      this.logger.log('Processing checkout with authentication cookie...');
      const checkoutResponse = await this.visbookService.checkoutReservation({
        webentity,
        reservations: [
          {
            reservationId,
            encryptedCompanyId: reservationData.encryptedCompanyId!,
          },
        ],
        successUrl,
        errorUrl,
        paymentType,
        amount,
        customer: customerData,
        acceptedTerms: true,
        externalReference: `visbook-${reservationId}`,
      });

      // Check checkout status
      if (
        checkoutResponse.checkoutStatus ===
        VisbookCheckoutStatus.SOME_RESERVATIONS_EXPIRED
      ) {
        this.logger.warn('Some reservations expired during checkout');
        throw new Error('Some reservations expired during checkout');
      }

      if (checkoutResponse.checkoutStatus !== VisbookCheckoutStatus.OK) {
        throw new Error(
          `Checkout failed with status: ${checkoutResponse.checkoutStatus}`,
        );
      }

      this.reservations.set(reservationId, {
        ...reservationData,
        status: 'completed',
      });
      this.logger.log('Checkout completed successfully');

      // Extract guest information and sync with Bookboost
      const guestData = this.extractGuestData(customerData, checkoutResponse);

      this.logger.log('Synchronizing guest profile with Bookboost...');
      const bookboostUser = await this.bookboostService.upsertUser({
        email: guestData.email,
        phone: guestData.phone,
        first_name: guestData.firstName,
        last_name: guestData.lastName,
        address: guestData.address,
        city: guestData.city,
        country: guestData.country,
        zip_code: guestData.zipCode,
        company: guestData.company,
        source: 'visbook',
        external_id: guestData.visbookId,
      });

      // Link external reference
      if (bookboostUser.id && guestData.visbookId) {
        await this.bookboostService.linkExternalRef(
          bookboostUser.id,
          guestData.visbookId,
        );
      }

      // Tag user for segmentation
      await this.bookboostService.tagUser(bookboostUser.id, [
        'visbook-guest',
        'recent-checkout',
      ]);

      this.logger.log('Guest profile synchronized successfully');

      // Clean up scheduled ping
      this.unscheduleReservationPing(reservationId);
    } catch (error) {
      this.logger.error('Error completing checkout with token:', error);

      const reservationData = this.reservations.get(reservationId);
      this.reservations.set(reservationId, {
        ...reservationData,
        webentity: reservationData?.webentity as number,
        createdAt: reservationData?.createdAt || new Date(),
        lastPing: reservationData?.lastPing || new Date(),
        status: 'failed',
      });

      throw error;
    }
  }

  /**
   * Schedule ping job for a specific reservation
   */
  private scheduleReservationPing(
    reservationId: string,
    webentity: number,
  ): void {
    const jobName = `ping-reservation-${reservationId}`;

    try {
      // Create interval job that runs every 35 seconds
      const interval = setInterval(async () => {
        await this.pingSpecificReservation(reservationId, webentity);
      }, 35000);

      // Add to scheduler registry for proper management
      this.schedulerRegistry.addInterval(jobName, interval);

      this.logger.debug(`Scheduled ping job for reservation ${reservationId}`);
    } catch (error) {
      this.logger.error(
        `Failed to schedule ping for reservation ${reservationId}:`,
        error,
      );
    }
  }

  /**
   * Unschedule ping job for a specific reservation
   */
  private unscheduleReservationPing(reservationId: string): void {
    const jobName = `ping-reservation-${reservationId}`;

    try {
      if (this.schedulerRegistry.doesExist('interval', jobName)) {
        this.schedulerRegistry.deleteInterval(jobName);
        this.logger.debug(
          `Unscheduled ping job for reservation ${reservationId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to unschedule ping for reservation ${reservationId}:`,
        error,
      );
    }
  }

  /**
   * Ping a specific reservation
   */
  private async pingSpecificReservation(
    reservationId: string,
    webentity: number,
  ): Promise<void> {
    try {
      const reservationData = this.reservations.get(reservationId);

      if (!reservationData) {
        this.logger.warn(
          `Reservation ${reservationId} not found, stopping pings`,
        );
        this.unscheduleReservationPing(reservationId);
        return;
      }

      if (reservationData.status !== 'created') {
        this.logger.debug(
          `Reservation ${reservationId} status is ${reservationData.status}, stopping pings`,
        );
        this.unscheduleReservationPing(reservationId);
        return;
      }

      await this.visbookService.pingReservation(webentity);

      // Update last ping time
      this.reservations.set(reservationId, {
        ...reservationData,
        lastPing: new Date(),
      });

      this.logger.debug(`Successfully pinged reservation ${reservationId}`);
    } catch (error) {
      this.logger.error(`Failed to ping reservation ${reservationId}:`, error);

      // Optionally mark reservation as failed after multiple ping failures
      const reservationData = this.reservations.get(reservationId);
      if (reservationData) {
        this.reservations.set(reservationId, {
          ...reservationData,
          status: 'ping_failed',
        });
      }

      this.unscheduleReservationPing(reservationId);
    }
  }

  /**
   * Cleanup expired reservations (runs every 5 minutes)
   */
  @Cron('0 */5 * * * *', {
    name: 'cleanup-expired-reservations',
  })
  async cleanupExpiredReservations(): Promise<void> {
    try {
      const now = new Date();
      const expiredReservations: string[] = [];

      for (const [reservationId, data] of this.reservations.entries()) {
        // Consider reservations older than 30 minutes as expired
        const minutesSinceCreation =
          (now.getTime() - data.createdAt.getTime()) / (1000 * 60);

        if (
          minutesSinceCreation > 30 &&
          (data.status === 'created' || data.status === 'ping_failed')
        ) {
          expiredReservations.push(reservationId);
        }
      }

      if (expiredReservations.length > 0) {
        this.logger.log(
          `Cleaning up ${expiredReservations.length} expired reservations`,
        );

        for (const reservationId of expiredReservations) {
          await this.cancelReservation(reservationId);
        }
      }
    } catch (error) {
      this.logger.error('Error during expired reservations cleanup:', error);
    }
  }

  /**
   * Health check for reservation pings (runs every minute)
   */
  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'ping-health-check',
  })
  async pingHealthCheck(): Promise<void> {
    try {
      const now = new Date();
      let healthyReservations = 0;
      let staleReservations = 0;

      for (const [reservationId, data] of this.reservations.entries()) {
        if (data.status === 'created') {
          const minutesSinceLastPing = data.lastPing
            ? (now.getTime() - data.lastPing.getTime()) / (1000 * 60)
            : 999;

          if (minutesSinceLastPing > 2) {
            // No ping in last 2 minutes
            staleReservations++;
            this.logger.warn(
              `Reservation ${reservationId} has stale ping (${minutesSinceLastPing.toFixed(1)} minutes ago)`,
            );

            // Restart ping job if it seems to have failed
            this.unscheduleReservationPing(reservationId);
            this.scheduleReservationPing(reservationId, data.webentity);
          } else {
            healthyReservations++;
          }
        }
      }

      if (healthyReservations > 0 || staleReservations > 0) {
        this.logger.debug(
          `Ping health check: ${healthyReservations} healthy, ${staleReservations} stale reservations`,
        );
      }
    } catch (error) {
      this.logger.error('Error during ping health check:', error);
    }
  }

  /**
   * Build login body based on method and credentials
   */
  private buildLoginBody(
    method: VisbookLoginMethod,
    credentials: { email?: string; phoneNumber?: string; countryCode?: string },
  ): any {
    switch (method) {
      case VisbookLoginMethod.EMAIL:
        if (!credentials.email) {
          throw new Error('Email is required for email login method');
        }
        return { email: credentials.email };
      case VisbookLoginMethod.SMS:
        if (!credentials.phoneNumber || !credentials.countryCode) {
          throw new Error(
            'Phone number and country code are required for SMS login method',
          );
        }
        return {
          phoneNumber: credentials.phoneNumber,
          countryCode: credentials.countryCode,
        };
      default:
        throw new Error(`Unsupported login method: ${method}`);
    }
  }

  /**
   * Extract guest data from customer data and checkout response
   */
  private extractGuestData(
    customerData: VisbookUserDto,
    checkoutResponse: any,
  ): {
    email: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    visbookId?: string;
    address?: string;
    city?: string;
    country?: string;
    zipCode?: string;
    company?: string;
  } {
    return {
      email: customerData.email,
      phone: customerData.phone || customerData.mobile,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      address: customerData.address,
      city: customerData.city,
      country: customerData.country,
      zipCode: customerData.zipCode,
      company: customerData.company,
      visbookId:
        checkoutResponse.customerId ||
        checkoutResponse.guestId ||
        `visbook-${Date.now()}`,
    };
  }

  /**
   * Get reservation status
   */
  getReservationStatus(reservationId: string): string | undefined {
    return this.reservations.get(reservationId)?.status;
  }

  /**
   * Get reservation data
   */
  getReservationData(reservationId: string):
    | {
        status: string;
        encryptedCompanyId?: string;
        webentity?: number;
        createdAt?: Date;
        lastPing?: Date;
      }
    | undefined {
    return this.reservations.get(reservationId);
  }

  /**
   * Clean up completed or failed reservations
   */
  cleanupReservation(reservationId: string): void {
    this.reservations.delete(reservationId);
    this.unscheduleReservationPing(reservationId);
  }

  /**
   * Get all active reservations
   */
  getActiveReservations(): Map<
    string,
    {
      status: string;
      encryptedCompanyId?: string;
      webentity?: number;
      createdAt?: Date;
      lastPing?: Date;
    }
  > {
    return new Map(this.reservations);
  }

  /**
   * Cancel a reservation and clean up resources
   */
  async cancelReservation(reservationId: string): Promise<void> {
    const reservationData = this.reservations.get(reservationId);
    if (reservationData) {
      this.reservations.set(reservationId, {
        ...reservationData,
        status: 'cancelled',
      });
      this.unscheduleReservationPing(reservationId);
      this.logger.log(`Reservation ${reservationId} cancelled`);
    }
  }

  /**
   * Get ping statistics
   */
  getPingStatistics(): {
    totalReservations: number;
    activeReservations: number;
    scheduledPingJobs: number;
  } {
    const totalReservations = this.reservations.size;
    const activeReservations = Array.from(this.reservations.values()).filter(
      (data) => data.status === 'created',
    ).length;

    // Count scheduled ping jobs
    const scheduledPingJobs = Array.from(this.reservations.keys()).filter(
      (reservationId) => {
        const jobName = `ping-reservation-${reservationId}`;
        return this.schedulerRegistry.doesExist('interval', jobName);
      },
    ).length;

    return {
      totalReservations,
      activeReservations,
      scheduledPingJobs,
    };
  }

  /**
   * Combined method for backward compatibility
   */
  async customerRegistrationAndSynchronization(
    webentity: number,
    loginMethod: VisbookLoginMethod,
    loginCredentials: {
      email?: string;
      phoneNumber?: string;
      countryCode?: string;
    },
    createReservationDto: VisbookReservationDto,
    customerData: VisbookUserDto,
    paymentType: VisbookPaymentType = VisbookPaymentType.NO_ONLINE_PAYMENT,
  ): Promise<{ reservationId: string; message: string }> {
    const result = await this.initiateReservationAndLogin(
      webentity,
      loginMethod,
      loginCredentials,
      createReservationDto,
    );

    this.logger.warn(
      'Manual intervention required: User must provide validation token to complete checkout',
    );

    return result;
  }
}
