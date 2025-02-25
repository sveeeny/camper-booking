import { IsInt, IsBoolean } from 'class-validator';

export class CreateBookingInfoDto {
  @IsInt()
  bookingId: number; // ID der bestehenden Buchung

  @IsBoolean()
  paymentConfirmed: boolean;
}
