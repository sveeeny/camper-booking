import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { ConfigModule } from '@nestjs/config'; // ✅ das hinzufügen!

@Module({
  imports: [ConfigModule], // ⬅️ hier sicherstellen!
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService], // optional, nur falls du es woanders brauchst
})
export class StripeModule {}
