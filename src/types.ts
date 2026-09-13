export interface GPSLocation {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy: number;
  heading?: number | null;
  speed?: number | null;
  address?: string;
  city?: string;
  country?: string;
  timestamp: number;
  error?: string | null;
}

export type StampStyle = 'standard' | 'survey' | 'minimal' | 'technical';
export type StampPosition = 'bottom-left' | 'bottom-right' | 'bottom-banner' | 'top-left';

export interface StampSettings {
  showDateTime: boolean;
  showCoordinates: boolean;
  showAddress: boolean;
  showAltitude: boolean;
  showAccuracy: boolean;
  showCustomNote: boolean;
  customNote: string;
  projectName: string;
  style: StampStyle;
  position: StampPosition;
  dateFormat: 'locale' | 'iso' | 'custom';
  coordinatesFormat: 'decimal' | 'dms';
  fontSize: 'small' | 'medium' | 'large';
  stampBackgroundOpacity: number;
}

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
  location: GPSLocation | null;
  settingsSnapshot: StampSettings;
  width: number;
  height: number;
}

export interface AndroidSourceFile {
  path: string;
  name: string;
  language: string;
  content: string;
  description: string;
}
