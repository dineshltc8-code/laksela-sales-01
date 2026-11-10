import React, { useState } from 'react';
import { X, Copy, Check, Printer, FileText } from 'lucide-react';
import { StockItem, AuditSession } from '../types/stock';
import { generateSummaryText } from '../utils/exportImport';

interface QuickReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: StockItem[];
  activeSession: AuditSession | undefined;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const QuickReportModal: React.FC<QuickReportModalProps> = ({
  isOpen,
  onClose,
  items,
  activeSession,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const reportText = generateSummaryText(items, activeSession?.name);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    onShowToast('success', 'Report Copied', 'Summary report copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalSerials = items.reduce((acc, curr) => acc + (curr.serials?.length || 0), 0);

    printWindow.document.write(`
      <html>
        <head>
          <title>3D Multi-Serial Stock Audit Report</title>
          <style>
            body { font-family: monospace; padding: 20px; font-size: 13px; line-height: 1.5; background: #fff; color: #000; }
            h1 { font-size: 18px; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
            th { background: #f0f0f0; }
            .serial-tag { display: inline-block; background: #eee; padding: 2px 5px; margin: 2px; border-radius: 4px; font-size: 11px; }
          </style>
        </head>
        <body>
          <h1>3D Multi-Serial Stock Audit Report</h1>
          <p><strong>Session:</strong> ${activeSession?.name || 'Default'}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Item Groups:</strong> ${items.length} | <strong>Total Serials:</strong> ${totalSerials}</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item Code</th>
                <th>Model</th>
                <th>Item Name</th>
                <th>Qty</th>
                <th>Serials</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (i, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td><strong>${i.code}</strong></td>
                  <td>${i.model}</td>
                  <td>${i.name}</td>
                  <td>${i.serials?.length || 0}</td>
                  <td>${(i.serials || []).map((s) => `<span class="serial-tag">${s}</span>`).join(' ')}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl border border-cyan-500/30 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base text-white">
              Stock Summary Report
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          <p className="text-xs text-slate-400">
            Copy formatted multi-serial stock audit report to send via WhatsApp, Email, or Slack:
          </p>

          <textarea
            readOnly
            rows={12}
            value={reportText}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-200 focus:outline-none select-all"
          />
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-700 border border-slate-700"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="btn-3d px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm border border-cyan-400/30"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
