import {
  IsString, IsIn, IsArray, IsEmail, IsNotEmpty, Matches,
  IsDateString, ValidateNested, MinLength, MaxLength, Validate, IsUUID
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CarsDto } from '../dto/cars.dto';

// 💡 Formatierungsfunktion für einheitliches Datum
const formatDateToYMD = (value: string | Date): string => {
  if (!value) return '';
  return new Date(value).toISOString().split('T')[0];
};

export class CreateBookingGuestDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['Herr', 'Frau'])
  salutation: string;

  @IsUUID()
  bookingId: string;

  @IsNotEmpty()
  @IsDateString()
  @Transform(({ value }) => formatDateToYMD(value))
  checkInDate: string;

  @IsNotEmpty()
  @IsDateString()
  @Transform(({ value }) => formatDateToYMD(value))
  @Validate((dto) => {
    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.checkOutDate);
    const diff = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 3;
  }, { message: "Maximale Buchungsdauer sind 3 Nächte." })
  checkOutDate: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  nationality: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phoneCountryCode: string;

  @IsNotEmpty()
  @Matches(/^[0-9]+$/, { message: "Telefonnummer darf nur Zahlen enthalten." })
  @MinLength(8, { message: "Telefonnummer muss mindestens 8 Ziffern haben." })
  @MaxLength(15, { message: "Telefonnummer darf maximal 15 Ziffern haben." })
  phoneNumber: string;

  @IsNotEmpty()
  totalPrice: number;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarsDto)
  cars: CarsDto[];
}
