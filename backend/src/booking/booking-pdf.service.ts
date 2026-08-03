import { Settings } from '@/entities/settings.entity';
import { BookingPdfInput } from '@/types/pdf.types';
import * as pdfmake from 'pdfmake';
import * as robotoFonts from 'pdfmake/fonts/Roboto';

interface PdfCopy {
  title: string;
  guestInformation: string;
  salutation: string;
  name: string;
  nationality: string;
  email: string;
  phone: string;
  period: string;
  checkIn: string;
  checkOut: string;
  from: string;
  until: string;
  vehicleCount: string;
  vehiclesAndOccupants: string;
  number: string;
  plate: string;
  adults: string;
  children: string;
  basePrice: string;
  touristTax: string;
  totalPrice: string;
  paid: string;
  arrivalTitle: string;
  arrivalDamageWarning: string;
  arrivalDirectionsWarning: string;
  directionsLink: string;
  thankYou: string;
  rulesTitle: string;
  rules: string[];
  facilitiesTitle: string;
  facilities: string[];
  saunaTitle: string;
  numberOfPeople: string;
  price: string;
  contactTitle: string;
}

const PDF_COPY: Record<'de' | 'en', PdfCopy> = {
  de: {
    title: 'Buchungsbestätigung',
    guestInformation: 'Gästeinformationen',
    salutation: 'Anrede',
    name: 'Name',
    nationality: 'Nationalität',
    email: 'E-Mail',
    phone: 'Telefon',
    period: 'Zeitraum',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    from: 'ab',
    until: 'bis',
    vehicleCount: 'Anzahl Fahrzeuge',
    vehiclesAndOccupants: 'Fahrzeuge und Insassen',
    number: 'Nr.',
    plate: 'Kennzeichen',
    adults: 'Erw.',
    children: 'Kinder',
    basePrice: 'Grundpreis',
    touristTax: 'Kurtaxe',
    totalPrice: 'Gesamtpreis',
    paid: 'bezahlt',
    arrivalTitle: 'Wichtiger Hinweis zur Anfahrt',
    arrivalDamageWarning:
      'Bitte vermeiden Sie Kratzer oder Schäden an Ihrem Fahrzeug!',
    arrivalDirectionsWarning:
      'Viele Navigationsgeräte schlagen eine zu enge Zufahrtsstraße vor, die für Wohnmobile nicht geeignet ist. Bitte folgen Sie nicht dem Navi, sondern nutzen Sie ausschließlich den folgenden Link:',
    directionsLink: 'Anfahrt in Google Maps öffnen',
    thankYou: 'Danke für deine Buchung bei byherger!',
    rulesTitle: 'Regeln',
    rules: [
      'Kinder und Jugendliche bis 16 Jahren müssen immer von Erwachsenen beaufsichtigt sein.',
      'Die Kinderfahrzeuge bleiben im dafür gekennzeichneten Kinderfahrzeug-Bereich. Nach dem Gebrauch müssen die Fahrzeuge wieder im Parkplatz-Bereich im Stall parkiert werden.',
      'Herzlichen Dank, dass du mithilfst, unseren Hof sauber zu halten.',
    ],
    facilitiesTitle: 'Angebot',
    facilities: [
      'WLAN Zugang im Hofladen: SSID: WiFi byherger, Password: Vollmond',
      'Sanitäre Anlagen (WC, Dusche, Wickelstation, Kassettenentleerungs-Station, Frischwasser)',
      'Selbstbedienungs-Hofladen & Hofcafé (täglich geöffnet von 07:00 bis 21:00 Uhr)',
      'Stromanschluss für dein Fahrzeug, Abfallentsorgung, Feuerstelle (Feuerholz im Hofladen erhältlich)',
      'Holzofen-Sauna für max. 5 Personen (buchbar: 079 425 52 63)',
    ],
    saunaTitle: 'Holzofen Sauna',
    numberOfPeople: 'Anzahl Personen',
    price: 'Preis',
    contactTitle: 'Bei Fragen',
  },
  en: {
    title: 'Booking Confirmation',
    guestInformation: 'Guest Information',
    salutation: 'Salutation',
    name: 'Name',
    nationality: 'Nationality',
    email: 'Email',
    phone: 'Phone',
    period: 'Booking Period',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    from: 'from',
    until: 'until',
    vehicleCount: 'Number of Vehicles',
    vehiclesAndOccupants: 'Vehicles and Occupants',
    number: 'No.',
    plate: 'License plate',
    adults: 'Adults',
    children: 'Children',
    basePrice: 'Base price',
    touristTax: 'Tourist tax',
    totalPrice: 'Total Price',
    paid: 'paid',
    arrivalTitle: 'Important Arrival Information',
    arrivalDamageWarning: 'Please avoid scratches or damage to your vehicle!',
    arrivalDirectionsWarning:
      'Many navigation systems suggest a narrow road that is not suitable for motorhomes. Please do not follow your GPS and instead use the following link:',
    directionsLink: 'Open directions in Google Maps',
    thankYou: 'Thank you for booking with byherger!',
    rulesTitle: 'Rules',
    rules: [
      'Children and teenagers under 16 must always be supervised by an adult.',
      "Children's vehicles must remain in the designated area. After use, please return the vehicles to the designated parking area in the barn.",
      'Thank you for helping us keep the farm clean.',
    ],
    facilitiesTitle: 'Facilities',
    facilities: [
      'WiFi in the farm shop: SSID: WiFi byherger, Password: Vollmond',
      'Sanitary facilities (toilets, showers, baby changing area, chemical toilet disposal, fresh water)',
      'Self-service farm shop & café (open daily from 7:00 AM to 9:00 PM)',
      'Electricity, waste disposal, fire pit (firewood available in farm shop)',
      'Wood-fired sauna for up to 5 people (reservation: 079 425 52 63)',
    ],
    saunaTitle: 'Wood-Fired Sauna',
    numberOfPeople: 'Number of Persons',
    price: 'Price',
    contactTitle: 'Contact',
  },
};

const CONTACTS =
  'Franz 079 425 52 63, Doris 078 866 46 42, Laura 076 399 34 49, Sven 076 343 30 46, Nino 076 580 93 95';
const DIRECTIONS_URL = 'https://goo.gl/maps/z7DCgHpszoDWJZfK9';
const ALLOWED_FONT_PATHS = new Set(Object.values(robotoFonts.Roboto));

pdfmake.addFonts(robotoFonts);
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy((filePath) => ALLOWED_FONT_PATHS.has(filePath));

export async function generateBookingPDF(
  booking: BookingPdfInput,
  settings: Settings,
  language: string,
): Promise<Buffer> {
  const lang = language === 'de' ? 'de' : 'en';
  const copy = PDF_COPY[lang];
  const documentDefinition = createDocumentDefinition(booking, settings, copy);
  const pdf = pdfmake.createPdf(documentDefinition);
  const buffer = await pdf.getBuffer();

  return Buffer.from(buffer);
}

function createDocumentDefinition(
  booking: BookingPdfInput,
  settings: Settings,
  copy: PdfCopy,
): Record<string, unknown> {
  const vehicleRows = booking.cars.map((car, index) => [
    `${index + 1}`,
    car.carPlate,
    centeredCell(`${car.adults}`),
    centeredCell(`${car.children}`),
    rightAlignedCell(formatCurrency(car.priceBase)),
    rightAlignedCell(formatCurrency(car.priceTax)),
  ]);

  return {
    pageSize: 'A4',
    pageMargins: [32, 30, 32, 30],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9,
      color: '#333333',
      lineHeight: 1.15,
    },
    content: [
      { text: copy.title, style: 'title' },
      {
        columns: [
          createInformationCard(copy.guestInformation, [
            informationLine(copy.salutation, booking.guest.salutation),
            informationLine(
              copy.name,
              `${booking.guest.firstName} ${booking.guest.lastName}`,
            ),
            informationLine(copy.nationality, booking.guest.nationality),
            informationLine(copy.email, booking.guest.email),
            informationLine(
              copy.phone,
              `${booking.guest.phoneCountryCode} ${booking.guest.phoneNumber}`,
            ),
          ]),
          createInformationCard(copy.period, [
            informationLine(
              copy.checkIn,
              `${booking.checkIn} ${copy.from} ${settings.checkInTime}`,
            ),
            informationLine(
              copy.checkOut,
              `${booking.checkOut} ${copy.until} ${settings.checkOutTime}`,
            ),
            informationLine(copy.vehicleCount, `${booking.cars.length}`),
          ]),
        ],
        columnGap: 10,
        margin: [0, 0, 0, 14],
      },
      {
        text: copy.vehiclesAndOccupants,
        style: 'sectionTitleCompact',
      },
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: [22, '*', 44, 40, 55, 50],
          body: [
            [
              tableHeader(copy.number),
              tableHeader(copy.plate),
              tableHeader(copy.adults, 'center'),
              tableHeader(copy.children, 'center'),
              tableHeader(copy.basePrice, 'right'),
              tableHeader(copy.touristTax, 'right'),
            ],
            ...vehicleRows,
          ],
        },
        layout: {
          fillColor: (rowIndex: number) => {
            if (rowIndex === 0) return '#e8e8e8';
            return rowIndex % 2 === 0 ? '#fafafa' : null;
          },
          hLineColor: () => '#cccccc',
          vLineColor: () => '#dddddd',
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
      },
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: `${copy.totalPrice}: CHF ${booking.priceTotal.toFixed(2)} ${copy.paid}`,
                alignment: 'center',
                bold: true,
                fontSize: 12,
                margin: [8, 7, 8, 7],
              },
            ],
          ],
        },
        layout: borderedLayout('#222222', 1.5),
        margin: [0, 14, 0, 14],
      },
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                fillColor: '#fff0f0',
                margin: [10, 8, 10, 8],
                stack: [
                  {
                    text: copy.arrivalTitle,
                    bold: true,
                    fontSize: 11,
                    color: '#bb0000',
                    margin: [0, 0, 0, 5],
                  },
                  { text: copy.arrivalDamageWarning },
                  {
                    text: copy.arrivalDirectionsWarning,
                    margin: [0, 4, 0, 4],
                  },
                  {
                    text: copy.directionsLink,
                    link: DIRECTIONS_URL,
                    color: '#0055aa',
                    decoration: 'underline',
                  },
                ],
              },
            ],
          ],
        },
        layout: borderedLayout('#cc0000', 1.5),
      },
      {
        text: copy.thankYou,
        alignment: 'center',
        color: '#666666',
        fontSize: 8.5,
        margin: [0, 14, 0, 0],
      },
      {
        text: copy.rulesTitle,
        style: 'sectionTitle',
        pageBreak: 'before',
      },
      ...copy.rules.map((rule, index) => ({
        text: rule,
        margin: [0, index === 0 ? 0 : 7, 0, 0],
      })),
      { text: copy.facilitiesTitle, style: 'sectionTitle' },
      { ul: copy.facilities, margin: [0, 0, 0, 5] },
      { text: copy.saunaTitle, style: 'sectionTitle' },
      {
        table: {
          widths: ['*', 48, 48, 48, 48],
          body: [
            [
              tableHeader(copy.numberOfPeople),
              tableHeader('1-2', 'center'),
              tableHeader('3', 'center'),
              tableHeader('4', 'center'),
              tableHeader('5', 'center'),
            ],
            [
              { text: copy.price, bold: true },
              centeredCell('CHF 20.-'),
              centeredCell('CHF 30.-'),
              centeredCell('CHF 40.-'),
              centeredCell('CHF 50.-'),
            ],
          ],
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#eeeeee' : null),
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc',
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
      },
      { text: copy.contactTitle, style: 'sectionTitle' },
      { text: CONTACTS },
    ],
    styles: {
      title: {
        fontSize: 19,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 16],
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        color: '#222222',
        margin: [0, 18, 0, 7],
      },
      sectionTitleCompact: {
        fontSize: 12,
        bold: true,
        color: '#222222',
        margin: [0, 0, 0, 5],
      },
      cardTitle: {
        fontSize: 10,
        bold: true,
        margin: [0, 0, 0, 5],
      },
      tableHeader: { bold: true, fontSize: 8 },
    },
  };
}

function createInformationCard(
  title: string,
  lines: Array<Record<string, unknown>>,
): Record<string, unknown> {
  return {
    width: '*',
    table: {
      widths: ['*'],
      body: [
        [
          {
            fillColor: '#f7f7f7',
            margin: [10, 8, 10, 8],
            stack: [{ text: title, style: 'cardTitle' }, ...lines],
          },
        ],
      ],
    },
    layout: borderedLayout('#cccccc'),
  };
}

function informationLine(
  label: string,
  value: string,
): Record<string, unknown> {
  return { text: [{ text: `${label}: `, bold: true }, value] };
}

function tableHeader(
  text: string,
  alignment?: 'left' | 'center' | 'right',
): Record<string, unknown> {
  return {
    text,
    style: 'tableHeader',
    ...(alignment ? { alignment } : {}),
  };
}

function centeredCell(text: string): Record<string, unknown> {
  return { text, alignment: 'center' };
}

function rightAlignedCell(text: string): Record<string, unknown> {
  return { text, alignment: 'right' };
}

function formatCurrency(value: number): string {
  return `CHF ${value.toFixed(2)}`;
}

function borderedLayout(color: string, width = 1): Record<string, unknown> {
  return {
    hLineWidth: () => width,
    vLineWidth: () => width,
    hLineColor: () => color,
    vLineColor: () => color,
  };
}
