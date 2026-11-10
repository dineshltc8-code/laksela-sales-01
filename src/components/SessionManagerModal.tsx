import React, { useState } from 'react';
import { X, Plus, Layers, CheckCircle2, Archive, MapPin, Calendar, Clock } from 'lucide-react';
import { AuditSession, StockItem } from '../types/stock';
import { audioService } from '../utils/audio';

interface SessionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: AuditSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: (name: string, location: string, notes?: string) => void;
  onUpdateSessionStatus: (id: string, status: 'active' | 'completed' | 'archived') => void;
  items: StockItem[];
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const SessionManagerModal: React.FC<SessionManagerModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onUpdateSessionStatus,
  items,
  onShowToast,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newLocation, setNewLocation] = useState('Main Warehouse');
  const [newNotes, setNewNotes] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) {
      onShowToast('error', 'Missing Name', 'Please enter a name for the audit session.');
      return;
    }

    onCreateSession(newSessionName.trim(), newLocation.trim(), newNotes.trim());
    onShowToast('success', 'Audit Session Created', `Created session: ${newSessionName.trim()}`);
    setNewSessionName('');
    setNewNotes('');
    setIsCreating(false);
  };

  const getItemCountForSession = (sessionId: string) => {
    const sessionItems = items.filter((i) => i.sessionId === sessionId);
    const totalQty = sessionItems.reduce((acc, curr) => acc + curr.qty, 0);
    return { lines: sessionItems.length, totalQty };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Audit Sessions & Batches
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Create New Session Toggle/Form */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 px-4 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Start New Audit Count Session
            </button>
          ) : (
            <form onSubmit={handleCreate} className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                Create New Audit Session
              </h4>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Session Name (e.g. Q4 Hardware Audit, Van 03 Inventory)
                </label>
                <input
                  type="text"
                  required
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g. Main Store Audit"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Location Tag
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Main Warehouse"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Annual physical count check"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  Create & Activate
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Session Cards List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Available Sessions
            </h4>

            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const stats = getItemCountForSession(session.id);

              return (
                <div
                  key={session.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 shadow-sm ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{session.name}</h4>
                        {isActive && (
                          <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Active Session
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                            session.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : session.status === 'archived'
                              ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {session.location}
                        </span>
                        <span>·</span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {stats.lines} lines ({stats.totalQty} units)
                        </span>
                      </div>

                      {session.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">{session.notes}</p>
                      )}
                    </div>

                    {!isActive && (
                      <button
                        onClick={() => {
                          onSelectSession(session.id);
                          onShowToast('info', 'Session Changed', `Switched active session to "${session.name}".`);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shrink-0 shadow-sm"
                      >
                        Select
                      </button>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      Created {new Date(session.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      {session.status !== 'completed' && (
                        <button
                          onClick={() => {
                            onUpdateSessionStatus(session.id, 'completed');
                            onShowToast('success', 'Audit Completed', `Session "${session.name}" marked completed.`);
                          }}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
