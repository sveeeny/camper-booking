import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { BookingPdfInput } from '@/types/pdf.types';

@Injectable()
export class ResendService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendBookingConfirmation(toEmail: string, pdfBuffer: Buffer, booking: BookingPdfInput): Promise<void> {
    try {
      await this.resend.emails.send({
        from: 'Camper Herger <no-reply@booking.byherger.ch>', // 👈 deine Wunschadresse
        to: [toEmail, 'franz@byherger.ch'],
        subject: 'Buchungsbestätigung – Camper Herger',
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; padding: 20px;">
          <h2 style="color: #2c3e50;">Danke für deine Buchung! 🏕️</h2>

          <p>Hallo ${booking.guest.firstName},</p>

          <p>Wir bestätigen hiermit deine Buchung auf dem <strong>Camperplatz Herger</strong>.</p>

          <p>Die wichtigsten Informationen findest du im angehängten PDF-Dokument.</p>

          <p style="margin-top: 20px;">Wir freuen uns auf deinen Besuch! 😊</p>

          <hr style="margin: 30px 0;" />

          <p style="font-size: 0.9em; color: #777;">
            Diese Nachricht wurde automatisch generiert. Bitte nicht direkt darauf antworten.
            <br />
            Bei Fragen erreichst du uns unter <a href="mailto:mail@byherger.ch">mail@byherger.ch</a>
          </p>
        </div>
      `,
        text: `
        Danke für deine Buchung bei Camper Herger!
        Hallo ${booking.guest.firstName},
        Deine Buchung ist bestätigt. Die Details findest du im Anhang.
        Wir freuen uns auf deinen Besuch!
        Kontakt: mail@byherger.ch
        `,


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
