// src/stripe/stripe.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';


@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
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
  
}
