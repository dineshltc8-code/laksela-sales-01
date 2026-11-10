import React, { useState, useEffect, useMemo } from 'react';
import {
  getStoredItems,
  saveStoredItems,
  getStoredSessions,
  saveStoredSessions,
  getActiveSessionId,
  saveActiveSessionId,
  getStoredPresets,
  saveStoredPresets,
  getStoredSettings,
  saveStoredSettings,
  DEFAULT_ITEMS,
  DEFAULT_SESSIONS,
  DEFAULT_PRESETS,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { StockItem, AuditSession, ItemPreset, ScanSettings, ViewMode, ScanTargetField } from './types/stock';
import { Header } from './components/Header';
import { StockForm } from './components/StockForm';
import { StockList } from './components/StockList';
import { AnalyticsView } from './components/AnalyticsView';
import { ThreeStockViewer } from './components/ThreeStockViewer';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { SessionManagerModal } from './components/SessionManagerModal';
import { ItemPresetsModal } from './components/ItemPresetsModal';
import { SettingsModal } from './components/SettingsModal';
import { QuickReportModal } from './components/QuickReportModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { PlusCircle, ListFilter, BarChart2, QrCode, Box } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<StockItem[]>(getStoredItems);
  const [sessions, setSessions] = useState<AuditSession[]>(getStoredSessions);
  const [activeSessionId, setActiveSessionId] = useState<string>(getActiveSessionId);
  const [presets, setPresets] = useState<ItemPreset[]>(getStoredPresets);
  const [settings, setSettings] = useState<ScanSettings>(getStoredSettings);

  const [currentView, setCurrentView] = useState<ViewMode>('count');

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanTargetField, setScanTargetField] = useState<ScanTargetField>('itemCode');

  const [editingItem, setEditingItem] = useState<{ item: StockItem; index: number } | null>(null);

  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const [scannedCodeBuffer, setScannedCodeBuffer] = useState<{ text: string; target: ScanTargetField } | undefined>(undefined);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    saveStoredItems(items);
  }, [items]);

  useEffect(() => {
    saveStoredSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    saveActiveSessionId(activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    saveStoredPresets(presets);
  }, [presets]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0];
  }, [sessions, activeSessionId]);

  const sessionItems = useMemo(() => {
    return items.filter((i) => i.sessionId === activeSessionId);
  }, [items, activeSessionId]);

  const totalSerialsCount = useMemo(() => {
    return sessionItems.reduce((acc, curr) => acc + (curr.serials?.length || 0), 0);
  }, [sessionItems]);

  const showToast = (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: `toast_${Date.now()}_${Math.random()}`,
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev.slice(-3), newToast]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveItemAndSerial = (
    itemDetails: { code: string; name: string; model: string; targetQty: number; category: string; location: string },
    serialNumber: string,
    editingIdx: number | null
  ) => {
    setItems((prev) => {
      const updated = [...prev];

      if (editingIdx !== null && editingIdx < updated.length) {
        const target = updated[editingIdx];
        const newSerials = target.serials || [];
        if (serialNumber && !newSerials.includes(serialNumber)) {
          newSerials.push(serialNumber);
        }
        updated[editingIdx] = {
          ...target,
          code: itemDetails.code,
          name: itemDetails.name,
          model: itemDetails.model,
          targetQty: itemDetails.targetQty,
          serials: newSerials,
          qty: newSerials.length,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }

      const existingIdx = updated.findIndex(
        (i) =>
          i.sessionId === activeSessionId &&
          i.code.trim().toLowerCase() === itemDetails.code.trim().toLowerCase() &&
          i.model.trim().toLowerCase() === itemDetails.model.trim().toLowerCase()
      );

      if (existingIdx >= 0) {
        const target = updated[existingIdx];
        const newSerials = target.serials ? [...target.serials, serialNumber] : [serialNumber];
        updated[existingIdx] = {
          ...target,
          targetQty: itemDetails.targetQty,
          serials: newSerials,
          qty: newSerials.length,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      } else {
        const newItem: StockItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          code: itemDetails.code.trim(),
          model: itemDetails.model.trim(),
          name: itemDetails.name.trim(),
          targetQty: itemDetails.targetQty,
          serials: serialNumber ? [serialNumber] : [],
          qty: serialNumber ? 1 : 0,
          category: itemDetails.category,
          location: itemDetails.location,
          sessionId: activeSessionId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return [newItem, ...updated];
      }
    });
  };

  const handleEditEntireItem = (index: number) => {
    if (index >= 0 && index < sessionItems.length) {
      setEditingItem({ item: sessionItems[index], index: items.findIndex((i) => i.id === sessionItems[index].id) });
      setCurrentView('count');
      showToast('info', 'Edit Item Mode', `Editing details for [${sessionItems[index].code}]`);
    }
  };

  const handleEditSingleSerial = (itemIdx: number, sIdx: number) => {
    if (itemIdx < 0 || itemIdx >= items.length) return;
    const currentItem = items[itemIdx];
    const currentSerial = currentItem.serials[sIdx];
    const newSerial = prompt('Edit Serial Number:', currentSerial);

    if (newSerial && newSerial.trim() !== '') {
      const trimmed = newSerial.trim();
      let isDup = false;

      items.forEach((item) => {
        if (item.serials && item.serials.some((s) => s.toLowerCase() === trimmed.toLowerCase() && s.toLowerCase() !== currentSerial.toLowerCase())) {
          isDup = true;
        }
      });

      if (isDup) {
        showToast('error', 'Duplicate Serial', `⚠️ Serial "${trimmed}" already exists elsewhere!`);
      } else {
        setItems((prev) => {
          const updated = [...prev];
          const targetSerials = [...updated[itemIdx].serials];
          targetSerials[sIdx] = trimmed;
          updated[itemIdx] = {
            ...updated[itemIdx],
            serials: targetSerials,
            updatedAt: new Date().toISOString(),
          };
          return updated;
        });
        showToast('success', 'Serial Updated', `Updated serial to "${trimmed}".`);
      }
    }
  };

  const handleDeleteSerial = (itemId: string, serialIndex: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === itemId) {
            const updatedSerials = item.serials.filter((_, idx) => idx !== serialIndex);
            return {
              ...item,
              serials: updatedSerials,
              qty: updatedSerials.length,
              updatedAt: new Date().toISOString(),
            };
          }
          return item;
        })
        .filter((item) => item.serials.length > 0);
    });
    showToast('info', 'Serial Deleted', 'Serial number removed.');
  };

  const handleDeleteEntireItem = (id: string) => {
    if (confirm('Delete this item entry and all attached serials?')) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast('info', 'Item Removed', 'Item entry deleted.');
    }
  };

  const handleDeleteBatchItems = (ids: string[]) => {
    setItems((prev) => prev.filter((i) => !ids.includes(i.id)));
  };

  const handleClearAll = () => {
    if (confirm('Clear all recorded stock data completely?')) {
      setItems((prev) => prev.filter((i) => i.sessionId !== activeSessionId));
      showToast('warning', 'Stock Data Cleared', 'All recorded items and serials cleared.');
    }
  };

  const handleCreateSession = (name: string, location: string, notes?: string) => {
    const newSession: AuditSession = {
      id: `s_${Date.now()}`,
      name,
      location,
      status: 'active',
      notes,
      createdAt: new Date().toISOString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleUpdateSessionStatus = (id: string, status: 'active' | 'completed' | 'archived') => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const handleOpenScanner = (target: ScanTargetField = 'itemCode') => {
    setScanTargetField(target);
    setIsScannerOpen(true);
  };

  const handleScanCode = (code: string, target: ScanTargetField) => {
    setScannedCodeBuffer({ text: code, target });

    if (target === 'itemCode') {
      setScanTargetField('serialNo');
    }
  };

  const handleResetData = () => {
    setItems(DEFAULT_ITEMS);
    setSessions(DEFAULT_SESSIONS);
    setActiveSessionId('s_main');
    setPresets(DEFAULT_PRESETS);
    setSettings(DEFAULT_SETTINGS);
  };

  const handleImportItems = (imported: Partial<StockItem>[]) => {
    const now = new Date().toISOString();
    
    setItems((prev) => {
      const updated = [...prev];

      imported.forEach((imp, idx) => {
        const impCode = imp.code || `ITM-${100 + idx}`;
        const impModel = imp.model || 'Pro-V2';
        const impName = imp.name || 'Imported Product';
        const impTargetQty = imp.targetQty || 1;
        const impSerials = imp.serials || [];

        const existingIdx = updated.findIndex(
          (i) =>
            i.sessionId === activeSessionId &&
            i.code.trim().toLowerCase() === impCode.trim().toLowerCase() &&
            i.model.trim().toLowerCase() === impModel.trim().toLowerCase()
        );

        if (existingIdx >= 0) {
          const existing = updated[existingIdx];
          const mergedSerials = [...existing.serials];
          impSerials.forEach((s) => {
            if (!mergedSerials.includes(s)) mergedSerials.push(s);
          });
          updated[existingIdx] = {
            ...existing,
            targetQty: Math.max(existing.targetQty, impTargetQty),
            serials: mergedSerials,
            qty: mergedSerials.length,
            updatedAt: now,
          };
        } else {
          updated.unshift({
            id: imp.id || `imp_${Date.now()}_${idx}`,
            code: impCode,
            model: impModel,
            name: impName,
            targetQty: impTargetQty,
            serials: impSerials,
            qty: impSerials.length,
            category: imp.category || 'Networking',
            location: imp.location || activeSession?.location || 'Main Warehouse',
            sessionId: activeSessionId,
            createdAt: imp.createdAt || now,
            updatedAt: now,
          });
        }
      });

      return updated;
    });
  };

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    setSettings((prev) => ({ ...prev, theme: nextTheme }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased transition-colors">
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      <Header
        activeSession={activeSession}
        totalItems={sessionItems.length}
        totalQty={totalSerialsCount}
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenScanner={() => handleOpenScanner('itemCode')}
        onOpenSessions={() => setIsSessionsOpen(true)}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onImportItems={handleImportItems}
        onShowToast={showToast}
        settings={settings}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-4 md:p-6 space-y-6 pb-24 md:pb-8">
        {currentView === 'count' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5">
              <StockForm
                onSaveItemAndSerial={handleSaveItemAndSerial}
                editingItem={editingItem}
                onCancelEdit={() => setEditingItem(null)}
                existingItems={items}
                presets={presets}
                activeSession={activeSession}
                settings={settings}
                onOpenScanner={handleOpenScanner}
                scannedCode={scannedCodeBuffer}
                onClearScannedCode={() => setScannedCodeBuffer(undefined)}
                onShowToast={showToast}
              />
            </div>

            <div className="lg:col-span-7">
              <StockList
                items={sessionItems}
                sessions={sessions}
                activeSession={activeSession}
                onEditEntireItem={handleEditEntireItem}
                onEditSingleSerial={handleEditSingleSerial}
                onDeleteSerial={handleDeleteSerial}
                onDeleteEntireItem={handleDeleteEntireItem}
                onDeleteBatchItems={handleDeleteBatchItems}
                onClearAll={handleClearAll}
                onShowToast={showToast}
                onOpenReportModal={() => setIsReportOpen(true)}
              />
            </div>
          </div>
        )}

        {currentView === 'list' && (
          <StockList
            items={sessionItems}
            sessions={sessions}
            activeSession={activeSession}
            onEditEntireItem={handleEditEntireItem}
            onEditSingleSerial={handleEditSingleSerial}
            onDeleteSerial={handleDeleteSerial}
            onDeleteEntireItem={handleDeleteEntireItem}
            onDeleteBatchItems={handleDeleteBatchItems}
            onClearAll={handleClearAll}
            onShowToast={showToast}
            onOpenReportModal={() => setIsReportOpen(true)}
          />
        )}

        {currentView === 'viewer3d' && (
          <ThreeStockViewer items={sessionItems} onSelectItem={() => {}} />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView items={sessionItems} activeSession={activeSession} />
        )}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-cyan-500/30 grid grid-cols-4 items-center h-16 px-2 pb-safe shadow-xl">
        <button
          onClick={() => setCurrentView('count')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            currentView === 'count' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Form</span>
        </button>

        <button
          onClick={() => setCurrentView('list')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            currentView === 'list' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <ListFilter className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Stock ({sessionItems.length})</span>
        </button>

        <button
          onClick={() => handleOpenScanner('serialNo')}
          className="flex flex-col items-center justify-center h-full text-cyan-400 font-bold"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-600/30">
            <QrCode className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Scan</span>
        </button>

        <button
          onClick={() => setCurrentView('viewer3d')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            currentView === 'viewer3d' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Box className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">3D View</span>
        </button>
      </nav>

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanCode}
        targetField={scanTargetField}
        soundEnabled={settings.soundEnabled}
        vibrateEnabled={settings.vibrateEnabled}
        continuousMode={settings.continuousScanMode}
      />

      <SessionManagerModal
        isOpen={isSessionsOpen}
        onClose={() => setIsSessionsOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onCreateSession={handleCreateSession}
        onUpdateSessionStatus={handleUpdateSessionStatus}
        items={items}
        onShowToast={showToast}
      />

      <ItemPresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        presets={presets}
        onSavePresets={setPresets}
        onShowToast={showToast}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        items={items}
        sessions={sessions}
        onImportItems={handleImportItems}
        onResetData={handleResetData}
        onShowToast={showToast}
      />

      <QuickReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        items={sessionItems}
        activeSession={activeSession}
        onShowToast={showToast}
      />
    </div>
  );
}
