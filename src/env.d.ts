/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SANITY_PROJECT_ID?: string;
  readonly PUBLIC_SANITY_PROJECT_ID?: string;
  readonly SANITY_DATASET?: string;
  readonly PUBLIC_SANITY_DATASET?: string;
  readonly PUBLIC_FORM_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
