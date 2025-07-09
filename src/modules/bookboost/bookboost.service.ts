import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';
import { bookboostConfig } from '../../config/bookboost.config';

@Injectable()
export class BookboostService {
  private readonly baseUrl = bookboostConfig.BASE_URL;
  private readonly token = bookboostConfig.TOKEN;

  constructor(private readonly http: HttpService) {}

  private getHeaders(): AxiosRequestConfig['headers'] {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create or update a user in Bookboost CDP
   */
  async upsertUser(userPayload: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/users`, userPayload, {
          headers: this.getHeaders(),
        }),
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'upsertUser');
    }
  }

  /**
   * Link an external system's ID to a Bookboost user
   */
  async linkExternalRef(userId: string, externalId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/user-external-reference`,
          {
            user_id: userId,
            external_id: externalId,
            source: 'visbook',
          },
          { headers: this.getHeaders() },
        ),
      );
    } catch (error) {
      this.handleError(error, 'linkExternalRef');
    }
  }

  /**
   * Optional: Attach tags to a user (for segmentation/automation)
   */
  async tagUser(userId: string, tags: string[]): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/user-tags`,
          {
            user_id: userId,
            tags,
          },
          { headers: this.getHeaders() },
        ),
      );
    } catch (error) {
      this.handleError(error, 'tagUser');
    }
  }

  /**
   * Send a message (email/SMS) to a user
   */
  async sendMessage(payload: {
    user_id: string;
    message: string;
    channel: 'email' | 'sms';
  }): Promise<void> {
    try {
      const url =
        payload.channel === 'email'
          ? `${this.baseUrl}/message/email`
          : `${this.baseUrl}/message/sms`;

      await firstValueFrom(
        this.http.post(url, payload, { headers: this.getHeaders() }),
      );
    } catch (error) {
      this.handleError(error, 'sendMessage');
    }
  }

  /**
   * Handle and log Bookboost API errors
   */
  private handleError(error: any, method: string) {
    const msg = `[BookboostService:${method}] ${error?.response?.data?.message || error.message}`;
    const status = error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    console.error(msg, error?.response?.data || {});
    throw new HttpException(msg, status);
  }
}
