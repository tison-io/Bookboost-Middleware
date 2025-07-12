import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VisbookLoginMethod {
  EMAIL = 'email',
  SMS = 'sms',
}
export enum VisbookPaymentType {
  NO_ONLINE_PAYMENT = 'noOnlinePayment',
  NET_AXEPT = 'netAxept',
  PARTIAL_PAYMENT = 'partialPayment',
  INVOICE = 'invoice',
}
export enum VisbookCheckoutStatus {
  OK = 'ok',
  SOME_RESERVATIONS_EXPIRED = 'someReservationsExpired',
  NO_PAYMENT = 'noPayment',
  INVOICE_PAYMENT = 'invoicePayment',
  PAYMENT_WITH_GIFTCARDS_ERROR = 'paymentWithGiftcardsError',
}

interface VisbookLoginBodyDto {
  [VisbookLoginMethod.EMAIL]: {
    email: string;
  };
  [VisbookLoginMethod.SMS]: {
    phoneNumber: string;
    countryCode: string;
  };
}

export class VisbookLoginDto {
  method: VisbookLoginMethod;
  webentity: number;
  body: VisbookLoginBodyDto[VisbookLoginMethod];
}

export class VisbookReservationDto {
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
}

export class VisbookReservationUpdateDto {
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
  encryptedCompanyId: string;
  reservationId: number;
}

export class VisBookCreateReservationResponseDto {
  reservationId: string;
  encryptedCompanyId: string;
}

export class VisbookCheckoutDto {
  webentity: number;
  reservations: {
    reservationId: string;
    encryptedCompanyId: string;
  }[];
  successUrl: string;
  errorUrl: string;
  paymentType: VisbookPaymentType;
  amount: number;
  customer: VisbookUserDto;
  acceptedTerms: boolean;
  externalReference?: string;
  notes?: string;
  giftcards?: string[];
}

export class VisbookCheckoutResponseDto {
  terminalUrl: string;
  checkoutStatus: VisbookCheckoutStatus;
  expiredReservations?: {
    reservationId: string;
    encryptedCompanyId: string;
  }[];
  giftcardsBalance?: Record<string, number>;
}

export class VisbookUserDto {
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
}

export class VisbookInitiateReservationDto {
  @ApiProperty({
    description: 'Web entity identifier',
    example: 123,
    type: Number,
  })
  webentity: number;

  @ApiProperty({
    description: 'Login method to use for authentication',
    enum: VisbookLoginMethod,
    example: VisbookLoginMethod.EMAIL,
  })
  loginMethod: VisbookLoginMethod;

  @ApiProperty({
    description: 'Login credentials based on the selected method',
    type: 'object',
    properties: {
      email: {
        type: 'string',
        description: 'Email address (required for EMAIL method)',
        example: 'user@example.com',
      },
      phoneNumber: {
        type: 'string',
        description: 'Phone number (required for SMS method)',
        example: '+1234567890',
      },
      countryCode: {
        type: 'string',
        description: 'Country code (required for SMS method)',
        example: '1',
      },
    },
  })
  loginCredentials: {
    email?: string;
    phoneNumber?: string;
    countryCode?: string;
  };

  @ApiProperty({
    description: 'Reservation data details',
    type: 'object',
    properties: {
      webentity: {
        type: 'number',
        description: 'Web entity identifier',
        example: 123,
      },
      fromDate: {
        type: 'string',
        format: 'date-time',
        description: 'Check-in date',
        example: '2025-07-15T00:00:00.000Z',
      },
      toDate: {
        type: 'string',
        format: 'date-time',
        description: 'Check-out date',
        example: '2025-07-17T00:00:00.000Z',
      },
      priceId: {
        type: 'string',
        description: 'Price identifier',
        example: '789',
      },
      numberOfPeople: {
        type: 'number',
        description: 'Number of guests',
        example: 2,
      },
      webProductId: {
        type: 'string',
        description: 'Product identifier',
        example: '456',
      },
      notes: {
        type: 'string',
        description: 'Additional notes',
        required: false,
      },
      guestsNames: {
        type: 'array',
        items: { type: 'string' },
        description: 'Names of guests',
        required: false,
      },
      guestsAges: {
        type: 'array',
        items: { type: 'number' },
        description: 'Ages of guests',
        required: false,
      },
    },
  })
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
}

export class VisbookCompleteCheckoutDto {
  @ApiProperty({
    description: 'Reservation identifier',
    example: 'res_123456',
    type: String,
  })
  reservationId: string;

  @ApiProperty({
    description: 'Web entity identifier',
    example: 123,
    type: Number,
  })
  webentity: number;

  @ApiProperty({
    description: 'Validation token received from login',
    example: 'token_abc123',
    type: String,
  })
  validationToken: string;

  @ApiProperty({
    description: 'Login method used for authentication',
    enum: VisbookLoginMethod,
    example: VisbookLoginMethod.EMAIL,
  })
  loginMethod: VisbookLoginMethod;

  @ApiProperty({
    description: 'Customer data for the reservation',
    type: 'object',
    properties: {
      email: {
        type: 'string',
        description: 'Customer email address',
        example: 'customer@example.com',
      },
      firstName: {
        type: 'string',
        description: 'Customer first name',
        example: 'John',
      },
      lastName: {
        type: 'string',
        description: 'Customer last name',
        example: 'Doe',
      },
      company: {
        type: 'string',
        description: 'Company name',
        required: false,
      },
      city: {
        type: 'string',
        description: 'City',
        required: false,
      },
      country: {
        type: 'string',
        description: 'Country',
        required: false,
      },
      address: {
        type: 'string',
        description: 'Address',
        required: false,
      },
      phone: {
        type: 'string',
        description: 'Phone number',
        required: false,
      },
      zipCode: {
        type: 'string',
        description: 'ZIP code',
        required: false,
      },
    },
  })
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

  @ApiPropertyOptional({
    description: 'Payment type for the checkout',
    enum: VisbookPaymentType,
    example: VisbookPaymentType.NO_ONLINE_PAYMENT,
  })
  paymentType?: VisbookPaymentType;

  @ApiPropertyOptional({
    description: 'Total amount for the reservation',
    example: 99.99,
    type: Number,
  })
  amount?: number;

  @ApiPropertyOptional({
    description: 'Success URL for payment redirect',
    example: 'https://your-domain.com/success',
    type: String,
  })
  successUrl?: string;

  @ApiPropertyOptional({
    description: 'Error URL for payment redirect',
    example: 'https://your-domain.com/error',
    type: String,
  })
  errorUrl?: string;
}
