/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_AUTH_ENABLED?: string;
  readonly VITE_MOCK_FORECAST?: string;
  // Add other VITE_ variables as needed
}
