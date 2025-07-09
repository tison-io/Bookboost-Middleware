export const visbookConfig = {
  BASE_URL: process.env.VISBOOK_BASE_URL || 'https://ws.visbook.com',
  LINKS: {
    // Availability & Calendar
    AVAILABILITY_CALENDAR: (
      webentity: number,
      webProductsIds: string,
      month: string,
    ) => {
      return `/api/${webentity}/availability/${webProductsIds}/${month}`;
    },
    // Checkout & Payment
    CHECKOUT: (webentity: number) => `/api/${webentity}/checkout`,
    CHECKOUT_USERINFO: (webentity: number) =>
      `/api/${webentity}/checkout/userinfo`,
    CHECKOUT_PAYMENT_TYPES: (webentity: number) =>
      `/api/${webentity}/checkout/paymenttypes`,
    CHECKOUT_PAY_ORDER: (webentity: number) =>
      `/api/${webentity}/checkout/payorder`,

    PRICING_CALENDAR: (webentity: number) =>
      `/api/${webentity}/pricingcalendar`,

    // Web Products
    WEB_PRODUCTS: (webentity: number) => `/api/${webentity}/webproducts`,
    WEB_PRODUCTS_PERIOD: (webentity: number, from: string, to: string) =>
      `/api/${webentity}/webproducts/${from}/${to}`,
    WEB_PRODUCT_BY_ID: (
      webentity: number,
      from: string,
      to: string,
      webProductId: string,
    ) => `/api/${webentity}/webproducts/${from}/${to}/${webProductId}`,

    // Reservations
    RESERVATIONS_ADD: (webentity: number) => `/api/${webentity}/reservations`,
    RESERVATIONS_DELETE: (webentity: number) =>
      `/api/${webentity}/reservations`,
    RESERVATIONS_PING: (webentity: number) =>
      `/api/${webentity}/reservations/ping`,
    RESERVATION_UPDATE: (
      webentity: number,
      encryptedCompanyId: string,
      reservationId: number,
    ) =>
      `/api/${webentity}/reservations/${encryptedCompanyId}/${reservationId}`,

    // Authentication & Validation
    LOGIN_EMAIL: (webentity: number) => `/api/${webentity}/login/request/email`,
    LOGIN_SMS: (webentity: number) => `/api/${webentity}/login/request/sms`,
    LOGOUT: (webentity: number) => `/api/${webentity}/logout`,
    VALIDATE_EMAIL: (webentity: number, token: string) =>
      `/api/${webentity}/validation/email/${token}`,
    VALIDATE_MOBILE: (webentity: number, token: string) =>
      `/api/${webentity}/validation/mobile/${token}`,

    // Orders & Order Groups
    ORDERS: (webentity: number) => `/api/${webentity}/orders`,
    ORDER_BY_ID: (webentity: number, id: string) =>
      `/api/${webentity}/orders/${id}`,
    ORDER_GROUPS_GET: (webentity: number) => `/api/${webentity}/ordergroups`,
    ORDER_GROUPS_REFUND: (webentity: number) => `/api/${webentity}/ordergroups`,
    ORDER_GROUP_BY_ID: (webentity: number, id: string) =>
      `/api/${webentity}/ordergroups/${id}`,
    PDF_ORDER: (
      webentity: number,
      encryptedCompanyId: string,
      orderId: string,
    ) => `/api/${webentity}/pdf/${encryptedCompanyId}/${orderId}`,
    PDF_STREAM: (
      webentity: number,
      encryptedCompanyId: string,
      orderId: string,
      visdocId: string,
    ) => `/api/${webentity}/pdf/${encryptedCompanyId}/${orderId}/${visdocId}`,
    RELEASE_CHANGELOG: (webentity: number) =>
      `/api/${webentity}/releasechangelog`,
    USER_GET: (webentity: number) => `/api/${webentity}/user`,
    USER_UPDATE: (webentity: number) => `/api/${webentity}/user`,
    USER_DELETE: (webentity: number) => `/api/${webentity}/user`,
    GDPR: (webentity: number) => `/api/${webentity}/gdpr`,

    // Company & Setup
    COMPANY_INFO: (webentity: number) => `/api/${webentity}/companyinformation`,
    COMPANY_INFO_BY_ID: (webentity: number, id: string) =>
      `/api/${webentity}/companyinformation/${id}`,
    SETUP: (webentity: number) => `/api/${webentity}/setup`,
    SETUP_TERMS: (webentity: number) => `/api/${webentity}/setup/terms`,

    // Gift Cards
    GIFTCARD_BALANCE: (webentity: number, id: string) =>
      `/api/${webentity}/giftcard/balance/${id}`,
  },
};
