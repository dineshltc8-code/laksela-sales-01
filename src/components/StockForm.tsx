import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Plus,
  AlertTriangle,
  Bookmark,
  Cpu,
  RefreshCcw,
  Barcode,
  CheckCircle2,
  Edit2,
  X,
} from 'lucide-react';
import { StockItem, ItemPreset, AuditSession, ScanSettings, ScanTargetField } from '../types/stock';
import { audioService } from '../utils/audio';

interface StockFormProps {
  onSaveItemAndSerial: (
    itemDetails: { code: string; name: string; model: string; targetQty: number; category: string; location: string },
    serialNumber: string,
    editingIndex: number | null
  ) => void;
  editingItem: { item: StockItem; index: number } | null;
  onCancelEdit: () => void;
  existingItems: StockItem[];
  presets: ItemPreset[];
  activeSession: AuditSession | undefined;
  settings: ScanSettings;
  onOpenScanner: (targetField: ScanTargetField) => void;
  scannedCode?: { text: string; target: ScanTargetField };
  onClearScannedCode?: () => void;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const StockForm: React.FC<StockFormProps> = ({
  onSaveItemAndSerial,
  editingItem,
  onCancelEdit,
  existingItems,
  presets,
  activeSession,
  settings,
  onOpenScanner,
  scannedCode,
  onClearScannedCode,
  onShowToast,
}) => {
  const [code, setCode] = useState('ITM-889');
  const [model, setModel] = useState('Pro-V2');
  const [name, setName] = useState('Router');
  const [targetQty, setTargetQty] = useState(1);
  const [serial, setSerial] = useState('');
  const [category, setCategory] = useState(settings.defaultCategory || 'Networking');
  const [location, setLocation] = useState(activeSession?.location || settings.defaultLocation || 'Main Warehouse');

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const serialInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Sync state if editing an item
  useEffect(() => {
    if (editingItem) {
      setCode(editingItem.item.code);
      setModel(editingItem.item.model);
      setName(editingItem.item.name);
      setTargetQty(editingItem.item.targetQty || 1);
      setSerial('');
    }
  }, [editingItem]);

  // Sync camera barcode scan
  useEffect(() => {
    if (scannedCode?.text) {
      if (scannedCode.target === 'itemCode') {
        setCode(scannedCode.text);
        onShowToast('success', 'Code Scanned!', `Item Code set to: ${scannedCode.text}`);
        // Automatically set scanner target to serial for 2-step scanning workflow
      } else if (scannedCode.target === 'model') {
        setModel(scannedCode.text);
      } else {
        setSerial(scannedCode.text);
        setTimeout(() => {
          handleExecuteSave(scannedCode.text);
        }, 100);
      }
      if (onClearScannedCode) onClearScannedCode();
    }
  }, [scannedCode, onClearScannedCode]);

  // Global duplicate serial check
  useEffect(() => {
    if (!serial.trim()) {
      setDuplicateWarning(null);
      return;
    }
    const search = serial.trim().toLowerCase();
    let isDup = false;

    existingItems.forEach((item, itemIdx) => {
      // If editing current item, allow existing serials of current item
      if (editingItem && editingItem.index === itemIdx) return;
      if (item.serials && item.serials.some((s) => s.trim().toLowerCase() === search)) {
        isDup = true;
      }
    });

    if (isDup) {
      setDuplicateWarning(`⚠️ Duplicate Error: Serial "${serial}" already exists in stock!`);
    } else {
      setDuplicateWarning(null);
    }
  }, [serial, existingItems, editingItem]);

  const handleExecuteSave = (targetSerial: string) => {
    const cleanCode = code.trim();
    const cleanModel = model.trim();
    const cleanName = name.trim();
    const cleanSerial = targetSerial.trim();
    const parsedTargetQty = Math.max(1, targetQty);

    if (!cleanCode || !cleanName) {
      onShowToast('error', 'Missing Fields', 'Please enter or scan Item Code & Item Name first.');
      codeInputRef.current?.focus();
      return;
    }

    if (editingItem !== null) {
      // Update Item Details Mode
      onSaveItemAndSerial(
        {
          code: cleanCode,
          model: cleanModel || 'Pro-V2',
          name: cleanName,
          targetQty: parsedTargetQty,
          category,
          location,
        },
        cleanSerial,
        editingItem.index
      );

      onShowToast('success', 'Item Details Updated', `Saved changes for [${cleanCode}] ${cleanName}.`);
      audioService.playBeep('success', settings.soundEnabled);
      onCancelEdit();
      return;
    }

    // Adding New Serial Mode
    if (!cleanSerial) {
      onShowToast('error', 'Missing Serial', 'Please enter or scan a Serial Number.');
      serialInputRef.current?.focus();
      return;
    }

    // Check duplicate
    let isDup = false;
    existingItems.forEach((item) => {
      if (item.serials && item.serials.some((s) => s.trim().toLowerCase() === cleanSerial.toLowerCase())) {
        isDup = true;
      }
    });

    if (isDup && !settings.allowDuplicates) {
      onShowToast('warning', 'Duplicate Serial Blocked', `⚠️ Serial "${cleanSerial}" already exists!`);
      audioService.playBeep('warning', settings.soundEnabled);
      audioService.triggerVibrate(settings.vibrateEnabled, [100, 50, 100]);
      serialInputRef.current?.focus();
      return;
    }

    onSaveItemAndSerial(
      {
        code: cleanCode,
        model: cleanModel || 'Pro-V2',
        name: cleanName,
        targetQty: parsedTargetQty,
        category,
        location,
      },
      cleanSerial,
      null
    );

    onShowToast('success', 'Serial Added', `✅ Serial Added: ${cleanSerial}`);
    audioService.playBeep('success', settings.soundEnabled);
    audioService.triggerVibrate(settings.vibrateEnabled);

    setSerial('');
    setTimeout(() => {
      serialInputRef.current?.focus();
    }, 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteSave(serial);
  };

  const handleSelectPreset = (preset: ItemPreset) => {
    setCode(preset.code || 'ITM-889');
    setModel(preset.model || 'Pro-V2');
    setName(preset.name);
    setTargetQty(preset.defaultQty || 1);
    setCategory(preset.category);
    onShowToast('info', 'Preset Loaded', `Applied: ${preset.name}`);
    setTimeout(() => {
      serialInputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-cyan-500/30 space-y-3.5 text-slate-100 shadow-2xl">
      {/* Header Bar */}
      <div className="flex justify-between items-center border-b border-white/10 pb-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-cyan-400" />
          {editingItem ? 'Edit Item Details' : 'Step 1: Item Details & Target Qty'}
        </h2>
        <button
          type="button"
          onClick={() => onOpenScanner('itemCode')}
          className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded font-bold border border-cyan-500/30 hover:bg-cyan-500/30 flex items-center gap-1"
        >
          <Barcode className="w-3.5 h-3.5" /> Scan Code
        </button>
      </div>

      {/* Catalog Presets */}
      {presets.length > 0 && !editingItem && (
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Bookmark className="w-3 h-3 text-cyan-400" /> Catalog Presets
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {presets.slice(0, 4).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="px-2 py-0.5 text-xs font-mono rounded bg-slate-900 border border-cyan-500/30 text-cyan-300 whitespace-nowrap shrink-0 hover:bg-cyan-950/60"
              >
                {preset.code} · {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Item Code</label>
            <input
              ref={codeInputRef}
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. ITM-889"
              className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Model</label>
            <input
              type="text"
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. Pro-V2"
              className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-xs text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Item Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Router"
              className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-xs text-white font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-cyan-400 uppercase mb-1">Target Qty</label>
            <input
              type="number"
              min="1"
              required
              value={targetQty}
              onChange={(e) => setTargetQty(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 bg-slate-900/90 border border-cyan-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-xs font-bold text-cyan-300 text-center"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Serial Input & Action Button */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-[10px] font-bold text-cyan-300 uppercase">
            Step 2: Enter / Scan Serial
          </label>
          <button
            type="button"
            onClick={() => onOpenScanner('serialNo')}
            className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold border border-cyan-500/30 hover:bg-cyan-500/30 flex items-center gap-1"
          >
            <QrCode className="w-3.5 h-3.5" /> Scan Serial
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={serialInputRef}
            type="text"
            placeholder="Type or Scan Serial Number"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            className={`w-full px-3 py-2.5 bg-slate-950 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-xs font-mono text-cyan-200 placeholder-slate-500 ${
              duplicateWarning ? 'border-amber-500 bg-amber-950/30' : 'border-cyan-500/40'
            }`}
          />
          <button
            type="submit"
            className="btn-3d bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 rounded-lg text-xs whitespace-nowrap border border-cyan-300/30 shadow-md shadow-cyan-600/30"
          >
            {editingItem ? 'Update Item' : '+ Add Serial'}
          </button>
        </form>

        {editingItem && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="w-full py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Cancel Editing
          </button>
        )}

        {duplicateWarning && (
          <div className="p-2 bg-amber-950/80 border border-amber-700 rounded-lg text-[11px] text-amber-200 flex items-start gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="font-semibold">{duplicateWarning}</p>
          </div>
        )}
      </div>
    </div>
  );
};
