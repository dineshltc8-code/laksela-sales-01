import { StockItem, AuditSession, ItemPreset, ScanSettings } from '../types/stock';

const STORAGE_KEYS = {
  ITEMS: 'mstock_items_v5',
  SESSIONS: 'mstock_sessions_v5',
  PRESETS: 'mstock_presets_v5',
  SETTINGS: 'mstock_settings_v5',
  ACTIVE_SESSION_ID: 'mstock_active_session_v5',
};

export const DEFAULT_SETTINGS: ScanSettings = {
  soundEnabled: true,
  vibrateEnabled: true,
  autoClearSerial: true,
  autoFocusSerial: true,
  allowDuplicates: false,
  continuousScanMode: true,
  defaultLocation: 'Main Warehouse',
  defaultCategory: 'Networking',
  csvDelimiter: ',',
  theme: 'dark',
};

export const DEFAULT_PRESETS: ItemPreset[] = [
  { id: 'p1', code: 'ITM-889', model: 'Pro-V2', name: 'Gigabit Wireless Router', category: 'Networking', defaultQty: 3, sku: 'NET-ROUTER-PROV2' },
  { id: 'p2', code: 'ITM-542', model: 'Latitude 5420', name: 'Dell Enterprise Laptop', category: 'Laptops', defaultQty: 2, sku: 'DELL-LAT-5420' },
  { id: 'p3', code: 'ITM-270', model: 'Ultra-27', name: 'Samsung 4K Monitor', category: 'Monitors', defaultQty: 2, sku: 'SAM-S27-4K' },
  { id: 'p4', code: 'ITM-110', model: 'DS2278', name: 'Zebra Barcode Scanner', category: 'Peripherals', defaultQty: 1, sku: 'ZEB-DS2278' },
];

export const DEFAULT_SESSIONS: AuditSession[] = [
  {
    id: 's_main',
    name: '3D Sequential Audit 2026',
    location: 'Main Warehouse',
    status: 'active',
    notes: 'Sequential Stock Manager & Serial Counter',
    createdAt: new Date().toISOString(),
  },
  {
    id: 's_retail',
    name: 'Retail Store Front',
    location: 'Downtown Branch',
    status: 'completed',
    notes: 'Monthly store display stock count',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  }
];

export const DEFAULT_ITEMS: StockItem[] = [
  {
    id: 'item_1',
    code: 'ITM-889',
    model: 'Pro-V2',
    name: 'Gigabit Wireless Router',
    targetQty: 3,
    serials: ['SN-WR-987651', 'SN-WR-987652', 'SN-WR-987653'],
    qty: 3,
    category: 'Networking',
    location: 'Rack A-02',
    sessionId: 's_main',
    notes: 'Target quantity reached (3 / 3)',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'item_2',
    code: 'ITM-542',
    model: 'Latitude 5420',
    name: 'Dell Enterprise Laptop',
    targetQty: 4,
    serials: ['SN-DL-112233', 'SN-DL-112244'],
    qty: 2,
    category: 'Laptops',
    location: 'Shelf B-14',
    sessionId: 's_main',
    notes: 'Pending 2 additional units (2 / 4)',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'item_3',
    code: 'ITM-270',
    model: 'Ultra-27',
    name: 'Samsung 4K Monitor',
    targetQty: 2,
    serials: ['SN-SM-889900'],
    qty: 1,
    category: 'Monitors',
    location: 'Main Warehouse',
    sessionId: 's_main',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  }
];

export const getStoredItems = (): StockItem[] => {
  if (typeof window === 'undefined') return DEFAULT_ITEMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(DEFAULT_ITEMS));
      return DEFAULT_ITEMS;
    }
    const parsed: StockItem[] = JSON.parse(raw);
    return parsed.map((item) => ({
      ...item,
      targetQty: typeof item.targetQty === 'number' ? item.targetQty : (item.serials?.length || 1),
      serials: Array.isArray(item.serials) ? item.serials : [],
    }));
  } catch (e) {
    console.error('Failed to load items', e);
    return DEFAULT_ITEMS;
  }
};

export const saveStoredItems = (items: StockItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save items', e);
  }
};

export const getStoredSessions = (): AuditSession[] => {
  if (typeof window === 'undefined') return DEFAULT_SESSIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(DEFAULT_SESSIONS));
      return DEFAULT_SESSIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load sessions', e);
    return DEFAULT_SESSIONS;
  }
};

export const saveStoredSessions = (sessions: AuditSession[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions', e);
  }
};

export const getActiveSessionId = (): string => {
  if (typeof window === 'undefined') return 's_main';
  try {
    const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
    if (active) return active;
    const sessions = getStoredSessions();
    const firstActive = sessions.find((s) => s.status === 'active') || sessions[0];
    const id = firstActive ? firstActive.id : 's_main';
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, id);
    return id;
  } catch {
    return 's_main';
  }
};

export const saveActiveSessionId = (id: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, id);
  } catch (e) {
    console.error('Failed to save active session', e);
  }
};

export const getStoredPresets = (): ItemPreset[] => {
  if (typeof window === 'undefined') return DEFAULT_PRESETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRESETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(DEFAULT_PRESETS));
      return DEFAULT_PRESETS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load presets', e);
    return DEFAULT_PRESETS;
  }
};

export const saveStoredPresets = (presets: ItemPreset[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save presets', e);
  }
};

export const getStoredSettings = (): ScanSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load settings', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveStoredSettings = (settings: ScanSettings): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
};
