import React, { useMemo } from 'react';
import { StockItem, AuditSession } from '../types/stock';
import { Package, Hash, MapPin, Tag, Activity, CheckCircle2 } from 'lucide-react';

interface AnalyticsViewProps {
  items: StockItem[];
  activeSession: AuditSession | undefined;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ items, activeSession }) => {
  const stats = useMemo(() => {
    const totalLines = items.length;
    let totalQty = 0;

    const categoryMap = new Map<string, number>();
    const locationMap = new Map<string, number>();
    const uniqueSerials = new Set<string>();

    items.forEach((item) => {
      const count = item.serials?.length || item.qty || 1;
      totalQty += count;

      if (item.serials) {
        item.serials.forEach((s) => uniqueSerials.add(s.trim().toLowerCase()));
      }

      const cat = item.category || 'General';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + count);

      const loc = item.location || 'Main Warehouse';
      locationMap.set(loc, (locationMap.get(loc) || 0) + count);
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([name, qty]) => ({ name, qty, pct: totalQty > 0 ? Math.round((qty / totalQty) * 100) : 0 }))
      .sort((a, b) => b.qty - a.qty);

    const locationBreakdown = Array.from(locationMap.entries())
      .map(([name, qty]) => ({ name, qty, pct: totalQty > 0 ? Math.round((qty / totalQty) * 100) : 0 }))
      .sort((a, b) => b.qty - a.qty);

    return {
      totalLines,
      totalQty,
      uniqueSerialsCount: uniqueSerials.size,
      locationCount: locationMap.size,
      categoryBreakdown,
      locationBreakdown,
    };
  }, [items]);

  return (
    <div className="space-y-4">
      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Package className="w-4 h-4 text-cyan-400" /> Total Units
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
            {stats.totalQty}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total quantity counted</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Hash className="w-4 h-4 text-purple-400" /> Item Groups
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
            {stats.totalLines}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Unique item models</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unique Serials
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
            {stats.uniqueSerialsCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Recorded SN tags</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-amber-400" /> Locations
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
            {stats.locationCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Active storage zones</p>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Breakdown */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-4 h-4 text-cyan-400" /> Quantity by Category
          </h3>

          <div className="space-y-2.5">
            {stats.categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No category data yet.</p>
            ) : (
              stats.categoryBreakdown.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">{cat.name}</span>
                    <span className="font-mono text-slate-400">
                      {cat.qty} units ({cat.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Location Breakdown */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" /> Quantity by Location Tag
          </h3>

          <div className="space-y-2.5">
            {stats.locationBreakdown.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No location data yet.</p>
            ) : (
              stats.locationBreakdown.map((loc) => (
                <div key={loc.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">{loc.name}</span>
                    <span className="font-mono text-slate-400">
                      {loc.qty} units ({loc.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${loc.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" /> Recent Scans & Entries
        </h3>

        <div className="divide-y divide-slate-800">
          {items.slice(0, 5).map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-cyan-400 font-mono">[{item.code}]</span>{' '}
                <span className="font-semibold text-white">{item.name}</span>
                <span className="mx-1 text-slate-500">·</span>
                <span className="text-slate-400 font-mono">Serials: {item.serials?.length || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
