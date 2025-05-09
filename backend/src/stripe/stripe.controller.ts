import { Controller, Post, Body } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Public } from '@/decorators/public.decorator';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) { }

  @Public()
  @Post('checkout')
  async createSession(@Body() body: { amount: number, bookingId: string }) {
    const url = await this.stripeService.createCheckoutSession(body.bookingId, body.amount);

    return { url };
  }
}
