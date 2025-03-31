import { IsDateString, IsInt, IsNotEmpty, MinDate, Validate, Min, Max} from 'class-validator';
import { TransactionAlreadyStartedError } from 'typeorm';
import { Transform } from 'class-transformer';

export class CreateBookingCheckDto {

    @IsNotEmpty()
    @IsDateString()
    checkInDate: string;
  
    @IsNotEmpty()
    @IsDateString()
    checkOutDate: string;

  @IsInt()
  numberOfCars: number;
}
