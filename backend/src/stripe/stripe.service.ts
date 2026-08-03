import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingService } from '@/booking/booking.service';
import { generateBookingPDF } from '@/booking/booking-pdf.service';
import { cleanupTimers } from '@/booking/booking-timers';
import { ResendService } from '@/resend/resend.service';
import { SettingsService } from '@/settings/settings.service';
import type { Request } from 'express';
import Stripe from 'stripe';

type StripeWebhookRequest = Omit<Request, 'body'> & {
  body: Buffer;
};

export type CheckoutSessionStatus = {
  isPaid: boolean;
  isActive: boolean;
  language: 'de' | 'en';
};

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);
  private readonly frontendUrl: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService,
    private readonly resendService: ResendService,
    private readonly settingsService: SettingsService,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
    );
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    this.webhookSecret = this.configService.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
  }

  async getCheckoutSessionStatus(
    bookingId: string,
  ): Promise<CheckoutSessionStatus> {
    const storedSessionId =
      await this.bookingService.getStripeCheckoutSessionId(bookingId);
    let session: Stripe.Checkout.Session | undefined;

    if (storedSessionId) {
      session = await this.stripe.checkout.sessions.retrieve(storedSessionId);
    } else {
      const sessions = await this.stripe.checkout.sessions.list({ limit: 100 });
      session = sessions.data.find(
        (candidate) => candidate.metadata?.bookingId === bookingId,
      );

      if (session) {
        await this.bookingService.setStripeCheckoutSessionId(
          bookingId,
          session.id,
        );
      }
    }

    if (!session) {
      this.logger.warn(
        `Keine Stripe-Session für Buchung ${bookingId} gefunden.`,
      );
      return { isPaid: false, isActive: false, language: 'en' };
    }

    const isExpired = session.expires_at * 1000 < Date.now();
    const isPaid = session.payment_status === 'paid';
    return {
      isPaid,
      isActive: !isExpired && !isPaid,
      language: session.metadata?.locale === 'de' ? 'de' : 'en',
    };
  }

  async verifyPayment(bookingId: string): Promise<boolean> {
    return (await this.getCheckoutSessionStatus(bookingId)).isPaid;
  }

  async sessionStillActive(bookingId: string): Promise<boolean> {
    return (await this.getCheckoutSessionStatus(bookingId)).isActive;
  }

  async createCheckoutSession(
    bookingId: string,
    amountInRappen: number,
    productName: string,
    locale: string,
  ): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'chf',
            product_data: { name: productName },
            unit_amount: amountInRappen,
          },
          quantity: 1,
        },
      ],
      success_url: `${this.frontendUrl}/success?bookingId=${bookingId}`,
      cancel_url: `${this.frontendUrl}/`,
      metadata: {
        bookingId,
        locale: locale === 'de' ? 'de' : 'en',
      },
    });

    if (!session.url) {
      throw new Error(
        `Stripe hat für Buchung ${bookingId} keine Checkout-URL zurückgegeben.`,
      );
    }

    await this.bookingService.setStripeCheckoutSessionId(bookingId, session.id);

    return session.url;
  }

  async handleWebhook(
    request: StripeWebhookRequest,
    signature: string,
  ): Promise<{ success: boolean }> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        request.body,
        signature,
        this.webhookSecret,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unbekannter Fehler';
      this.logger.error(`Stripe-Webhook-Signatur ungültig: ${message}`);
      return { success: false };
    }

    if (
      event.type !== 'checkout.session.completed' &&
      event.type !== 'checkout.session.async_payment_succeeded'
    ) {
      return { success: true };
    }

    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;

    if (!bookingId) {
      this.logger.warn('Stripe Checkout Session enthält keine bookingId.');
      return { success: false };
    }

    if (session.payment_status !== 'paid') {
      this.logger.log(
        `Zahlung für Buchung ${bookingId} ist noch nicht abgeschlossen.`,
      );
      return { success: true };
    }

    try {
      await this.completePaidBooking(
        bookingId,
        session.metadata?.locale ?? 'en',
      );
      return { success: true };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unbekannter Fehler';
      this.logger.error(
        `Fehler im Zahlungsabschluss für Buchung ${bookingId}: ${message}`,
      );
      return { success: false };
    }
  }

  async completePaidBooking(
    bookingId: string,
    language: string,
  ): Promise<'processed' | 'already-sent' | 'in-progress'> {
    if (await this.bookingService.isLegacyPaidBooking(bookingId)) {
      this.stopCleanupTimer(bookingId);
      this.logger.log(
        `Historische bezahlte Buchung ${bookingId} wird nicht erneut versendet.`,
      );
      return 'already-sent';
    }

    await this.bookingService.recordPaymentConfirmed(bookingId);

    this.stopCleanupTimer(bookingId);

    const claim = await this.bookingService.claimBookingConfirmation(bookingId);

    if (claim === 'sent') {
      this.logger.log(
        `Bestätigung für Buchung ${bookingId} wurde bereits versendet.`,
      );
      return 'already-sent';
    }

    if (claim === 'in-progress') {
      this.logger.log(
        `Bestätigung für Buchung ${bookingId} wird bereits verarbeitet.`,
      );
      return 'in-progress';
    }

    try {
      const booking = await this.bookingService.getBookingById(bookingId);
      const settings = await this.settingsService.getSettings();
      const bookingForPdf = {
        ...booking,
        cars: booking.cars.map((car) => ({
          carPlate: car.carPlate,
          adults: car.adults,
          children: car.children,
          priceBase: Number(car.basePrice ?? 0),
          priceTax: Number(car.touristTax ?? 0),
        })),
      };

      const pdf = await generateBookingPDF(
        bookingForPdf,
        settings,
        language === 'de' ? 'de' : 'en',
      );

      await this.resendService.sendBookingConfirmation(
        booking.guest.email,
        pdf,
        bookingForPdf,
        language,
        `booking-confirmation-${bookingId}`,
      );

      await this.bookingService.markBookingConfirmationSent(bookingId);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unbekannter Fehler';
      await this.bookingService.markBookingConfirmationFailed(
        bookingId,
        message,
      );
      throw error;
    }

    this.logger.log(
      `Buchung ${bookingId} wurde bezahlt und die Bestätigung versendet.`,
    );
    return 'processed';
  }

  private stopCleanupTimer(bookingId: string): void {
    const timer = cleanupTimers.get(bookingId);
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    cleanupTimers.delete(bookingId);
    this.logger.log(`Cleanup-Timer für Buchung ${bookingId} gestoppt.`);
  }
}
