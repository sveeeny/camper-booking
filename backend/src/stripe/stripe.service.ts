// src/stripe/stripe.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BookingService } from '@/booking/booking.service';
import { Request } from 'express';

type StripeWebhookRequest = Omit<Request, 'body'> & {
  body: Buffer;
};
@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private configService: ConfigService,
    private bookingService: BookingService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      throw new Error('❌ STRIPE_SECRET_KEY fehlt in .env-Datei');
    }

    this.stripe = new Stripe(secretKey);
  }

  async createCheckoutSession(
    bookingId: string,
    amountInRappen: number,
  ): Promise<string> {
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
        bookingId,
      },
    });

    return session.url!;
  }

  async handleWebhook(
    req: StripeWebhookRequest,
    sig: string,
  ): Promise<{ success: boolean }> {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    // 🔒 TypeScript-fester Check
    if (!webhookSecret) {
      this.logger.error('❌ STRIPE_WEBHOOK_SECRET fehlt in .env-Datei');
      throw new Error('Webhook secret is not defined');
    }

    let event: Stripe.Event;

    try {
      // 🔑 Verifikation der Signatur – req.body muss raw sein!
      event = this.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unbekannter Stripe-Fehler';

      this.logger.error(`❌ Stripe Webhook Signature invalid: ${message}`);
      return { success: false };
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;

      if (bookingId) {
        this.logger.log(`✅ Zahlung erfolgreich für Buchung ${bookingId}`);

        // TODO: Buchung updaten, PDF erzeugen, E-Mail senden

        try {
          await this.bookingService.updateStatus(bookingId, 'paid');
          this.logger.log(
            `📌 Status für Buchung ${bookingId} erfolgreich auf "paid" gesetzt.`,
          );
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : 'Unbekannter Stripe-Fehler';

          this.logger.error(
            `❌ Fehler beim Aktualisieren der Buchung ${bookingId}: ${message}`,
          );
          return { success: false };
        }

        return { success: true };
      }
    }

    return { success: false };
  }
}
