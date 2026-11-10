import React, { useRef } from 'react';
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  Smartphone,
  CheckSquare,
  AlertTriangle,
  Download,
  Upload,
  RotateCcw,
  MapPin,
  FileSpreadsheet,
} from 'lucide-react';
import { ScanSettings, StockItem, AuditSession } from '../types/stock';
import { exportToJSON, parseCSVText } from '../utils/exportImport';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ScanSettings;
  onUpdateSettings: (settings: ScanSettings) => void;
  items: StockItem[];
  sessions: AuditSession[];
  onImportItems: (importedItems: Partial<StockItem>[]) => void;
  onResetData: () => void;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  items,
  sessions,
  onImportItems,
  onResetData,
  onShowToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleToggle = (key: keyof ScanSettings) => {
    onUpdateSettings({ ...settings, [key]: !settings[key] });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (parsed.items && Array.isArray(parsed.items)) {
            onImportItems(parsed.items);
            onShowToast('success', 'Backup Restored', `Imported ${parsed.items.length} items from JSON backup.`);
          } else {
            onShowToast('error', 'Invalid JSON', 'JSON file does not contain a valid items array.');
          }
        } else if (file.name.endsWith('.csv')) {
          const imported = parseCSVText(text, 's_main');
          if (imported.length > 0) {
            onImportItems(imported);
            onShowToast('success', 'CSV Imported', `Successfully imported ${imported.length} items from CSV.`);
          } else {
            onShowToast('error', 'Import Failed', 'Could not parse valid stock rows from CSV file.');
          }
        }
      } catch (err) {
        console.error(err);
        onShowToast('error', 'File Read Error', 'Failed to read file contents.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              App & Scanner Settings
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1">
          {/* Audio & Haptics Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Feedback & Audio
            </h4>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="flex items-center gap-2.5">
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Audio Beep Feedback</h5>
                  <p className="text-[11px] text-slate-500">Play crisp beep sound on scan success / duplicate</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={() => handleToggle('soundEnabled')}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-blue-500" />
                <div>
                  <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Haptic Vibration</h5>
                  <p className="text-[11px] text-slate-500">Vibrate mobile device upon barcode recognition</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.vibrateEnabled}
                onChange={() => handleToggle('vibrateEnabled')}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Rapid Scanner Preferences */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Rapid Inventory Workflow
            </h4>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div>
                <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Auto-Clear Serial Input</h5>
                <p className="text-[11px] text-slate-500">Automatically clear serial input after adding item</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoClearSerial}
                onChange={() => handleToggle('autoClearSerial')}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div>
                <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Auto-Focus Serial Input</h5>
                <p className="text-[11px] text-slate-500">Keep focus in serial field for continuous hardware barcode gun scanning</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoFocusSerial}
                onChange={() => handleToggle('autoFocusSerial')}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div>
                <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Allow Duplicate Serials</h5>
                <p className="text-[11px] text-slate-500">If disabled, duplicate serial numbers will be blocked</p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowDuplicates}
                onChange={() => handleToggle('allowDuplicates')}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Backup & Import */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Backup, Restore & Import
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => exportToJSON(items, sessions)}
                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-blue-500" /> Export Backup (JSON)
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Upload className="w-4 h-4 text-emerald-500" /> Import CSV / JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all stock count data to factory defaults?')) {
                  onResetData();
                  onShowToast('info', 'Factory Reset', 'Stock data restored to default state.');
                  onClose();
                }
              }}
              className="w-full py-2 px-3 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore Sample Demo Data
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
