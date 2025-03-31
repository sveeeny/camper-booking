import { IsDateString, IsInt, IsNotEmpty, MinDate, Validate, Min, Max} from 'class-validator';
import { IntegerType, TransactionAlreadyStartedError } from 'typeorm';
import { Transform, Type } from 'class-transformer';
import internal from 'stream';

export class CarsDto {

  @IsNotEmpty()
  @Type(()=> Number)
  id: number;

  @IsNotEmpty()
  carPlate: string;

  @IsNotEmpty()
  @IsDateString()
  checkInDate: string;

  @IsNotEmpty()
  @IsDateString()
  checkOutDate: string;

  @IsNotEmpty()
  @Type(()=> Boolean)
  isCancelled: boolean;

  @IsNotEmpty()
  @Type(()=> Number)
  @Min(1)
  adults: number;

  @IsNotEmpty()
  @Type(()=> Number)
  @Min(0)
  children: number;

  @IsNotEmpty()
  @Type(()=> Number)
  @Min(0)
  touristTax: number;

}
