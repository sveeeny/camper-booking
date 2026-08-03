import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingPdfInput } from '@/types/pdf.types';
import { Resend } from 'resend';
import { emailTranslations } from './email-translations';

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly resend: Resend;
  private readonly recipientOverride?: string;
  private readonly copyRecipient?: string;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
    this.recipientOverride =
      this.configService.get<string>('MAIL_OVERRIDE_TO') || undefined;
    this.copyRecipient =
      this.configService.get<string>('BOOKING_COPY_TO', 'franz@byherger.ch') ||
      undefined;
  }

  async sendBookingConfirmation(
    guestEmail: string,
    pdf: Buffer,
    booking: BookingPdfInput,
    language: string,
  ): Promise<void> {
    const lang: keyof typeof emailTranslations =
      language === 'en' ? 'en' : 'de';
    const translation = emailTranslations[lang];
    const recipients = this.recipientOverride
      ? [this.recipientOverride]
      : [guestEmail, ...(this.copyRecipient ? [this.copyRecipient] : [])];
    const firstName = escapeHtml(booking.guest.firstName);

    const { error } = await this.resend.emails.send({
      from: 'Camper Herger <no-reply@booking.byherger.ch>',
      to: recipients,
      subject: translation.subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; padding: 20px;">
          <h2 style="color: #2c3e50;">${translation.headline}</h2>
          <p>${translation.greeting(firstName)}</p>
          <p>${translation.intro}</p>
          <p>${translation.pdfInfo}</p>
          <p style="margin-top: 20px;">${translation.closing}</p>
          <hr style="margin: 30px 0;" />
          <p style="font-size: 0.9em; color: #777;">${translation.footer}</p>
        </div>
      `,
      text: translation.textBody(booking.guest.firstName),
      attachments: [
        {
          filename: 'Confirmation.pdf',
          content: pdf.toString('base64'),
        },
      ],
    });

    if (error) {
      throw new Error(
        `Resend konnte die Bestätigung nicht senden: ${error.message}`,
      );
    }

    this.logger.log(
      `Buchungsbestätigung wurde an ${recipients.join(', ')} versendet.`,
    );
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
