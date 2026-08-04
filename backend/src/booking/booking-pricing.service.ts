import { BadRequestException, Injectable } from '@nestjs/common';
import { SettingsService } from '@/settings/settings.service';
import { CarsDto } from './dto/cars.dto';

export type PricedCar = CarsDto & {
  basePrice: number;
  personSurcharge: number;
};

export type BookingPricing = {
  nights: number;
  basePrice: number;
  personSurcharge: number;
  totalPrice: number;
  cars: PricedCar[];
};

@Injectable()
export class BookingPricingService {
  constructor(private readonly settingsService: SettingsService) {}

  async calculate(
    checkInDate: string,
    checkOutDate: string,
    cars: CarsDto[],
  ): Promise<BookingPricing> {
    const settings = await this.settingsService.getSettings();
    const nights = this.calculateNights(checkInDate, checkOutDate);
    const pricePerNightPerCar = Number(settings.pricePerNightPerCar);
    const adultSurcharge = Number(settings.adultTax);
    const childSurcharge = Number(settings.childTax);

    const pricedCars = cars.map((car) => {
      if (car.adults + car.children > settings.maxGuestsPerCar) {
        throw new BadRequestException(
          `Maximal ${settings.maxGuestsPerCar} Gäste pro Fahrzeug erlaubt.`,
        );
      }

      return {
        ...car,
        basePrice: this.roundMoney(nights * pricePerNightPerCar),
        personSurcharge: this.roundMoney(
          nights *
            (car.adults * adultSurcharge + car.children * childSurcharge),
        ),
      };
    });

    const basePrice = this.roundMoney(
      pricedCars.reduce((sum, car) => sum + car.basePrice, 0),
    );
    const personSurcharge = this.roundMoney(
      pricedCars.reduce((sum, car) => sum + car.personSurcharge, 0),
    );

    return {
      nights,
      basePrice,
      personSurcharge,
      totalPrice: this.roundMoney(basePrice + personSurcharge),
      cars: pricedCars,
    };
  }

  private calculateNights(checkInDate: string, checkOutDate: string): number {
    const checkIn = Date.parse(`${checkInDate}T00:00:00Z`);
    const checkOut = Date.parse(`${checkOutDate}T00:00:00Z`);
    const nights = (checkOut - checkIn) / 86_400_000;

    if (!Number.isInteger(nights) || nights < 1) {
      throw new BadRequestException('Ungültiger Buchungszeitraum.');
    }

    return nights;
  }

  private roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
