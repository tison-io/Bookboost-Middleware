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
