import { IsDateString, IsInt, Min, Max } from 'class-validator';

export class CreateBookingCheckDto {
  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsInt()
  @Min(1)
  @Max(5)
  numberOfSpots: number;
}
