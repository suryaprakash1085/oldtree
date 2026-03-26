/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TENANT_ID: string;
  readonly VITE_TENANT_NAME: string;
  readonly VITE_BACKEND_URL: string;
  readonly VITE_THEME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
