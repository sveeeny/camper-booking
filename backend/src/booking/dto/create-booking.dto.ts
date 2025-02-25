import { IsString, IsDateString, IsInt, Min, Max } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  name: string;

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsInt()
  @Min(1)
  @Max(5)
  numberOfSpots: number; // Anzahl Stellplätze
}
