import { Module } from '@nestjs/common';
import { TableService } from './table.service';

@Module({
  providers: [TableService],
  exports: [TableService], // 💡 Service exportieren, damit andere Module darauf zugreifen können
})
export class TableModule {}
