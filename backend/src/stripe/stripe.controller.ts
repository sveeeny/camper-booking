import { Controller, Post, Req, Res, Headers, Body } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request, Response } from 'express';
import { Public } from '@/decorators/public.decorator';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) { }

  @Public()
  @Post('checkout')
  async createSession(@Body() body: { amount: number; bookingId: string; productName: string }) {
    const url = await this.stripeService.createCheckoutSession(body.bookingId, body.amount, body.productName);
    return { url };
  }


  @Public()
  @Post('webhook')
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') sig: string,
  ) {
    const result = await this.stripeService.handleWebhook(req, sig);
    return res.status(result.success ? 200 : 400).send();
  }
}
