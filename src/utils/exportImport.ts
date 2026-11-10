import { StockItem, AuditSession } from '../types/stock';

export interface CSVExportOptions {
  filename?: string;
  delimiter?: string;
  includeHeader?: boolean;
}

export const exportToCSV = (items: StockItem[], sessions: AuditSession[], options: CSVExportOptions = {}) => {
  const delimiter = options.delimiter || ',';
  const filename = options.filename || `stock_report_${Date.now()}.csv`;

  const sessionMap = new Map<string, string>();
  sessions.forEach((s) => sessionMap.set(s.id, s.name));

  const headers = ['Item Code', 'Item Name', 'Model', 'Target Qty', 'Serial Number', 'Scanned Qty', 'Timestamp'];
  
  const escapeCell = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows: string[] = [];

  items.forEach((item) => {
    const timestamp = new Date(item.createdAt).toLocaleString();

    if (item.serials && item.serials.length > 0) {
      item.serials.forEach((s) => {
        rows.push(
          [
            escapeCell(item.code || 'ITM-889'),
            escapeCell(item.name),
            escapeCell(item.model || 'Pro-V2'),
            item.targetQty || 1,
            escapeCell(s),
            1,
            escapeCell(timestamp),
          ].join(delimiter)
        );
      });
    } else {
      rows.push(
        [
          escapeCell(item.code || 'ITM-889'),
          escapeCell(item.name),
          escapeCell(item.model || 'Pro-V2'),
          item.targetQty || 1,
          escapeCell('N/A'),
          0,
          escapeCell(timestamp),
        ].join(delimiter)
      );
    }
  });

  const csvText = [headers.join(delimiter), ...rows].join('\n');
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToJSON = (items: StockItem[], sessions: AuditSession[]) => {
  const data = {
    app: '3D Stock & Excel Manager',
    version: '6.0',
    exportedAt: new Date().toISOString(),
    itemsCount: items.length,
    totalSerialsCount: items.reduce((acc, curr) => acc + (curr.serials?.length || 0), 0),
    sessions,
    items,
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `3D_stock_excel_backup_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const parseCSVText = (csvContent: string, activeSessionId: string): Partial<StockItem>[] => {
  const lines = csvContent.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headerLine = parseLine(lines[0]).map((h) => h.toLowerCase());
  const codeIdx = headerLine.findIndex((h) => h.includes('code'));
  const nameIdx = headerLine.findIndex((h) => h.includes('name') || h.includes('item'));
  const modelIdx = headerLine.findIndex((h) => h.includes('model'));
  const targetQtyIdx = headerLine.findIndex((h) => h.includes('target'));
  const serialIdx = headerLine.findIndex((h) => h.includes('serial') || h.includes('sn'));

  const itemGroupMap = new Map<string, { code: string; name: string; model: string; targetQty: number; serials: string[] }>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const code = codeIdx >= 0 && cols[codeIdx] ? cols[codeIdx] : `ITM-${100 + i}`;
    const name = nameIdx >= 0 && cols[nameIdx] ? cols[nameIdx] : (cols[0] || 'Imported Item');
    const model = modelIdx >= 0 && cols[modelIdx] ? cols[modelIdx] : 'Pro-V2';
    const targetQty = targetQtyIdx >= 0 ? parseInt(cols[targetQtyIdx], 10) || 1 : 1;
    const serial = serialIdx >= 0 && cols[serialIdx] ? cols[serialIdx] : '';

    const key = `${code.toLowerCase()}___${model.toLowerCase()}`;
    if (itemGroupMap.has(key)) {
      const existing = itemGroupMap.get(key)!;
      if (serial && serial !== 'N/A' && !existing.serials.includes(serial)) {
        existing.serials.push(serial);
      }
    } else {
      itemGroupMap.set(key, {
        code,
        name,
        model,
        targetQty,
        serials: serial && serial !== 'N/A' ? [serial] : [],
      });
    }
  }

  const parsedItems: Partial<StockItem>[] = [];
  let idx = 0;
  itemGroupMap.forEach((val) => {
    idx++;
    parsedItems.push({
      id: `item_imp_${Date.now()}_${idx}`,
      code: val.code,
      name: val.name,
      model: val.model,
      targetQty: val.targetQty,
      serials: val.serials,
      qty: val.serials.length,
      category: 'Networking',
      location: 'Main Warehouse',
      sessionId: activeSessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  return parsedItems;
};

export const generateSummaryText = (items: StockItem[], activeSessionName?: string): string => {
  const totalItems = items.length;
  const totalSerials = items.reduce((acc, curr) => acc + (curr.serials?.length || 0), 0);
  const dateStr = new Date().toLocaleDateString();

  let text = `⚡ *3D STOCK & EXCEL MANAGER REPORT*\n`;
  text += `📅 Date: ${dateStr}\n`;
  if (activeSessionName) text += `📌 Session: ${activeSessionName}\n`;
  text += `📦 Total Items: ${totalItems} line items\n`;
  text += `🔑 Total Serials: ${totalSerials} scanned/imported serials\n\n`;
  text += `--- *INVENTORY STATUS* ---\n`;

  items.forEach((item, index) => {
    const isTargetReached = (item.serials?.length || 0) >= (item.targetQty || 1);
    const statusFlag = isTargetReached ? '✅ Target Met' : '⚠️ Pending';
    text += `${index + 1}. [${item.code}] *${item.name}* (${item.model}) - Qty: ${item.serials.length} / ${item.targetQty} [${statusFlag}]\n`;
    if (item.serials && item.serials.length > 0) {
      text += `   Serials: ${item.serials.map((s) => `\`${s}\``).join(', ')}\n`;
    }
  });

  return text;
};
