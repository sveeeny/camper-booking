import { IsDateString, IsInt, IsNotEmpty, MinDate, Validate, Min, Max} from 'class-validator';
import { TransactionAlreadyStartedError } from 'typeorm';
import { Transform } from 'class-transformer';

export class CreateBookingCheckDto {

    // @IsNotEmpty()
    // @IsDateString()
    checkInDate: string;
  
    // @IsNotEmpty()
    // @IsDateString()
    // @Validate((dto) => {
    //   const checkIn = new Date(dto.checkInDate);
    //   const checkOut = new Date(dto.checkOutDate);
    //   const diff = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
    //   console.log(`🔍 Validierung: Check-in: ${dto.checkInDate}, Check-out: ${dto.checkOutDate}, Differenz: ${diff}`);
    //   return diff > 0 && diff <= 3;
    // }, { message: "Maximale Buchungsdauer sind 3 Nächte." })
    checkOutDate: string;

  // @IsInt()
  // @Min(1)
  // @Max(5)
  numberOfCars: number;
}
