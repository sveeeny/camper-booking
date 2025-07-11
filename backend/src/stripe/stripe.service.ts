// src/stripe/stripe.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BookingService } from '@/booking/booking.service';
import { ResendService } from '@/resend/resend.service';
import { SettingsService } from '@/settings/settings.service';
import { generateBookingPDF } from '@/booking/booking-pdf.service';
import { generateDownloadToken } from '@/utils/jwt-download.util';
import { stringify } from 'querystring';
import { cleanupTimers } from '@/booking/booking-timers';
import { Inject } from '@nestjs/common';
import { forwardRef } from '@nestjs/common';


@Injectable()
export class StripeService {

  async verifyPayment(bookingId: string): Promise<boolean> {
  const sessions = await this.stripe.checkout.sessions.list({ limit: 50 }); // optional: filter nach Zeit

  const session = sessions.data.find((s) => s.metadata?.bookingId === bookingId);

  if (!session) {
    this.logger.warn(`⚠️ Keine Stripe-Session für Buchung ${bookingId} gefunden.`);
    return false;
  }

  return session.payment_status === 'paid';
}

  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => BookingService))
    private bookingService: BookingService,
    private resendService: ResendService,
    private settingsService: SettingsService,
  ) {
    //TODO: bei live wechseln
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    //Test-Mode-Key
    // const secretKey = this.configService.get<string>('STRIPE_SECRET_TEST_KEY');

    if (!secretKey) {
      throw new Error('❌ STRIPE_SECRET_KEY fehlt in .env-Datei');
    }

    this.stripe = new Stripe(secretKey);
  }


  async createCheckoutSession(bookingId: string, amountInRappen: number, productName: string, locale: string): Promise<string> {
    
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'chf',
            product_data: {
              name: productName,
            },
            unit_amount: amountInRappen,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success?bookingId=${bookingId}`,
      cancel_url: `${process.env.FRONTEND_URL}/`,
      metadata: {
        bookingId,
        locale
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

          // ⏹️ Cleanup-Timer abbrechen, falls vorhanden
 if (cleanupTimers.has(bookingId)) {
  clearTimeout(cleanupTimers.get(bookingId));
  cleanupTimers.delete(bookingId);
  this.logger.log(`🧹 Cleanup-Timer für Buchung ${bookingId} gestoppt.`);
}


          // 2. Buchung und Settings laden
          const booking = await this.bookingService.getBookingById(bookingId);
          const settings = await this.settingsService.getSettings();
          const priceBase = booking.cars.reduce((acc, car) => acc + Number(car.basePrice ?? 0), 0);
          const priceTax = booking.cars.reduce((acc, car) => acc + Number(car.touristTax ?? 0), 0);
          const language = session.metadata?.locale || 'en'; // fallback: english


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

          // 3. PDF generieren
          const pdfBuffer = await generateBookingPDF(bookingForPdf, settings, language);


          // 4. E-Mail versenden
          await this.resendService.sendBookingConfirmation(booking.guest.email, pdfBuffer, bookingForPdf, language);

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
