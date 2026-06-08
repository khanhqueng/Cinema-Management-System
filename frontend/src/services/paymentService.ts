import api from "./api";

interface SePayCheckoutResponse {
  paymentId: number;
  bookingId: number;
  amount: string | number;
  checkoutUrl: string;
  formFields: Record<string, string>;
}

export const paymentService = {
  async getSePayCheckout(
    bookingId: number,
    successUrl: string,
    errorUrl: string,
    cancelUrl: string,
  ): Promise<SePayCheckoutResponse> {
    const response = await api.post("/payments/sepay/checkout", {
      bookingId,
      successUrl,
      errorUrl,
      cancelUrl,
    });
    return response.data;
  },

  async getPaymentStatusByBooking(bookingId: number) {
    const response = await api.get(`/payments/sepay/status`, {
      params: { bookingId },
    });
    return response.data;
  },

  async getPaymentById(paymentId: number) {
    const response = await api.get(`/payments/sepay/${paymentId}`);
    return response.data;
  },
};
