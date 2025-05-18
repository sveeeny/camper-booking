import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { Settings } from '@/entities/settings.entity';
import { Public } from '@/decorators/public.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get()
  // @Roles('admin')
  async getSettings(): Promise<Settings> {
    return this.settingsService.getSettings();
  }

  @Put()
  @Roles('admin')
  async updateSettings(@Body() body: Partial<Settings>): Promise<Settings> {
    return this.settingsService.updateSettings(body);
  }
}
