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
    idempotencyKey: string,
  ): Promise<void> {
    const lang: keyof typeof emailTranslations =
      language === 'en' ? 'en' : 'de';
    const translation = emailTranslations[lang];
    const recipients = this.recipientOverride
      ? [this.recipientOverride]
      : [guestEmail, ...(this.copyRecipient ? [this.copyRecipient] : [])];
    const firstName = escapeHtml(booking.guest.firstName);

    const { error } = await this.resend.emails.send(
      {
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
      },
      { idempotencyKey },
    );

    if (error) {
      throw new Error(
        `Resend konnte die Bestätigung nicht senden: ${error.message}`,
      );
    }

    this.logger.log('Buchungsbestätigung wurde erfolgreich versendet.');
  }

  async sendPasswordSetup(
    userEmail: string,
    passwordUrl: string,
    isInvitation: boolean,
    idempotencyKey: string,
  ): Promise<void> {
    const recipients = this.recipientOverride
      ? [this.recipientOverride]
      : [userEmail];
    const safeUrl = escapeHtml(passwordUrl);
    const subject = isInvitation
      ? 'Einladung zum Buchungssystem – Camper Herger'
      : 'Passwort zurücksetzen – Camper Herger';
    const headline = isInvitation
      ? 'Dein Zugang zum Buchungssystem'
      : 'Passwort zurücksetzen';
    const introduction = isInvitation
      ? 'Für dich wurde ein Benutzerkonto im Buchungssystem von Camper Herger erstellt.'
      : 'Für dein Benutzerkonto wurde ein neues Passwort angefordert.';

    const { error } = await this.resend.emails.send(
      {
        from: 'Camper Herger <no-reply@booking.byherger.ch>',
        to: recipients,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; padding: 20px;">
            <h2 style="color: #2c3e50;">${headline}</h2>
            <p>${introduction}</p>
            <p>Über den folgenden Link kannst du dein persönliches Passwort setzen:</p>
            <p style="margin: 28px 0;">
              <a href="${safeUrl}" style="background: #2563eb; color: white; padding: 12px 18px; text-decoration: none; border-radius: 6px;">
                Passwort setzen
              </a>
            </p>
            <p>Der Link ist eine Stunde gültig und kann nur einmal verwendet werden.</p>
            <p>Falls du diese Nachricht nicht erwartet hast, melde dich bitte beim Administrator.</p>
            <hr style="margin: 30px 0;" />
            <p style="font-size: 0.9em; color: #777;">Diese Nachricht wurde automatisch generiert. Bitte nicht direkt darauf antworten.</p>
          </div>
        `,
        text: `${introduction}\n\nPasswort setzen: ${passwordUrl}\n\nDer Link ist eine Stunde gültig und kann nur einmal verwendet werden.`,
      },
      { idempotencyKey },
    );

    if (error) {
      throw new Error(
        `Resend konnte die Passwort-E-Mail nicht senden: ${error.message}`,
      );
    }

    this.logger.log('Passwort-Link wurde erfolgreich versendet.');
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
