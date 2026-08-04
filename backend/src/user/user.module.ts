import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ResendModule } from '../resend/resend.module';
import { ConfigModule } from '@nestjs/config';
import { UserPasswordService } from './user-password.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ConfigModule, ResendModule],
  controllers: [UserController],
  providers: [UserService, UserPasswordService],
  exports: [UserService, UserPasswordService],
})
export class UserModule {}
