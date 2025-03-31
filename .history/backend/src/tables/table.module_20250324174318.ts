import { Module } from '@nestjs/common';
import { TableService } from '../tables/table.service';
import { TablesController } from './table.controller';

@Module({
  providers: [TableService],
  controllers: [TablesController],
  exports: [TableService], 
})
export class TableModule {}
