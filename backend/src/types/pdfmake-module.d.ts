declare module 'pdfmake' {
  export interface PdfOutputDocument {
    getBuffer(): Promise<Uint8Array>;
  }

  export function addFonts(fonts: Record<string, Record<string, string>>): void;
  export function setUrlAccessPolicy(policy: (url: string) => boolean): void;
  export function setLocalAccessPolicy(
    policy: (filePath: string) => boolean,
  ): void;
  export function createPdf(documentDefinition: unknown): PdfOutputDocument;
}

declare module 'pdfmake/fonts/Roboto' {
  export const Roboto: Record<string, string>;
}
