export interface StockItem {
  id: string;
  code: string;       // Item Code (e.g. ITM-889)
  model: string;      // Model (e.g. Pro-V2)
  name: string;       // Item Name (e.g. Router)
  targetQty: number;  // Target Quantity expected (e.g. 5)
  serials: string[];  // Multi-serial array of unique serial numbers
  qty: number;        // Computed from serials.length
  category: string;
  location: string;
  sessionId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditSession {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'completed' | 'archived';
  notes?: string;
  createdAt: string;
}

export interface ItemPreset {
  id: string;
  code: string;
  model: string;
  name: string;
  category: string;
  defaultQty: number;
  sku?: string;
}

export interface ScanSettings {
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  autoClearSerial: boolean;
  autoFocusSerial: boolean;
  allowDuplicates: boolean;
  continuousScanMode: boolean;
  defaultLocation: string;
  defaultCategory: string;
  csvDelimiter: string;
  theme: 'dark' | 'light';
}

export type ViewMode = 'count' | 'list' | 'viewer3d' | 'sessions' | 'presets' | 'analytics';
export type ScanTargetField = 'itemCode' | 'serialNo' | 'model';
