import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { Public } from 'decorators/public.decorator';


@Public()
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // ❌ Belegte Tage abrufen
  @Public()
  @Get('dates')
  async getUnavailableDates(
    @Query('numberOfCars', ParseIntPipe) numberOfCars: number,
  ) {
    return this.availabilityService.getUnavailableDates(numberOfCars || 1);
  }

}
