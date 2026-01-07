import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: string; label: string }[],
  title: string
) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

  // Table header
  let y = 40;
  const colWidth = (doc.internal.pageSize.width - 28) / columns.length;
  
  doc.setFillColor(41, 128, 185);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  
  columns.forEach((col, i) => {
    doc.rect(14 + i * colWidth, y, colWidth, 8, 'F');
    doc.text(col.label, 16 + i * colWidth, y + 5.5);
  });

  // Table rows
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  y += 10;

  data.forEach((row, rowIndex) => {
    if (y > doc.internal.pageSize.height - 20) {
      doc.addPage();
      y = 20;
    }

    const bgColor = rowIndex % 2 === 0 ? 245 : 255;
    doc.setFillColor(bgColor, bgColor, bgColor);

    columns.forEach((col, i) => {
      doc.rect(14 + i * colWidth, y - 4, colWidth, 8, 'F');
      const value = getNestedValue(row, col.key);
      const text = formatValue(value).substring(0, 20);
      doc.text(text, 16 + i * colWidth, y + 1);
    });

    y += 8;
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: string; label: string }[],
  title: string
) {
  const worksheetData = data.map((row) => {
    const rowData: Record<string, unknown> = {};
    columns.forEach((col) => {
      rowData[col.label] = getNestedValue(row, col.key);
    });
    return rowData;
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title.substring(0, 31));

  // Auto-size columns
  const maxWidths = columns.map((col) => {
    const headerWidth = col.label.length;
    const maxDataWidth = Math.max(
      ...data.map((row) => String(getNestedValue(row, col.key)).length)
    );
    return Math.min(Math.max(headerWidth, maxDataWidth) + 2, 50);
  });

  worksheet['!cols'] = maxWidths.map((w) => ({ wch: w }));

  XLSX.writeFile(workbook, `${title.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: string; label: string }[],
  title: string
) {
  const headers = columns.map((col) => col.label).join(';');
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = formatValue(getNestedValue(row, col.key));
      return `"${value.replace(/"/g, '""')}"`;
    }).join(';')
  );

  const csv = [headers, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.csv`;
  link.click();
  
  URL.revokeObjectURL(url);
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (value instanceof Date) return value.toLocaleDateString('pt-BR');
  return String(value);
}
