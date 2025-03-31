import { IsString, IsIn, IsInt, Min, Max, IsArray, IsEmail, IsNotEmpty, Matches, IsDateString, ValidateNested, MinLength,  MaxLength,  Validate,  ValidateIf,  MinDate} from 'class-validator';
import { Type } from 'class-transformer';
import { CarsDto } from './cars.dto';

export class CreateBookingGuestDto {
  
  @IsNotEmpty()
  @IsString()
  @IsIn(['Herr', 'Frau']) 
  salutation: string; 

  @IsInt()
  bookingId: string; 

  @IsNotEmpty()
  @IsDateString()
  checkInDate: string;

  @IsNotEmpty()
  @IsDateString()
  @Validate((dto) => {
    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.checkOutDate);
    const diff = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
    console.log(`🔍 Validierung: Check-in: ${dto.checkInDate}, Check-out: ${dto.checkOutDate}, Differenz: ${diff}`);
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
