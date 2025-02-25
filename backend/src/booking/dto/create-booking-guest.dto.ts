import { IsString, IsIn, IsInt, IsArray, IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class CreateBookingGuestDto {

  @IsNotEmpty()
  @IsString()
  @IsIn(['Herr', 'Frau']) // ✅ Nur erlaubte Werte
  salutation: string; // Herr, Frau

  @IsInt()
  bookingId: number; // ID der bestehenden Buchung

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;


  @IsNotEmpty()
  @IsString()
  nationality: string; // ✅ Dropdown-Feld für Nationalität

  @IsArray()
  carPlates: string[]; // ✅ Liste von Autokennzeichen

  @IsNotEmpty()
  @IsEmail()
  email: string; // ✅ E-Mail validieren

  @IsNotEmpty()
  @IsString()
  phoneCountryCode: string; // ✅ Vorwahl (z.B. +41)

  @IsNotEmpty()
  @Matches(/^[0-9]+$/, { message: "Telefonnummer darf nur Zahlen enthalten." })
  phoneNumber: string; // ✅ Nur Zahlen erlaubt
}
