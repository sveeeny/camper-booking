import { Module } from '@nestjs/common';
import { TableService } from '../tables/table.service';

@Module({
  providers: [TableService],
  exports: [TableService], 
})
export class TableModule {}
