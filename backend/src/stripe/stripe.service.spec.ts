import { ConfigService } from '@nestjs/config';
import { BookingService } from '@/booking/booking.service';
import { generateBookingPDF } from '@/booking/booking-pdf.service';
import { ResendService } from '@/resend/resend.service';
import { SettingsService } from '@/settings/settings.service';
import { StripeService } from './stripe.service';
import Stripe from 'stripe';

jest.mock('@/booking/booking-pdf.service', () => ({
  generateBookingPDF: jest.fn(),
}));

describe('StripeService payment completion', () => {
  const bookingId = 'booking-1';
  const booking = {
    id: bookingId,
    guest: {
      email: 'guest@example.com',
      firstName: 'Max',
    },
    cars: [
      {
        carPlate: 'TG 123456',
        adults: 2,
        children: 0,
        basePrice: 50,
        touristTax: 12,
      },
    ],
  };

  const bookingService = {
    isLegacyPaidBooking: jest.fn(),
    recordPaymentConfirmed: jest.fn(),
    claimBookingConfirmation: jest.fn(),
    getBookingById: jest.fn(),
    markBookingConfirmationSent: jest.fn(),
    markBookingConfirmationFailed: jest.fn(),
    getCheckoutAmountInRappen: jest.fn(),
    setStripeCheckoutSessionId: jest.fn(),
  };
  const resendService = {
    sendBookingConfirmation: jest.fn(),
  };
  const settingsService = {
    getSettings: jest.fn(),
  };

  let service: StripeService;

  beforeEach(() => {
    jest.clearAllMocks();
    const configService = {
      getOrThrow: (key: string) => {
        const values: Record<string, string> = {
          STRIPE_SECRET_KEY: 'sk_test_dummy',
          FRONTEND_URL: 'http://localhost',
          STRIPE_WEBHOOK_SECRET: 'whsec_dummy',
        };
        return values[key];
      },
    };

    service = new StripeService(
      configService as ConfigService,
      bookingService as unknown as BookingService,
      resendService as unknown as ResendService,
      settingsService as unknown as SettingsService,
    );
    bookingService.isLegacyPaidBooking.mockResolvedValue(false);
    bookingService.claimBookingConfirmation.mockResolvedValue('claimed');
    bookingService.getBookingById.mockResolvedValue(booking);
    settingsService.getSettings.mockResolvedValue({});
    (generateBookingPDF as jest.Mock).mockResolvedValue(
      Buffer.from('%PDF-test'),
    );
  });

  it('records a failed confirmation so a later webhook can retry it', async () => {
    resendService.sendBookingConfirmation
      .mockRejectedValueOnce(new Error('Resend unavailable'))
      .mockResolvedValueOnce(undefined);

    await expect(service.completePaidBooking(bookingId, 'de')).rejects.toThrow(
      'Resend unavailable',
    );
    expect(bookingService.markBookingConfirmationFailed).toHaveBeenCalledWith(
      bookingId,
      'Resend unavailable',
    );

    await expect(service.completePaidBooking(bookingId, 'de')).resolves.toBe(
      'processed',
    );
    expect(bookingService.markBookingConfirmationSent).toHaveBeenCalledWith(
      bookingId,
    );
    expect(resendService.sendBookingConfirmation).toHaveBeenLastCalledWith(
      'guest@example.com',
      expect.any(Buffer),
      expect.any(Object),
      'de',
      `booking-confirmation-${bookingId}`,
    );
  });

  it('does not regenerate or resend a confirmation that is already sent', async () => {
    bookingService.claimBookingConfirmation.mockResolvedValue('sent');

    await expect(service.completePaidBooking(bookingId, 'en')).resolves.toBe(
      'already-sent',
    );
    expect(generateBookingPDF).not.toHaveBeenCalled();
    expect(resendService.sendBookingConfirmation).not.toHaveBeenCalled();
  });

  it('does not resend historical paid bookings without delivery tracking', async () => {
    bookingService.isLegacyPaidBooking.mockResolvedValue(true);

    await expect(service.completePaidBooking(bookingId, 'de')).resolves.toBe(
      'already-sent',
    );
    expect(bookingService.recordPaymentConfirmed).not.toHaveBeenCalled();
    expect(bookingService.claimBookingConfirmation).not.toHaveBeenCalled();
    expect(resendService.sendBookingConfirmation).not.toHaveBeenCalled();
  });

  it('does not duplicate work while another webhook is processing it', async () => {
    bookingService.claimBookingConfirmation.mockResolvedValue('in-progress');

    await expect(service.completePaidBooking(bookingId, 'en')).resolves.toBe(
      'in-progress',
    );
    expect(generateBookingPDF).not.toHaveBeenCalled();
    expect(resendService.sendBookingConfirmation).not.toHaveBeenCalled();
  });

  it('uses only the amount stored by the backend for Stripe checkout', async () => {
    bookingService.getCheckoutAmountInRappen.mockResolvedValue(7625);
    const stripeClient = (service as unknown as { stripe: Stripe }).stripe;
    const createSession = jest
      .spyOn(stripeClient.checkout.sessions, 'create')
      .mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.test/session',
      } as Stripe.Response<Stripe.Checkout.Session>);

    await expect(
      service.createCheckoutSession(bookingId, 'Buchung byherger', 'de'),
    ).resolves.toBe('https://checkout.stripe.test/session');

    expect(createSession).toHaveBeenCalledTimes(1);
    expect(bookingService.getCheckoutAmountInRappen).toHaveBeenCalledWith(
      bookingId,
    );
    expect(bookingService.setStripeCheckoutSessionId).toHaveBeenCalledWith(
      bookingId,
      'cs_test_123',
    );
  });
});
