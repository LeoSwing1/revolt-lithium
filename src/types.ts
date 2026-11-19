/* Shared types for the Revolt Lithium site. Runtime data lives in /js/config.js so the client can edit it without a build. */
export type Brand = 'Livgreen' | 'Redtuff' | 'Revolt';
export type Use = 'rickshaw' | 'twowheeler' | 'inverter';

export interface BatteryModel {
  brand: Brand;
  brandText?: string;
  code: string;
  kind: string;
  vehicle: Use;
  v: number;
  ah: number;
  kwh: number;
  warranty: number;
  size: [number, number, number];
  face: [number, number];
  faceY?: number;
  finish?: 'engraved';
  case?: 'lime' | 'black' | 'steel' | 'white';
  bezel?: number;
  lid?: boolean;
  handles?: 'top' | 'ends' | 'four';
  cable?: boolean;
  display?: boolean;
  displayY?: number;
  cells: number;
  bluetooth?: boolean;
  photo: string;
  alt?: string;
  note?: string;
  fullSpec?: boolean;
}

export interface SalesPoint { name: string; type: string; city: string; address: string; phone: string; maps: string }
export interface SiteConfig {
  siteUrl: string;
  turnstileSiteKey?: string;
  salesPoints?: SalesPoint[];
  social?: { facebook?: string; instagram?: string; youtube?: string; linkedin?: string };
  verification?: { google?: string; bing?: string; facebook?: string; pinterest?: string };
  business: { name: string; phones: string[]; whatsapp: string; email: string; owner: string; googleReviewUrl?: string; gbpMapsUrl?: string };
  quoteEndpoint: string;
  tracking: {
    gtm: string; ga4: string; metaPixel: string;
    googleAds: { id: string; leadLabel: string; callLabel: string };
    clarity: string; linkedin: string; bingUet?: string; requireConsent: boolean;
  };
}

export interface Viewer {
  start(id: string): Promise<void>;
  setModel(id: string): void;
  setXray(on: boolean): void;
  setCharge(v: number): void;
  readonly modelId: string | null;
}

declare global {
  interface Window {
    REVOLT_CONFIG: SiteConfig;
    REVOLT_MODELS: Record<string, BatteryModel>;
    dataLayer: unknown[];
    fbq?: (...a: unknown[]) => void;
    clarity?: (...a: unknown[]) => void;
    _fbq?: unknown;
    _linkedin_partner_id?: string;
  }
  interface Navigator { deviceMemory?: number }
}
