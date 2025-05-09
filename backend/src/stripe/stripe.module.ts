import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { ConfigModule } from '@nestjs/config'; 

@Module({
  imports: [ConfigModule], 
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService], 
})
export class StripeModule {}
