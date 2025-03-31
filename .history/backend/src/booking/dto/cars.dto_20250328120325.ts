import { IsDateString, IsInt, IsNotEmpty, MinDate, Validate, Min, Max} from 'class-validator';
import { IntegerType, TransactionAlreadyStartedError } from 'typeorm';
import { Transform, Type } from 'class-transformer';
import internal from 'stream';

export class CarsDto {

  @IsNotEmpty()
  @IsInt()
  id:string;

  @IsNotEmpty()
  carPlate;

  @IsNotEmpty()
  @IsDateString()
  checkInDate: string;

  @IsNotEmpty()
  @IsDateString()
  checkOutDate: string;

  @IsNotEmpty()
  isCancelled: boolean;

  @IsNotEmpty()
  @Type(()=> Number)
  @Min(1)
  adults: string;

  @IsNotEmpty()
  @Type(()=> Number)
  @Min(0)
  children: string;

  @IsNotEmpty()
  @Min(0)
  touristTax: number;

}
