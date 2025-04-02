import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { AvailabilityService } from 'availability/availability.service';
import { Public } from 'decorators/public.decorator';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Public()
  @Get('dates')
  async getUnavailableDates(
    @Query('numberOfCars', ParseIntPipe) numberOfCars: number,
  ) {
    return this.availabilityService.getUnavailableDates(numberOfCars || 1);
  }
}
