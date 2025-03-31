import { IsInt, IsBoolean } from 'class-validator';

export class CreateBookingInfoDto {
  @IsInt()
  bookingId: number; 
  
  @IsBoolean()
  paymentConfirmed: boolean;
}
