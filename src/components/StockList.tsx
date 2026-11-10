import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Download,
  Filter,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Edit2,
  X,
  Package,
  Share2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { StockItem, AuditSession } from '../types/stock';
import { exportToCSV } from '../utils/exportImport';

interface StockListProps {
  items: StockItem[];
  sessions: AuditSession[];
  activeSession: AuditSession | undefined;
  onEditEntireItem: (index: number) => void;
  onEditSingleSerial: (itemIdx: number, sIdx: number) => void;
  onDeleteSerial: (itemId: string, serialIndex: number) => void;
  onDeleteEntireItem: (id: string) => void;
  onDeleteBatchItems: (ids: string[]) => void;
  onClearAll: () => void;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onOpenReportModal: () => void;
}

export const StockList: React.FC<StockListProps> = ({
  items,
  sessions,
  activeSession,
  onEditEntireItem,
  onEditSingleSerial,
  onDeleteSerial,
  onDeleteEntireItem,
  onDeleteBatchItems,
  onClearAll,
  onShowToast,
  onOpenReportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('ACTIVE');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'code' | 'name' | 'qty'>('newest');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showClearModal, setShowClearModal] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.category && set.add(i.category));
    return Array.from(set);
  }, [items]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.location && set.add(i.location));
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedSessionFilter === 'ACTIVE' && activeSession) {
        if (item.sessionId !== activeSession.id) return false;
      } else if (selectedSessionFilter !== 'ALL' && selectedSessionFilter !== 'ACTIVE') {
        if (item.sessionId !== selectedSessionFilter) return false;
      }

      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      if (selectedLocation !== 'ALL' && item.location !== selectedLocation) {
        return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchCode = item.code?.toLowerCase().includes(query);
        const matchModel = item.model?.toLowerCase().includes(query);
        const matchName = item.name.toLowerCase().includes(query);
        const matchSerials = item.serials && item.serials.some((s) => s.toLowerCase().includes(query));
        return matchCode || matchModel || matchName || matchSerials;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'code') return (a.code || '').localeCompare(b.code || '');
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'qty') return (b.serials?.length || 0) - (a.serials?.length || 0);
      return 0;
    });
  }, [items, selectedSessionFilter, activeSession, selectedCategory, selectedLocation, searchTerm, sortBy]);

  const totalSerialsCount = useMemo(() => {
    return filteredItems.reduce((acc, curr) => acc + (curr.serials?.length || 0), 0);
  }, [filteredItems]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Delete ${selectedIds.length} selected items and all their serials?`)) {
      onDeleteBatchItems(selectedIds);
      onShowToast('info', 'Items Deleted', `Removed ${selectedIds.length} items from stock.`);
      setSelectedIds([]);
    }
  };

  const handleExportSelected = () => {
    const itemsToExport = items.filter((i) => selectedIds.includes(i.id));
    if (itemsToExport.length === 0) return;
    exportToCSV(itemsToExport, sessions, { filename: `selected_stock_${Date.now()}.csv` });
    onShowToast('success', 'CSV Exported', `Exported selected items to Excel CSV.`);
  };

  const handleConfirmClearAll = () => {
    onClearAll();
    setShowClearModal(false);
    setSelectedIds([]);
  };

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 text-slate-100 shadow-2xl">
      {/* Title & Badge Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Scanned Inventory & Data Control
            </h2>
            <p className="text-[11px] text-slate-400">
              Target quantity completion & full data clearance controls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 px-3 py-1 rounded-full font-bold">
            Items: {filteredItems.length} | Serials: {totalSerialsCount}
          </span>

          <button
            onClick={onOpenReportModal}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" /> Report
          </button>

          <button
            onClick={() => exportToCSV(filteredItems, sessions)}
            className="btn-3d px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm border border-emerald-400/30"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>

          <button
            onClick={() => setShowClearModal(true)}
            className="btn-3d px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold border border-rose-500/30"
          >
            Clear All Data
          </button>
        </div>
      </div>

      {/* Toolbar: Search, Sort & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Code, Model, Name, Serial..."
              className="w-full pl-9 pr-8 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder-slate-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="newest">Sort: Newest</option>
              <option value="code">Sort: Code</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="qty">Sort: Serial Count</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-medium"
            >
              <option value="ALL">Category: All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {locations.length > 0 && (
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-medium"
            >
              <option value="ALL">Location: All</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          )}

          {(selectedCategory !== 'ALL' || selectedLocation !== 'ALL' || searchTerm !== '') && (
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedLocation('ALL');
                setSearchTerm('');
              }}
              className="text-xs text-cyan-400 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Multi-Select Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-cyan-950/60 border border-cyan-800 rounded-xl flex items-center justify-between text-xs">
          <span className="font-semibold text-cyan-200">{selectedIds.length} item(s) selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSelected}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Export Selected
            </button>
            <button
              onClick={handleDeleteSelected}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-semibold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Sequential Stock Display Cards */}
      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
            No items or serials recorded yet.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const scannedCount = item.serials?.length || 0;
            const targetQty = item.targetQty || 1;
            const isTargetReached = scannedCount >= targetQty;

            return (
              <div
                key={item.id}
                className={`bg-slate-900/90 border rounded-xl p-3.5 text-xs space-y-2.5 shadow-lg transition-all ${
                  isSelected ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-700/70 hover:border-slate-600'
                }`}
              >
                {/* Header Row */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                  <div className="flex items-start gap-2">
                    <button onClick={() => handleToggleSelect(item.id)} className="mt-0.5 text-slate-500">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm font-mono">{item.code}</span>
                        <span className="text-[11px] text-slate-400 font-normal">Model: {item.model}</span>
                      </div>
                      <span className="text-slate-300 text-xs font-medium block">{item.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Target Qty Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                        isTargetReached
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      Qty: {scannedCount} / {targetQty}
                    </span>

                    <button
                      onClick={() => onEditEntireItem(items.findIndex((i) => i.id === item.id))}
                      title="Edit Item Details"
                      className="bg-blue-500/20 text-blue-300 p-1.5 rounded-lg border border-blue-500/30 hover:bg-blue-500/40 transition-colors"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => onDeleteEntireItem(item.id)}
                      title="Delete Item Group"
                      className="bg-rose-500/20 text-rose-300 p-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/40 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Serials Chips Collection */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.serials && item.serials.length > 0 ? (
                    item.serials.map((s, sIdx) => (
                      <span
                        key={`${s}_${sIdx}`}
                        className="inline-flex items-center gap-1 bg-slate-950 border border-cyan-500/40 text-cyan-300 px-2 py-1 rounded font-mono text-[11px]"
                      >
                        {s}
                        <button
                          onClick={() => onEditSingleSerial(items.findIndex((i) => i.id === item.id), sIdx)}
                          className="text-yellow-400 hover:text-yellow-300 text-[10px] ml-1"
                          title="Edit Serial Number"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onDeleteSerial(item.id, sIdx)}
                          className="text-rose-400 hover:text-rose-300 font-bold ml-0.5 text-xs"
                          title="Delete Serial"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic text-[10px]">No serials scanned yet</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Data Clearance */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-2xl p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white">Full Stock Clearance</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to clear all recorded items and serial numbers in the active session?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleConfirmClearAll}
                className="btn-3d flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-md border border-rose-400/30"
              >
                Clear All Data
              </button>
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
