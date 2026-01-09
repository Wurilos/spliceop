import * as XLSX from 'xlsx';

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

export interface ColumnMapping {
  excelColumn: string;
  dbColumn: string;
  required?: boolean;
  transform?: (value: any) => any;
}

/**
 * Parse an Excel file and return raw data
 */
export function parseExcelFile(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: false,
          dateNF: 'yyyy-mm-dd'
        });
        resolve(jsonData as Record<string, any>[]);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo Excel'));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Map Excel data to database format using column mappings
 */
export function mapExcelData<T>(
  rawData: Record<string, any>[],
  mappings: ColumnMapping[]
): ImportResult<T> {
  const errors: string[] = [];
  const data: T[] = [];

  const normalizeHeader = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .trim()
      .replace(/:$/, '')
      .replace(/\s+/g, ' ')
      .toLowerCase();

  const getCellValue = (row: Record<string, any>, excelColumn: string) => {
    // Fast path: exact match
    if (Object.prototype.hasOwnProperty.call(row, excelColumn)) return row[excelColumn];

    // Fallback: normalized match (handles "Contrato" vs "Contrato:", accents, spacing)
    const expected = normalizeHeader(excelColumn);
    const foundKey = Object.keys(row).find((k) => normalizeHeader(k) === expected);
    return foundKey ? row[foundKey] : undefined;
  };

  rawData.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because Excel is 1-indexed and has header row
    const mappedRow: Record<string, any> = {};
    let isValid = true;

    for (const mapping of mappings) {
      const value = getCellValue(row, mapping.excelColumn);

      // Check required fields
      if (mapping.required && (value === undefined || value === null || value === '')) {
        errors.push(`Linha ${rowNumber}: Campo "${mapping.excelColumn}" é obrigatório`);
        isValid = false;
        continue;
      }

      // Apply transformation if provided
      if (value !== undefined && value !== null && value !== '') {
        try {
          mappedRow[mapping.dbColumn] = mapping.transform ? mapping.transform(value) : value;
        } catch {
          errors.push(`Linha ${rowNumber}: Erro ao processar campo "${mapping.excelColumn}"`);
          isValid = false;
        }
      } else if (!mapping.required) {
        mappedRow[mapping.dbColumn] = null;
      }
    }

    if (isValid) {
      data.push(mappedRow as T);
    }
  });

  return {
    success: errors.length === 0,
    data,
    errors,
    totalRows: rawData.length,
    validRows: data.length,
  };
}

/**
 * Get Excel column headers from file
 */
export async function getExcelHeaders(file: File): Promise<string[]> {
  const data = await parseExcelFile(file);
  if (data.length === 0) return [];
  return Object.keys(data[0]);
}

/**
 * Generate a template Excel file for a module
 */
export function generateTemplate(columns: { key: string; label: string }[], filename: string) {
  const ws = XLSX.utils.json_to_sheet([
    columns.reduce((acc, col) => ({ ...acc, [col.label]: '' }), {}),
  ]);
  
  // Set column widths
  ws['!cols'] = columns.map(() => ({ wch: 20 }));
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, `${filename}_template.xlsx`);
}
