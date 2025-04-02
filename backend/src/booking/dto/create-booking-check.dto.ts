import { IsDateString, IsInt, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

const formatDateToYMD = (value: string | Date): string => {
  if (!value) return '';
  return new Date(value).toISOString().split('T')[0];
};

export class CreateBookingCheckDto {
  @IsNotEmpty()
  @IsDateString()
  @Transform(({ value }) => formatDateToYMD(value))
  checkInDate: string;

  @IsNotEmpty()
  @IsDateString()
  @Transform(({ value }) => formatDateToYMD(value))
  checkOutDate: string;

  @IsInt()
  numberOfCars: number;
}
