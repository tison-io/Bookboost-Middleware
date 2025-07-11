import { Injectable } from '@nestjs/common';
import { visbookConfig } from 'src/config/visbook.config';
import {
  VisbookCheckoutDto,
  VisbookCheckoutResponseDto,
  VisBookCreateReservationResponseDto,
  VisbookLoginDto,
  VisbookLoginMethod,
  VisbookReservationDto,
  VisbookReservationUpdateDto,
} from './visbook.dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class VisbookService {
  constructor(private readonly http: HttpService) {}
  private readonly baseUrl = visbookConfig.BASE_URL;

  private async makeRequest<T>(
    method: AxiosRequestConfig['method'],
    url: string,
    data?: any,
  ): Promise<T> {
    try {
      const response = await lastValueFrom(
        this.http.request<T>({
          method,
          url: `${this.baseUrl}${url}`,
          data,
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }),
      );
      return response.data;
    } catch (error) {
      console.error(`Visbook API request failed: ${error?.response?.data}`);
      throw new Error(
        `Visbook API request failed: ${error?.response?.data?.message}`,
      );
    }
  }

  async login(loginDto: VisbookLoginDto) {
    const { method, webentity, body } = loginDto;
    switch (method) {
      case VisbookLoginMethod.EMAIL:
        return this.makeRequest(
          'POST',
          visbookConfig.LINKS.LOGIN_EMAIL(webentity),
          body,
        );
      case VisbookLoginMethod.SMS:
        return this.makeRequest(
          'POST',
          visbookConfig.LINKS.LOGIN_SMS(webentity),
          body,
        );
      default:
        throw new Error(`Unsupported login method: ${method}`);
    }
  }

  async validate({
    webentity,
    token,
    method,
  }: {
    webentity: number;
    token: string;
    method: VisbookLoginMethod;
  }) {
    switch (method) {
      case VisbookLoginMethod.EMAIL:
        return this.makeRequest(
          'GET',
          visbookConfig.LINKS.VALIDATE_EMAIL(webentity, token),
        );
      case VisbookLoginMethod.SMS:
        return this.makeRequest(
          'GET',
          visbookConfig.LINKS.VALIDATE_MOBILE(webentity, token),
        );
      default:
        throw new Error(`Unsupported validation method: ${method}`);
    }
  }

  async createReservation(
    createReservationDto: VisbookReservationDto,
  ): Promise<VisBookCreateReservationResponseDto> {
    const { webentity, ...reservationData } = createReservationDto;
    return this.makeRequest(
      'POST',
      visbookConfig.LINKS.RESERVATIONS_ADD(webentity),
      reservationData,
    );
  }

  async updateReservation(updateReservationDto: VisbookReservationUpdateDto) {
    const { webentity, encryptedCompanyId, reservationId, ...reservationData } =
      updateReservationDto;
    return this.makeRequest(
      'PUT',
      visbookConfig.LINKS.RESERVATION_UPDATE(
        webentity,
        encryptedCompanyId,
        reservationId,
      ),
      reservationData,
    );
  }

  async pingReservation(webentity: number) {
    return this.makeRequest(
      'POST',
      visbookConfig.LINKS.RESERVATIONS_PING(webentity),
    );
  }
  async checkoutReservation(
    checkoutReservationDto: VisbookCheckoutDto,
  ): Promise<VisbookCheckoutResponseDto> {
    const { webentity, ...checkoutData } = checkoutReservationDto;
    return this.makeRequest<VisbookCheckoutResponseDto>(
      'POST',
      visbookConfig.LINKS.CHECKOUT(webentity),
      checkoutData,
    );
  }
}
