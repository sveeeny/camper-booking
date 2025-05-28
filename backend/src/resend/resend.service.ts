import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendBookingConfirmation(toEmail: string, pdfBuffer: Buffer) {
    try {
      await this.resend.emails.send({
        from: 'Camper Herger <no-reply@booking.byherger.ch>', // 👈 deine Wunschadresse
        to: [toEmail],
        subject: 'Buchungsbestätigung – Camper Herger',
        html: `<p>Danke für deine Buchung! Im Anhang findest du deine Bestätigung als PDF.</p>`,
        attachments: [
          {
            filename: 'buchung.pdf',
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
