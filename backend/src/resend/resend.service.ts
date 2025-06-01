import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { BookingPdfInput } from '@/types/pdf.types';
import { emailTranslations } from './email-translations';

@Injectable()
export class ResendService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendBookingConfirmation(toEmail: string, pdfBuffer: Buffer, booking: BookingPdfInput, language: string): Promise<void> {
    try {
      const lang = ['en', 'de'].includes(language) ? language : 'de';
      const t = emailTranslations[lang];

      await this.resend.emails.send({
        from: 'Camper Herger <no-reply@booking.byherger.ch>',
        to: [toEmail, 'franz@byherger.ch'],
        subject: t.subject,
        html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; padding: 20px;">
      <h2 style="color: #2c3e50;">${t.headline}</h2>
      <p>${t.greeting(booking.guest.firstName)}</p>
      <p>${t.intro}</p>
      <p>${t.pdfInfo}</p>
      <p style="margin-top: 20px;">${t.closing}</p>
      <hr style="margin: 30px 0;" />
      <p style="font-size: 0.9em; color: #777;">${t.footer}</p>
    </div>
  `,
        text: t.textBody(booking.guest.firstName),
        attachments: [
          {
            filename: 'Confirmation.pdf',
            content: pdfBuffer.toString('base64'),
          },
        ],
      });

    } catch (error) {
      console.error('❌ Fehler beim E-Mail-Versand:', error);
      throw error;
    }
  }
}
