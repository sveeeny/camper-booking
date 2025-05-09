import { IsDateString, IsInt, IsNotEmpty, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

// 💡 Hilfsfunktion zur Datumskonvertierung
const formatDateToYMD = (value: string | Date): string => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date(value).toISOString().split('T')[0];
};

export class CarsDto {
  @IsNotEmpty()
  carPlate: string;

  @IsNotEmpty()
  @IsDateString()
  @Transform(({ value }) => formatDateToYMD(value))
  checkInDate: string;

  @IsNotEmpty()
  @IsDateString()
  @Transform(({ value }) => formatDateToYMD(value))
  checkOutDate: string;

  @IsNotEmpty()
  @Type(() => Boolean)
  isCancelled: boolean;

  @IsNotEmpty()
  @Type(() => Number)
  @Min(1)
  adults: number;

  @IsNotEmpty()
  @Type(() => Number)
  @Min(0)
  children: number;

  @IsNotEmpty()
  @Type(() => Number)
  @Min(0)
  touristTax: number;
}
