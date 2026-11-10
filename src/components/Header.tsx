import React, { useRef } from 'react';
import {
  Package,
  QrCode,
  Sliders,
  Bookmark,
  Sun,
  Moon,
  BarChart2,
  ListFilter,
  PlusCircle,
  Layers,
  Box,
  Upload,
} from 'lucide-react';
import { AuditSession, ScanSettings, ViewMode, StockItem } from '../types/stock';
import { parseCSVText } from '../utils/exportImport';

interface HeaderProps {
  activeSession: AuditSession | undefined;
  totalItems: number;
  totalQty: number;
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenScanner: () => void;
  onOpenSessions: () => void;
  onOpenPresets: () => void;
  onOpenSettings: () => void;
  onImportItems: (importedItems: Partial<StockItem>[]) => void;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  settings: ScanSettings;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSession,
  totalItems,
  totalQty,
  currentView,
  onSelectView,
  onOpenScanner,
  onOpenSessions,
  onOpenPresets,
  onOpenSettings,
  onImportItems,
  onShowToast,
  settings,
  onToggleTheme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.csv')) {
          const imported = parseCSVText(text, activeSession?.id || 's_main');
          if (imported.length > 0) {
            onImportItems(imported);
            onShowToast('success', 'Excel (CSV) Imported!', `Successfully imported ${imported.length} item groups from CSV.`);
          } else {
            onShowToast('error', 'Import Failed', 'No valid stock rows parsed from CSV file.');
          }
        }
      } catch (err) {
        console.error(err);
        onShowToast('error', 'File Read Error', 'Failed to read CSV file.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md text-white shadow-lg border-b border-cyan-500/30 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Brand & Active Session Lockup */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center shrink-0 shadow-inner">
            <Package className="w-6 h-6 text-cyan-400" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 whitespace-nowrap truncate">
                ⚡ 3D STOCK & EXCEL MANAGER
              </h1>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <button
                onClick={onOpenSessions}
                className="hover:underline flex items-center gap-1 font-medium text-cyan-300 truncate max-w-[140px] sm:max-w-xs"
                title="Click to switch audit session"
              >
                <Layers className="w-3 h-3 shrink-0 text-cyan-400" />
                <span className="truncate">{activeSession?.name || 'Default Session'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls: Scanner + Excel Import + Preset/Setting Modals */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Stats Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-cyan-500/30 text-xs font-mono">
            <span className="text-slate-400">Items:</span>
            <span className="font-bold text-white">{totalItems}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Serials:</span>
            <span className="font-bold text-cyan-300">{totalQty}</span>
          </div>

          {/* Camera Scanner Trigger Button */}
          <button
            onClick={onOpenScanner}
            className="btn-3d flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md border border-cyan-300/30 transition-transform active:scale-95 neon-glow"
            title="Open Camera Barcode Scanner"
          >
            <QrCode className="w-4 h-4 text-cyan-200" />
            <span className="hidden xs:inline">Scanner</span>
          </button>

          {/* Import Excel CSV Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-3d flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md border border-purple-300/30 cursor-pointer transition-transform active:scale-95"
            title="Import Excel (CSV) File"
          >
            <Upload className="w-4 h-4 text-purple-200" />
            <span className="hidden xs:inline">Import CSV</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Presets Manager */}
          <button
            onClick={onOpenPresets}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white transition-colors"
            title="Item Presets Catalog"
          >
            <Bookmark className="w-4 h-4 text-slate-300" />
          </button>

          {/* Settings Modal */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white transition-colors"
            title="Settings"
          >
            <Sliders className="w-4 h-4 text-slate-300" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white transition-colors"
            title="Toggle Theme"
          >
            {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* View Segmented Navigation Bar */}
      <div className="bg-slate-950/80 border-t border-cyan-500/20 px-4 py-1.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
            <button
              onClick={() => onSelectView('count')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'count'
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" /> Entry Form
            </button>
            <button
              onClick={() => onSelectView('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'list'
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> Stock Table ({totalItems})
            </button>
            <button
              onClick={() => onSelectView('viewer3d')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'viewer3d'
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-cyan-300" /> 3D Inspector
            </button>
            <button
              onClick={() => onSelectView('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'analytics'
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> Analytics
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span>Location: <strong className="text-white">{activeSession?.location || 'Main Warehouse'}</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};
