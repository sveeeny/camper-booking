// src/countries.d.ts
declare module '@/countries' {
    export interface Country {
      code: string;
      name: string;
      dialCode: string;
    }
  
    export const countries: Country[];
  }
  