// <reference types="vite/client" />

// Optional: Unterstützung für .vue-Dateien
declare module '*.vue' {
    import { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
  }

  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    // weitere env-Variablen hier einfügen...
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  