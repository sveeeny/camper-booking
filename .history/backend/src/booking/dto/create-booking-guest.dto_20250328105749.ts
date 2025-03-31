import { IsString, IsIn, IsInt, Min, Max, IsArray, IsEmail, IsNotEmpty, Matches, IsDateString, ValidateNested, MinLength,  MaxLength,  Validate,  ValidateIf,  MinDate} from 'class-validator';
import { Type } from 'class-transformer';
import { CarsDto } from './cars.dto';

export class CreateBookingGuestDto {
  
  @IsNotEmpty()
  @IsString()
  @IsIn(['Herr', 'Frau']) // ✅ Nur erlaubte Werte
  salutation: string; // Herr, Frau

  @IsInt()
  bookingId: string; // ID der bestehenden Buchung

  @IsNotEmpty()
  @IsDateString()
 // @MinDate(new Date(), { message: "Buchungen nur für zukünftige Daten möglich." })
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
  nationality: string; // ✅ Dropdown-Feld für Nationalität

  @IsNotEmpty()
  @IsEmail()
  email: string; // ✅ E-Mail validieren

  @IsNotEmpty()
  @IsString()
  phoneCountryCode: string; // ✅ Vorwahl (z.B. +41)

  @IsNotEmpty()
  @Matches(/^[0-9]+$/, { message: "Telefonnummer darf nur Zahlen enthalten." })
  @MinLength(8, { message: "Telefonnummer muss mindestens 8 Ziffern haben." })
  @MaxLength(15, { message: "Telefonnummer darf maximal 15 Ziffern haben." })
  phoneNumber: string; // ✅ Nur Zahlen erlaubt

  @IsNotEmpty()
  @Min(1)
  @Max(5)
  numberOfCars: number;

  totalPrice: number;  // ✅ Neues Feld für den Gesamtpreis
  

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarsDto)  // ✅ Erzwingt die richtige Typumwandlung!
  Cars: CarsDto[];

}
