import { Controller, Get, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { Public } from 'decorators/public.decorator';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Public()
  @Get('dates')
  async getUnavailableDates(@Query('numberOfCars') numberOfCars: string) {
    const numCars = parseInt(numberOfCars, 10) || 1; // Standardwert: 1 Auto
    return this.availabilityService.getUnavailableDates(numCars);
  }
}
