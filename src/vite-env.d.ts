/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PERF_LAZY_DATA?: string;
  readonly VITE_AGENDA_REFRESH_MS?: string;
  readonly VITE_GOOGLE_CALENDAR_ICAL_URL?: string;
  readonly VITE_AUTH_EMAIL_REDIRECT_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly BASE_URL: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
