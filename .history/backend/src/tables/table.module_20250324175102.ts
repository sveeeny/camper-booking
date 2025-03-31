import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableService } from '../tables/table.service';
import { TablesController } from './table.controller';
import { Availability } from 'entitys/availability.entity';
import { Car } from 'entitys/cars.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Availability, Car])],
  providers: [TableService],
  controllers: [TablesController],
  exports: [TableService], 
})
export class TableModule {}
