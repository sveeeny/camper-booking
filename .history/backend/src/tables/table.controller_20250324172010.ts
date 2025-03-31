import { Controller, Get, Post, Query } from '@nestjs/common';
import { TableService } from './table.service';
import { Public } from 'decorators/public.decorator';

@Controller('tables')
export class TablesController {
  constructor(private readonly tableService: TableService) {}

  @Public()
  @Post('tables')
  async createTablesForYear() {
    }
}
