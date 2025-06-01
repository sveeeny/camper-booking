export const emailTranslations = {
  de: {
    subject: 'Buchungsbestätigung – Camper Herger',
    greeting: (firstName: string) => `Hallo ${firstName},`,
    headline: 'Danke für deine Buchung! 🏕️',
    intro: 'Wir bestätigen hiermit deine Buchung auf dem <strong>Camperplatz Herger</strong>.',
    pdfInfo: 'Die wichtigsten Informationen findest du im angehängten PDF-Dokument.',
    closing: 'Wir freuen uns auf deinen Besuch! 😊',
    footer: `Diese Nachricht wurde automatisch generiert. Bitte nicht direkt darauf antworten.<br />Bei Fragen erreichst du uns unter <a href="mailto:mail@byherger.ch">mail@byherger.ch</a>.`,
    textBody: (firstName: string) => `
Danke für deine Buchung bei byherger!
Hallo ${firstName},
Deine Buchung ist bestätigt. Die Details findest du im Anhang.
Wir freuen uns auf deinen Besuch!
Kontakt: mail@byherger.ch
`,
  },

  en: {
    subject: 'Booking Confirmation – Camper Herger',
    greeting: (firstName: string) => `Hi ${firstName},`,
    headline: 'Thank you for your booking! 🏕️',
    intro: 'We hereby confirm your booking at <strong>Camper Herger</strong>.',
    pdfInfo: 'The most important information can be found in the attached PDF document.',
    closing: 'We look forward to welcoming you! 😊',
    footer: `This message was automatically generated. Please do not reply directly.<br />If you have questions, contact us at <a href="mailto:mail@byherger.ch">mail@byherger.ch</a>.`,
    textBody: (firstName: string) => `
Thank you for your booking at byherger!
Hi ${firstName},
Your booking is confirmed. You'll find the details in the attachment.
We look forward to welcoming you!
Contact: mail@byherger.ch
`,
  },
} as const;
