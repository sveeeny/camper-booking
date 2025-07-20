// src/booking/booking-cron.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BookingService } from './booking.service';
import { StripeService } from '@/stripe/stripe.service';
import * as crypto from 'crypto';

@Injectable()
export class BookingCronService {
  private readonly logger = new Logger(BookingCronService.name);

  constructor(
    private bookingService: BookingService,
    private stripeService: StripeService,
  ) {}

  // ⏰ Täglich um 03:00 Uhr morgens
  @Cron('0 3 * * *')
  async handleDailyCleanup() {
    this.logger.log('🧹 Starte tägliche Buchungsprüfung…');

    const now = new Date();
    const cutoff = new Date(now.getTime() - 30 * 60 * 1000); // 10 Minuten zurück

    const bookingsToCheck = await this.bookingService.getOutdatedDraftsAndPending(cutoff);

    for (const booking of bookingsToCheck) {
      if (booking.status === 'draft') {
        await this.bookingService.deleteBooking(booking.booking_id);
        this.logger.log(`❌ Alte draft-Buchung gelöscht: ${booking.booking_id}`);
      } else if (booking.status === 'pending') {
        const isPaid = await this.stripeService.verifyPayment(booking.booking_id);

        if (isPaid) {
          await this.bookingService.updateStatus(booking.booking_id, 'paid');
          this.logger.log(`✅ Zahlung gefunden – Status auf paid gesetzt: ${booking.booking_id}`);
        } else {
          const stillActive = await this.stripeService.sessionStillActive(booking.booking_id);

          if (stillActive) {
            this.logger.log(`⏳ Stripe-Session für Buchung ${booking.booking_id} ist noch aktiv – Cleanup verschoben.`);
            continue;
          }

          await this.bookingService.deleteBooking(booking.booking_id);
          this.logger.log(`❌ Nicht bezahlte und inaktive pending-Buchung gelöscht: ${booking.booking_id}`);
        }
      }

    }

    this.logger.log(`🧼 ${bookingsToCheck.length} potenzielle Buchungen bereinigt.`);
  }
}
