import { Module } from '@nestjs/common';
import { ResendService } from './resend.service';

@Module({
  providers: [ResendService],
  exports: [ResendService], // 👉 Damit andere Module den Service nutzen können
})
export class ResendModule {}
