// src/stripe/stripe.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BookingService } from '@/booking/booking.service';
import { ResendService } from '@/resend/resend.service';
import { SettingsService } from '@/settings/settings.service';
import { generateBookingPDF } from '@/booking/booking-pdf.service';
import { generateDownloadToken } from '@/utils/jwt-download.util';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private configService: ConfigService,
    private bookingService: BookingService,
    private resendService: ResendService,
    private settingsService: SettingsService,
  ) {
    //TODO: bei live wechseln
    // const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    //TEST
    const secretKey = this.configService.get<string>('STRIPE_SECRET_TEST_KEY');

    if (!secretKey) {
      throw new Error('❌ STRIPE_SECRET_KEY fehlt in .env-Datei');
    }

    this.stripe = new Stripe(secretKey);
  }


  async createCheckoutSession(bookingId: string, amountInRappen: number): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'chf',
            product_data: {
              name: 'Campingplatz-Buchung',
            },
            unit_amount: amountInRappen,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success?bookingId=${bookingId}`,
      cancel_url: `${process.env.FRONTEND_URL}/`,
      metadata: {
        bookingId
      },
    });

    return session.url!;
  }


  async handleWebhook(req: any, sig: string): Promise<{ success: boolean }> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    // 🔒 TypeScript-fester Check
    if (!webhookSecret) {
      this.logger.error('❌ STRIPE_WEBHOOK_SECRET fehlt in .env-Datei');
      throw new Error('Webhook secret is not defined');
    }

    let event: Stripe.Event;

    try {
      // 🔑 Verifikation der Signatur – req.body muss raw sein!
      event = this.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      this.logger.error('❌ Stripe Webhook Signature invalid:', err.message);
      return { success: false };
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;

      if (bookingId) {
        this.logger.log(`✅ Zahlung erfolgreich für Buchung ${bookingId}`);

        try {
          // 1. Status auf paid setzen
          await this.bookingService.updateStatus(bookingId, 'paid');
          this.logger.log(`📌 Status für Buchung ${bookingId} erfolgreich auf "paid" gesetzt.`);

          // 2. Buchung und Settings laden
          const booking = await this.bookingService.getBookingById(bookingId);
          const settings = await this.settingsService.getSettings();

          // 3. PDF generieren
          const pdfBuffer = await generateBookingPDF(booking, settings);

          // 4. E-Mail versenden
          await this.resendService.sendBookingConfirmation(booking.guest.email, pdfBuffer, booking);

          const token = generateDownloadToken({ bookingId });
          const downloadLink = `${process.env.FRONTEND_URL}/success?token=${token}`;

          this.logger.log(`📧 E-Mail mit PDF wurde an ${booking.guest.email} versendet.`);
        } catch (err) {
          this.logger.error(`❌ Fehler im Buchungsnachbearbeitungsprozess: ${err.message}`);
          return { success: false };
        }

        return { success: true };
      }
    }


    return { success: false };
  }


}
