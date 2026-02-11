import { ColumnMapping } from './import';

// Common transformers
const toNumber = (v: any) => {
  if (!v && v !== 0) return 0;
  const str = String(v).trim();
  
  // Check if it's already a plain number without any formatting (e.g., "6633.40" or "18000")
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return parseFloat(str) || 0;
  }
  
  // Detect format: Brazilian uses comma as decimal separator
  // Brazilian: "6.633,40" or "R$ 6.633,40" (dot = thousand, comma = decimal)
  // US/Excel: "6,633.40" (comma = thousand, dot = decimal)
  
  // Remove currency symbols and spaces first
  let cleaned = str.replace(/[R$\s]/g, '');
  
  // Detect if it's Brazilian format (has comma after dots, or ends with comma + digits)
  const hasBrazilianFormat = /\d\.\d{3},\d{2}$/.test(cleaned) || // 1.234,56
                             /^\d{1,3}(,\d{2})$/.test(cleaned) || // 123,45
                             /^\d{1,3}(\.\d{3})+(,\d{2})?$/.test(cleaned); // 1.234 or 1.234.567,89
  
  // Detect US format (has dot after commas, or ends with dot + digits)  
  const hasUSFormat = /\d,\d{3}\.\d{2}$/.test(cleaned) || // 1,234.56
                      /^\d{1,3}(,\d{3})+(\.\d{2})?$/.test(cleaned); // 1,234 or 1,234,567.89
  
  if (hasBrazilianFormat) {
    // Brazilian: remove dots (thousands), replace comma with dot (decimal)
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasUSFormat) {
    // US: just remove commas (thousands)
    cleaned = cleaned.replace(/,/g, '');
  } else {
    // Fallback: check if there's a comma that could be decimal
    // If format is like "1234,56" (no thousand separator), treat comma as decimal
    if (/^\d+,\d{1,2}$/.test(cleaned)) {
      cleaned = cleaned.replace(',', '.');
    } else {
      // Remove any remaining commas/dots that might be thousand separators
      // and keep the last separator as decimal if it has 1-2 digits after
      const lastComma = cleaned.lastIndexOf(',');
      const lastDot = cleaned.lastIndexOf('.');
      
      if (lastComma > lastDot && cleaned.length - lastComma <= 3) {
        // Comma is decimal
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else if (lastDot > lastComma && cleaned.length - lastDot <= 3) {
        // Dot is decimal
        cleaned = cleaned.replace(/,/g, '');
      } else {
        // No clear decimal, remove all separators
        cleaned = cleaned.replace(/[,.]/g, '');
      }
    }
  }
  
  return parseFloat(cleaned) || 0;
};
const toInteger = (v: any) => parseInt(String(v).replace(/\D/g, ''), 10) || 0;

// Specific transformer for month fields (returns YYYY-MM-01 format)
const toMonth = (v: any): string | null => {
  if (v === undefined || v === null || v === '') return null;
  
  const str = String(v).trim();
  if (!str) return null;
  
  // Month name mapping (Portuguese)
  const monthNames: Record<string, string> = {
    'jan': '01', 'janeiro': '01',
    'fev': '02', 'fevereiro': '02',
    'mar': '03', 'março': '03', 'marco': '03',
    'abr': '04', 'abril': '04',
    'mai': '05', 'maio': '05',
    'jun': '06', 'junho': '06',
    'jul': '07', 'julho': '07',
    'ago': '08', 'agosto': '08',
    'set': '09', 'setembro': '09',
    'out': '10', 'outubro': '10',
    'nov': '11', 'novembro': '11',
    'dez': '12', 'dezembro': '12',
  };
  
  // Format: "jan/26" or "jan/2026" or "janeiro/26"
  const monthNameMatch = str.match(/^([a-záéíóúç]+)[\/-](\d{2}|\d{4})$/i);
  if (monthNameMatch) {
    const monthKey = monthNameMatch[1].toLowerCase();
    const month = monthNames[monthKey];
    if (month) {
      let year = parseInt(monthNameMatch[2], 10);
      if (year < 100) year = 2000 + year;
      if (year >= 1900 && year <= 2100) {
        return `${year}-${month}-01`;
      }
    }
  }
  
  // Format: "01/26" or "01/2026" (MM/YY or MM/YYYY)
  const mmYYMatch = str.match(/^(\d{1,2})[\/-](\d{2}|\d{4})$/);
  if (mmYYMatch) {
    const month = parseInt(mmYYMatch[1], 10);
    let year = parseInt(mmYYMatch[2], 10);
    if (year < 100) year = 2000 + year;
    if (month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-01`;
    }
  }
  
  // Format: "2026-01" (YYYY-MM)
  const isoMonthMatch = str.match(/^(\d{4})-(\d{1,2})$/);
  if (isoMonthMatch) {
    const year = parseInt(isoMonthMatch[1], 10);
    const month = parseInt(isoMonthMatch[2], 10);
    if (month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-01`;
    }
  }
  
  // Format: "2026-01-15" (YYYY-MM-DD) - just take the month
  const isoDateMatch = str.match(/^(\d{4})-(\d{1,2})-\d{1,2}$/);
  if (isoDateMatch) {
    const year = parseInt(isoDateMatch[1], 10);
    const month = parseInt(isoDateMatch[2], 10);
    if (month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-01`;
    }
  }
  
  // Format: "26/01/2026" (DD/MM/YYYY) - extract month/year
  const brDateMatch = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (brDateMatch) {
    const month = parseInt(brDateMatch[2], 10);
    const year = parseInt(brDateMatch[3], 10);
    if (month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-01`;
    }
  }
  
  // Excel serial date number (like toDate does)
  if (typeof v === 'number' || /^\d+(\.\d+)?$/.test(str)) {
    const serial = typeof v === 'number' ? v : parseFloat(str);
    if (!Number.isNaN(serial) && serial > 25000 && serial < 100000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const msPerDay = 24 * 60 * 60 * 1000;
      const date = new Date(excelEpoch.getTime() + serial * msPerDay);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      if (year >= 1900 && year <= 2100) {
        return `${year}-${String(month).padStart(2, '0')}-01`;
      }
    }
  }
  
  return null;
};
const toDate = (v: any) => {
  if (v === undefined || v === null || v === '') return null;

  // Helper to validate date is within reasonable range (1900-2100)
  const isValidYear = (year: number) => year >= 1900 && year <= 2100;

  // Excel serial date number (e.g., 45958)
  if (typeof v === 'number' || /^\d+(\.\d+)?$/.test(String(v).trim())) {
    const serial = typeof v === 'number' ? v : parseFloat(String(v).trim());
    if (!Number.isNaN(serial) && serial > 25000 && serial < 100000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const msPerDay = 24 * 60 * 60 * 1000;
      const date = new Date(excelEpoch.getTime() + serial * msPerDay);
      const year = date.getUTCFullYear();
      if (isValidYear(year)) {
        return date.toISOString().split('T')[0];
      }
    }
    // If it's a pure number but not a valid Excel serial, return null
    return null;
  }

  // Date object
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null;
    const year = v.getFullYear();
    if (!isValidYear(year)) return null;
    return v.toISOString().split('T')[0];
  }

  const str = String(v).trim();
  if (!str) return null;

  // Reject strings that are too long (likely not dates)
  if (str.length > 20) return null;

  // Reject strings that look like IDs or random numbers
  if (/^\d{5,}$/.test(str)) return null;

  // Already ISO
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    if (isValidYear(year)) return str;
    return null;
  }

  // Flexible D/M/Y parsing (supports 2 or 4 digit year, / or -)
  const m = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2}|\d{4})$/);
  if (m) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    let y = parseInt(m[3], 10);

    if (y < 100) y = 2000 + y; // 25 -> 2025

    if (!isValidYear(y)) return null;

    // Decide order: default BR (DD/MM), but if clearly MM/DD, swap.
    let day = a;
    let month = b;
    if (a <= 12 && b > 12) {
      // MM/DD
      month = a;
      day = b;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    return null;
  }

  // Fallback: native parsing (last resort) - but validate result
  const date = new Date(str);
  if (isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  if (!isValidYear(year)) return null;
  return date.toISOString().split('T')[0];
};
const toDateTime = (v: any) => {
  if (!v) return null;
  
  // Handle Excel serial date number (e.g., 45958)
  if (typeof v === 'number' || /^\d+(\.\d+)?$/.test(String(v).trim())) {
    const serial = parseFloat(String(v).trim());
    if (serial > 25000 && serial < 100000) {
      // Excel serial date: days since 1899-12-30
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const msPerDay = 24 * 60 * 60 * 1000;
      const date = new Date(excelEpoch.getTime() + serial * msPerDay);
      return date.toISOString();
    }
  }
  
  const str = String(v).trim();
  
  // Handle Brazilian date format DD/MM/YYYY or DD/MM/YYYY HH:MM
  const brDateMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (brDateMatch) {
    const [, day, month, year, hour = '00', minute = '00'] = brDateMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
  }
  
  const date = new Date(v);
  return isNaN(date.getTime()) ? null : date.toISOString();
};
const toString = (v: any) => v ? String(v).trim() : '';

// Contract import config
export const contractImportConfig = {
  mappings: [
    { excelColumn: 'Número', dbColumn: 'number', required: true, transform: toString },
    { excelColumn: 'Cliente', dbColumn: 'client_name', required: true, transform: toString },
    { excelColumn: 'Centro de Custo', dbColumn: 'cost_center', transform: toString },
    { excelColumn: 'Descrição', dbColumn: 'description', transform: toString },
    { excelColumn: 'Valor', dbColumn: 'value', transform: toNumber },
    { excelColumn: 'Data Início', dbColumn: 'start_date', transform: toDate },
    { excelColumn: 'Data Fim', dbColumn: 'end_date', transform: toDate },
    { excelColumn: 'Estado', dbColumn: 'state', transform: toString },
    { excelColumn: 'Cidade', dbColumn: 'city', transform: toString },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => {
      const statusMap: Record<string, string> = {
        'ativo': 'active',
        'inativo': 'inactive',
        'pendente': 'pending',
        'cancelado': 'cancelled',
      };
      const normalized = v?.toLowerCase().trim();
      return statusMap[normalized] || normalized || 'active';
    }},
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'number', label: 'Número' },
    { key: 'client_name', label: 'Cliente' },
    { key: 'cost_center', label: 'Centro de Custo' },
    { key: 'description', label: 'Descrição' },
    { key: 'value', label: 'Valor' },
    { key: 'start_date', label: 'Data Início' },
    { key: 'end_date', label: 'Data Fim' },
    { key: 'state', label: 'Estado' },
    { key: 'city', label: 'Cidade' },
    { key: 'status', label: 'Status' },
  ],
};

// Employee import config
export const employeeImportConfig = {
  mappings: [
    { excelColumn: 'Nome Completo', dbColumn: 'full_name', required: true, transform: toString },
    { excelColumn: 'CPF', dbColumn: 'cpf', transform: toString },
    { excelColumn: 'RG', dbColumn: 'rg', transform: toString },
    { excelColumn: 'Email', dbColumn: 'email', transform: toString },
    { excelColumn: 'Telefone', dbColumn: 'phone', transform: toString },
    { excelColumn: 'Cargo', dbColumn: 'role', transform: toString },
    { excelColumn: 'CTPS', dbColumn: 'ctps', transform: toString },
    { excelColumn: 'Série', dbColumn: 'ctps_serie', transform: toString },
    { excelColumn: 'Salário', dbColumn: 'salary', transform: toNumber },
    { excelColumn: 'Data Admissão', dbColumn: 'admission_date', transform: toDate },
    { excelColumn: 'Data Demissão', dbColumn: 'termination_date', transform: toDate },
    { excelColumn: 'RE', dbColumn: 're', transform: toString },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => {
      const statusMap: Record<string, string> = {
        'ativo': 'active',
        'inativo': 'inactive',
        'férias': 'vacation',
        'ferias': 'vacation',
        'desligado': 'terminated',
      };
      const normalized = v?.toLowerCase().trim();
      return statusMap[normalized] || normalized || 'active';
    }},
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'full_name', label: 'Nome Completo' },
    { key: 'cpf', label: 'CPF' },
    { key: 'rg', label: 'RG' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefone' },
    { key: 'role', label: 'Cargo' },
    { key: 'ctps', label: 'CTPS' },
    { key: 'ctps_serie', label: 'Série' },
    { key: 'salary', label: 'Salário' },
    { key: 'admission_date', label: 'Data Admissão' },
    { key: 'termination_date', label: 'Data Demissão' },
    { key: 're', label: 'RE' },
    { key: 'status', label: 'Status' },
  ],
};

// Equipment import config
export const equipmentImportConfig = {
  mappings: [
    { excelColumn: 'Contrato', dbColumn: 'contract_number', transform: toString }, // Será resolvido para contract_id no import
    { excelColumn: 'Número de Série', dbColumn: 'serial_number', required: true, transform: toString },
    { excelColumn: 'Modelo', dbColumn: 'model', transform: toString },
    { excelColumn: 'Endereço', dbColumn: 'address', transform: toString },
    { excelColumn: 'Sentido', dbColumn: 'direction', transform: toString },
    { excelColumn: 'Qtd Faixas', dbColumn: 'lanes_qty', transform: toInteger },
    { excelColumn: 'Velocidade', dbColumn: 'speed_limit', transform: toString },
    { excelColumn: 'Meio Comunicação', dbColumn: 'communication_type', transform: toString },
    { excelColumn: 'Tipo Energia', dbColumn: 'energy_type', transform: toString },
    { excelColumn: 'Marca', dbColumn: 'brand', transform: toString },
    { excelColumn: 'Tipo', dbColumn: 'type', transform: toString },

    // IMPORTANTE: manter como texto para suportar planilhas "legadas" (com colunas deslocadas)
    // - pode vir como data (DD/MM/YYYY) OU como tipo (CEV/CEC/REV/SAT)
    { excelColumn: 'Início Atividades', dbColumn: 'installation_date', transform: toString },

    // Coordenadas podem vir sem separador decimal (ex: -20462591). Parse/normalização é feito na página.
    { excelColumn: 'Latitude', dbColumn: 'latitude', transform: toString },
    { excelColumn: 'Longitude', dbColumn: 'longitude', transform: toString },

    // Alguns arquivos têm duas colunas "Status"; a segunda costuma virar "Status_1".
    { excelColumn: 'Status_1', dbColumn: 'status_text', transform: toString },
    { excelColumn: 'Status (1)', dbColumn: 'status_text', transform: toString },
    { excelColumn: 'Status 1', dbColumn: 'status_text', transform: toString },

    { excelColumn: 'Status', dbColumn: 'status', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'contract_number', label: 'Contrato' },
    { key: 'serial_number', label: 'Número de Série' },
    { key: 'model', label: 'Modelo' },
    { key: 'address', label: 'Endereço' },
    { key: 'direction', label: 'Sentido' },
    { key: 'lanes_qty', label: 'Qtd Faixas' },
    { key: 'speed_limit', label: 'Velocidade' },
    { key: 'communication_type', label: 'Meio Comunicação' },
    { key: 'energy_type', label: 'Tipo Energia' },
    { key: 'brand', label: 'Marca' },
    { key: 'type', label: 'Tipo' },
    { key: 'installation_date', label: 'Início Atividades' },
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' },
    { key: 'status', label: 'Status' },
  ],
};

// Vehicle import config
export const vehicleImportConfig = {
  mappings: [
    { excelColumn: 'Contrato', dbColumn: 'contract_number', transform: toString }, // Será resolvido para contract_id no import
    { excelColumn: 'Placa', dbColumn: 'plate', required: true, transform: toString },
    { excelColumn: 'Modelo', dbColumn: 'model', transform: toString },
    { excelColumn: 'Marca', dbColumn: 'brand', transform: toString },
    { excelColumn: 'Ano', dbColumn: 'year', transform: toInteger },
    { excelColumn: 'Combustível', dbColumn: 'fuel_type', transform: toString },
    { excelColumn: 'KM Atual', dbColumn: 'current_km', transform: (v: any) => {
      if (!v) return 0;
      // Remove "km" suffix and parse
      const cleaned = String(v).replace(/[^\d.,]/gi, '').replace('.', '').replace(',', '.');
      return parseInt(cleaned, 10) || 0;
    }},
    { excelColumn: 'RENAVAM', dbColumn: 'renavam', transform: toString },
    { excelColumn: 'Chassi', dbColumn: 'chassis', transform: toString },
    { excelColumn: 'Data Disponibilização', dbColumn: 'availability_date', transform: toDate },
    { excelColumn: 'Número Cartão', dbColumn: 'fuel_card', transform: toString },
    { excelColumn: 'Saldo Mensal', dbColumn: 'monthly_balance', transform: toNumber },
    { excelColumn: 'Número TAG', dbColumn: 'tag_number', transform: toString },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => {
      const statusMap: Record<string, string> = {
        'ativo': 'active',
        'inativo': 'inactive',
        'manutenção': 'maintenance',
        'manutencao': 'maintenance',
      };
      const normalized = v?.toLowerCase().trim();
      return statusMap[normalized] || normalized || 'active';
    }},
    { excelColumn: 'Observações', dbColumn: 'notes', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'contract_number', label: 'Contrato' },
    { key: 'plate', label: 'Placa' },
    { key: 'model', label: 'Modelo' },
    { key: 'brand', label: 'Marca' },
    { key: 'year', label: 'Ano' },
    { key: 'fuel_type', label: 'Combustível' },
    { key: 'current_km', label: 'KM Atual' },
    { key: 'renavam', label: 'RENAVAM' },
    { key: 'chassis', label: 'Chassi' },
    { key: 'availability_date', label: 'Data Disponibilização' },
    { key: 'fuel_card', label: 'Número Cartão' },
    { key: 'monthly_balance', label: 'Saldo Mensal' },
    { key: 'tag_number', label: 'Número TAG' },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Observações' },
  ],
};

// Fuel records import config
export const fuelImportConfig = {
  mappings: [
    { excelColumn: 'Veículo', dbColumn: 'vehicle_plate', required: true, transform: toString },
    { excelColumn: 'Data', dbColumn: 'date', required: true, transform: toDate },
    { excelColumn: 'Litros', dbColumn: 'liters', required: true, transform: toNumber },
    { excelColumn: 'Preço/Litro', dbColumn: 'price_per_liter', transform: toNumber },
    { excelColumn: 'Valor Total', dbColumn: 'total_value', transform: toNumber },
    { excelColumn: 'Município', dbColumn: 'municipality', transform: toString },
    { excelColumn: 'Item', dbColumn: 'fuel_type', transform: toString },
    { excelColumn: 'Posto', dbColumn: 'station', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'vehicle_plate', label: 'Veículo' },
    { key: 'date', label: 'Data' },
    { key: 'liters', label: 'Litros' },
    { key: 'price_per_liter', label: 'Preço/Litro' },
    { key: 'total_value', label: 'Valor Total' },
    { key: 'municipality', label: 'Município' },
    { key: 'fuel_type', label: 'Item' },
    { key: 'station', label: 'Posto' },
  ],
};

// Infrastructure import config
export const infrastructureImportConfig = {
  mappings: [
    { excelColumn: 'Número de Série', dbColumn: 'serial_number', required: true, transform: toString },
    { excelColumn: 'Município', dbColumn: 'municipality', required: true, transform: toString },
    { excelColumn: 'Data', dbColumn: 'date', required: true, transform: toDateTime },
    { excelColumn: 'Tipo de Serviço', dbColumn: 'service_type', required: true, transform: toString },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => {
      const statusMap: Record<string, string> = {
        'agendado': 'scheduled',
        'finalizado': 'completed',
        'sem agendamento': 'unscheduled',
        'cancelado': 'cancelled',
      };
      return statusMap[v?.toLowerCase()] || 'scheduled';
    }},
    { excelColumn: 'Observações', dbColumn: 'notes', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'serial_number', label: 'Número de Série' },
    { key: 'municipality', label: 'Município' },
    { key: 'date', label: 'Data' },
    { key: 'service_type', label: 'Tipo de Serviço' },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Observações' },
  ],
};

// Infractions import config
export const infractionImportConfig = {
  mappings: [
    { excelColumn: 'Contrato', dbColumn: 'contract_id', transform: toString },
    // Aceita múltiplas variações de nome de coluna para equipamento - apenas a primeira é obrigatória
    { excelColumn: 'Equipamento', dbColumn: 'equipment_id', required: true, transform: toString },
    { excelColumn: 'Nº Série', dbColumn: 'equipment_id', transform: toString },
    { excelColumn: 'N Série', dbColumn: 'equipment_id', transform: toString },
    { excelColumn: 'Numero de Serie', dbColumn: 'equipment_id', transform: toString },
    { excelColumn: 'Serial', dbColumn: 'equipment_id', transform: toString },
    { excelColumn: 'Mês', dbColumn: 'month', transform: (v: any) => {
      if (!v) return null;
      // Se for número (1-12), converte para nome do mês
      const monthNum = parseInt(String(v), 10);
      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                           'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return monthNames[monthNum - 1];
      }
      return String(v).trim();
    }},
    { excelColumn: 'Ano', dbColumn: 'year', transform: toInteger },
    { excelColumn: 'Faixa Datacheck', dbColumn: 'datacheck_lane', transform: toString },
    { excelColumn: 'Faixa Física', dbColumn: 'physical_lane', transform: toString },
    { excelColumn: 'Qtd Imagens', dbColumn: 'image_count', transform: toInteger },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'contract_id', label: 'Contrato' },
    { key: 'equipment_id', label: 'Equipamento' },
    { key: 'month', label: 'Mês' },
    { key: 'year', label: 'Ano' },
    { key: 'datacheck_lane', label: 'Faixa Datacheck' },
    { key: 'physical_lane', label: 'Faixa Física' },
    { key: 'image_count', label: 'Qtd Imagens' },
  ],
};

// Inventory import config
export const inventoryImportConfig = {
  mappings: [
    { excelColumn: 'Componente', dbColumn: 'component_name', required: true, transform: toString },
    { excelColumn: 'SKU', dbColumn: 'sku', transform: toString },
    { excelColumn: 'Categoria', dbColumn: 'category', transform: toString },
    { excelColumn: 'Quantidade', dbColumn: 'quantity', transform: toInteger },
    { excelColumn: 'Quantidade Mínima', dbColumn: 'min_quantity', transform: toInteger },
    { excelColumn: 'Preço Unitário', dbColumn: 'unit_price', transform: toNumber },
    { excelColumn: 'Localização', dbColumn: 'location', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'component_name', label: 'Componente' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Categoria' },
    { key: 'quantity', label: 'Quantidade' },
    { key: 'min_quantity', label: 'Quantidade Mínima' },
    { key: 'unit_price', label: 'Preço Unitário' },
    { key: 'location', label: 'Localização' },
  ],
};

// Toll tags import config
export const tollImportConfig = {
  mappings: [
    { excelColumn: 'Contrato', dbColumn: 'contract_id', transform: toString },
    { excelColumn: 'Placa', dbColumn: 'vehicle_id', required: true, transform: toString },
    { excelColumn: 'Data Passagem', dbColumn: 'passage_date', required: true, transform: toDateTime },
    { excelColumn: 'Valor', dbColumn: 'value', required: true, transform: toNumber },
    { excelColumn: 'Número Tag', dbColumn: 'tag_number', required: true, transform: toString },
    { excelColumn: 'Praça', dbColumn: 'toll_plaza', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'contract_id', label: 'Contrato' },
    { key: 'vehicle_id', label: 'Placa' },
    { key: 'passage_date', label: 'Data Passagem' },
    { key: 'value', label: 'Valor' },
    { key: 'tag_number', label: 'Número Tag' },
    { key: 'toll_plaza', label: 'Praça' },
  ],
};

// Energy consumer units import config
export const energyConsumerUnitImportConfig = {
  mappings: [
    { excelColumn: 'Unidade Consumidora', dbColumn: 'consumer_unit', required: true, transform: toString },
    { excelColumn: 'Fornecedor', dbColumn: 'supplier_name', transform: toString },
    { excelColumn: 'Contrato', dbColumn: 'contract_ref', transform: toString },
    { excelColumn: 'Serial Equipamento', dbColumn: 'equipment_serial', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'consumer_unit', label: 'Unidade Consumidora' },
    { key: 'supplier_name', label: 'Fornecedor' },
    { key: 'contract_ref', label: 'Contrato' },
    { key: 'equipment_serial', label: 'Serial Equipamento' },
  ],
};

// Energy bills import config
export const energyImportConfig = {
  mappings: [
    { excelColumn: 'Unidade Consumidora', dbColumn: 'consumer_unit', required: true, transform: toString },
    { excelColumn: 'Mês Referência', dbColumn: 'reference_month', required: true, transform: toMonth },
    { excelColumn: 'Valor', dbColumn: 'value', transform: toNumber },
    { excelColumn: 'Vencimento', dbColumn: 'due_date', transform: toDate },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => {
      const statusMap: Record<string, string> = {
        'enviada': 'sent',
        'pendente': 'pending',
        'zerada': 'zeroed',
        'sent': 'sent',
        'pending': 'pending',
        'zeroed': 'zeroed',
      };
      const normalized = v?.toLowerCase().trim();
      return statusMap[normalized] || 'pending';
    }},
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'consumer_unit', label: 'Unidade Consumidora' },
    { key: 'reference_month', label: 'Mês Referência' },
    { key: 'value', label: 'Valor' },
    { key: 'due_date', label: 'Vencimento' },
    { key: 'status', label: 'Status' },
  ],
};

// Internet providers import config
export const internetProviderImportConfig = {
  mappings: [
    { excelColumn: 'Provedor', dbColumn: 'name', required: true, transform: toString },
    { excelColumn: 'Endereço', dbColumn: 'address', transform: toString },
    { excelColumn: 'Município', dbColumn: 'city', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'name', label: 'Provedor' },
    { key: 'address', label: 'Endereço' },
    { key: 'city', label: 'Município' },
  ],
};

// Internet connections import config
export const internetConnectionImportConfig = {
  mappings: [
    { excelColumn: 'Contrato', dbColumn: 'contract_ref', transform: toString },
    { excelColumn: 'Número de Série', dbColumn: 'serial_number', required: true, transform: toString },
    { excelColumn: 'Provedor', dbColumn: 'provider_name', transform: toString },
    { excelColumn: 'Código do Cliente', dbColumn: 'client_code', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'contract_ref', label: 'Contrato' },
    { key: 'serial_number', label: 'Número de Série' },
    { key: 'provider_name', label: 'Provedor' },
    { key: 'client_code', label: 'Código do Cliente' },
  ],
};

// Internet bills import config
export const internetImportConfig = {
  mappings: [
    { excelColumn: 'Provedor', dbColumn: 'provider', required: true, transform: toString },
    { excelColumn: 'Mês Referência', dbColumn: 'reference_month', required: true, transform: toMonth },
    { excelColumn: 'Valor', dbColumn: 'value', transform: toNumber },
    { excelColumn: 'Vencimento', dbColumn: 'due_date', transform: toDate },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => v?.toLowerCase() || 'pending' },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'provider', label: 'Provedor' },
    { key: 'reference_month', label: 'Mês Referência' },
    { key: 'value', label: 'Valor' },
    { key: 'due_date', label: 'Vencimento' },
    { key: 'status', label: 'Status' },
  ],
};

// Advances import config
export const advanceImportConfig = {
  mappings: [
    { excelColumn: 'Contrato', dbColumn: 'contract_ref', transform: toString },
    { excelColumn: 'Colaborador', dbColumn: 'employee_name', required: true, transform: toString },
    { excelColumn: 'Intranet', dbColumn: 'intranet', transform: toString },
    { excelColumn: 'Data Solicitação', dbColumn: 'request_date', required: true, transform: toDate },
    { excelColumn: 'Valor Solicitado', dbColumn: 'requested_value', required: true, transform: toNumber },
    { excelColumn: 'Motivo', dbColumn: 'reason', transform: toString },
    { excelColumn: 'Data Fechamento', dbColumn: 'closing_date', transform: toDate },
    { excelColumn: 'Valor Comprovado', dbColumn: 'proven_value', transform: toNumber },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => {
      const statusMap: Record<string, string> = {
        'pendente': 'Pendente',
        'fechado': 'Fechado',
        'cancelado': 'Cancelado',
      };
      const normalized = v?.toLowerCase().trim();
      return statusMap[normalized] || 'Pendente';
    }},
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'contract_ref', label: 'Contrato' },
    { key: 'employee_name', label: 'Colaborador' },
    { key: 'intranet', label: 'Intranet' },
    { key: 'request_date', label: 'Data Solicitação' },
    { key: 'requested_value', label: 'Valor Solicitado' },
    { key: 'reason', label: 'Motivo' },
    { key: 'closing_date', label: 'Data Fechamento' },
    { key: 'proven_value', label: 'Valor Comprovado' },
    { key: 'status', label: 'Status' },
  ],
};

// Calibrations import config
export const calibrationImportConfig = {
  mappings: [
    { excelColumn: 'Contrato', dbColumn: 'contract_ref', required: true, transform: toString },
    { excelColumn: 'Serial Equipamento', dbColumn: 'equipment_serial', required: true, transform: toString },
    { excelColumn: 'Data Aferição', dbColumn: 'calibration_date', required: true, transform: toDate },
    { excelColumn: 'Data Vencimento', dbColumn: 'expiration_date', transform: toDate },
    { excelColumn: 'Número Certificado', dbColumn: 'certificate_number', transform: toString },
    { excelColumn: 'Número INMETRO', dbColumn: 'inmetro_number', transform: toString },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => {
      const statusMap: Record<string, string> = {
        'válido': 'valid',
        'valido': 'valid',
        'válida': 'valid',
        'valida': 'valid',
        'vencido': 'expired',
        'vencida': 'expired',
        'pendente': 'pending',
        'valid': 'valid',
        'expired': 'expired',
        'pending': 'pending',
      };
      const normalized = v?.toLowerCase().trim();
      return statusMap[normalized] || 'valid';
    }},
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'contract_ref', label: 'Contrato' },
    { key: 'equipment_serial', label: 'Serial Equipamento' },
    { key: 'calibration_date', label: 'Data Aferição' },
    { key: 'expiration_date', label: 'Data Vencimento (opcional)' },
    { key: 'certificate_number', label: 'Número Certificado' },
    { key: 'inmetro_number', label: 'Número INMETRO' },
    { key: 'status', label: 'Status' },
  ],
};

// Maintenance import config
export const maintenanceImportConfig = {
  mappings: [
    { excelColumn: 'Data', dbColumn: 'date', required: true, transform: toDate },
    { excelColumn: 'Tipo', dbColumn: 'type', required: true, transform: toString },
    { excelColumn: 'Descrição', dbColumn: 'description', transform: toString },
    { excelColumn: 'Custo', dbColumn: 'cost', transform: toNumber },
    { excelColumn: 'Odômetro', dbColumn: 'odometer', transform: toInteger },
    { excelColumn: 'Oficina', dbColumn: 'workshop', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'date', label: 'Data' },
    { key: 'type', label: 'Tipo' },
    { key: 'description', label: 'Descrição' },
    { key: 'cost', label: 'Custo' },
    { key: 'odometer', label: 'Odômetro' },
    { key: 'workshop', label: 'Oficina' },
  ],
};

// Invoices import config
export const invoiceImportConfig = {
  mappings: [
    { excelColumn: 'Número', dbColumn: 'number', required: true, transform: toString },
    { excelColumn: 'Data Emissão', dbColumn: 'issue_date', required: true, transform: toDate },
    { excelColumn: 'Valor', dbColumn: 'value', required: true, transform: toNumber },
    { excelColumn: 'Vencimento', dbColumn: 'due_date', transform: toDate },
    { excelColumn: 'Desconto', dbColumn: 'discount', transform: toNumber },
    { excelColumn: 'Data Pagamento', dbColumn: 'payment_date', transform: toDate },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => v?.toLowerCase() || 'pending' },
    { excelColumn: 'Observações', dbColumn: 'notes', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'number', label: 'Número' },
    { key: 'issue_date', label: 'Data Emissão' },
    { key: 'value', label: 'Valor' },
    { key: 'due_date', label: 'Vencimento' },
    { key: 'discount', label: 'Desconto' },
    { key: 'payment_date', label: 'Data Pagamento' },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Observações' },
  ],
};

// Mileage import config
export const mileageImportConfig = {
  mappings: [
    { excelColumn: 'Data', dbColumn: 'date', required: true, transform: toDate },
    { excelColumn: 'KM Inicial', dbColumn: 'initial_km', required: true, transform: toInteger },
    { excelColumn: 'KM Final', dbColumn: 'final_km', required: true, transform: toInteger },
    { excelColumn: 'Observações', dbColumn: 'notes', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'date', label: 'Data' },
    { key: 'initial_km', label: 'KM Inicial' },
    { key: 'final_km', label: 'KM Final' },
    { key: 'notes', label: 'Observações' },
  ],
};

// Service calls import config
export const serviceCallImportConfig = {
  mappings: [
    { excelColumn: 'Contrato', dbColumn: 'contract_ref', transform: toString },
    { excelColumn: 'Contrato Terceiros', dbColumn: 'third_party_contract', transform: toString },
    { excelColumn: 'Equipamento', dbColumn: 'equipment_serial', transform: toString },
    { excelColumn: 'Serial', dbColumn: 'equipment_serial', transform: toString },
    { excelColumn: 'Nº Série', dbColumn: 'equipment_serial', transform: toString },
    { excelColumn: 'Data', dbColumn: 'date', required: true, transform: toDate },
    { excelColumn: 'Colaborador', dbColumn: 'employee_name', transform: toString },
    { excelColumn: 'Cód. Mob', dbColumn: 'mob_code', transform: toString },
    { excelColumn: 'Cod. Mob', dbColumn: 'mob_code', transform: toString },
    { excelColumn: 'Código Mob', dbColumn: 'mob_code', transform: toString },
    { excelColumn: 'Tipo', dbColumn: 'type', transform: toString },
    { excelColumn: 'Descrição', dbColumn: 'description', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'contract_ref', label: 'Contrato' },
    { key: 'third_party_contract', label: 'Contrato Terceiros' },
    { key: 'equipment_serial', label: 'Equipamento' },
    { key: 'date', label: 'Data' },
    { key: 'employee_name', label: 'Colaborador' },
    { key: 'mob_code', label: 'Cód. Mob' },
    { key: 'type', label: 'Tipo' },
    { key: 'description', label: 'Descrição' },
  ],
};

// Seals import config
export const sealImportConfig = {
  mappings: [
    { excelColumn: 'Número Lacre', dbColumn: 'seal_number', required: true, transform: toString },
    { excelColumn: 'Tipo Lacre', dbColumn: 'seal_type', transform: toString },
    { excelColumn: 'Data Recebimento', dbColumn: 'received_date', required: true, transform: toDate },
    { excelColumn: 'Memorando', dbColumn: 'memo_number', transform: toString },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => v?.toLowerCase() || 'available' },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'seal_number', label: 'Número Lacre' },
    { key: 'seal_type', label: 'Tipo Lacre' },
    { key: 'received_date', label: 'Data Recebimento' },
    { key: 'memo_number', label: 'Memorando' },
    { key: 'status', label: 'Status' },
  ],
};

// Issues import config
export const issueImportConfig = {
  mappings: [
    { excelColumn: 'Título', dbColumn: 'title', required: true, transform: toString },
    { excelColumn: 'Descrição', dbColumn: 'description', transform: toString },
    { excelColumn: 'Prioridade', dbColumn: 'priority', transform: (v: string) => v?.toLowerCase() || 'medium' },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => v?.toLowerCase() || 'open' },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'title', label: 'Título' },
    { key: 'description', label: 'Descrição' },
    { key: 'priority', label: 'Prioridade' },
    { key: 'status', label: 'Status' },
  ],
};

// Image metrics import config
export const imageMetricImportConfig = {
  mappings: [
    { excelColumn: 'Data', dbColumn: 'date', required: true, transform: toDate },
    { excelColumn: 'Total Capturas', dbColumn: 'total_captures', transform: toInteger },
    { excelColumn: 'Capturas Válidas', dbColumn: 'valid_captures', transform: toInteger },
    { excelColumn: 'Taxa Aproveitamento', dbColumn: 'utilization_rate', transform: toNumber },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'date', label: 'Data' },
    { key: 'total_captures', label: 'Total Capturas' },
    { key: 'valid_captures', label: 'Capturas Válidas' },
    { key: 'utilization_rate', label: 'Taxa Aproveitamento' },
  ],
};

// Satisfaction import config
export const satisfactionImportConfig = {
  mappings: [
    { excelColumn: 'Contrato', dbColumn: 'contract_id', required: true, transform: toString },
    {
      excelColumn: 'Trimestre',
      dbColumn: 'quarter',
      required: true,
      transform: (v: any) => {
        const s = toString(v).toLowerCase();
        if (s.startsWith('q1') || s.includes('1')) return 'Q1';
        if (s.startsWith('q2') || s.includes('2')) return 'Q2';
        if (s.startsWith('q3') || s.includes('3')) return 'Q3';
        if (s.startsWith('q4') || s.includes('4')) return 'Q4';
        return toString(v);
      },
    },
    { excelColumn: 'Ano', dbColumn: 'year', required: true, transform: toInteger },
    { excelColumn: 'Nota', dbColumn: 'score', transform: toNumber },
    { excelColumn: 'Feedback', dbColumn: 'feedback', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'contract_id', label: 'Contrato' },
    { key: 'quarter', label: 'Trimestre' },
    { key: 'year', label: 'Ano' },
    { key: 'score', label: 'Nota' },
    { key: 'feedback', label: 'Feedback' },
  ],
};

// SLA import config
export const slaImportConfig = {
  mappings: [
    { excelColumn: 'Mês', dbColumn: 'month', required: true, transform: toDate },
    { excelColumn: 'Disponibilidade', dbColumn: 'availability', transform: toNumber },
    { excelColumn: 'Tempo Resposta', dbColumn: 'response_time', transform: toNumber },
    { excelColumn: 'Tempo Resolução', dbColumn: 'resolution_time', transform: toNumber },
    { excelColumn: 'Meta Atingida', dbColumn: 'target_met', transform: (v: any) => v === 'Sim' || v === true || v === 1 },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'month', label: 'Mês' },
    { key: 'availability', label: 'Disponibilidade' },
    { key: 'response_time', label: 'Tempo Resposta' },
    { key: 'resolution_time', label: 'Tempo Resolução' },
    { key: 'target_met', label: 'Meta Atingida' },
  ],
};

// Goals import config
export const goalImportConfig = {
  mappings: [
    { excelColumn: 'Mês', dbColumn: 'month', required: true, transform: toDate },
    { excelColumn: 'Meta Atendimentos', dbColumn: 'target_calls', transform: toInteger },
    { excelColumn: 'Atendimentos Realizados', dbColumn: 'completed_calls', transform: toInteger },
    { excelColumn: 'Percentual', dbColumn: 'percentage', transform: toNumber },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'month', label: 'Mês' },
    { key: 'target_calls', label: 'Meta Atendimentos' },
    { key: 'completed_calls', label: 'Atendimentos Realizados' },
    { key: 'percentage', label: 'Percentual' },
  ],
};

// Phone Lines import config
export const phoneLineImportConfig = {
  mappings: [
    { excelColumn: 'Contrato', dbColumn: 'contract_ref', required: true, transform: toString },
    { excelColumn: 'Serial Equipamento', dbColumn: 'equipment_serial', required: true, transform: toString },
    { excelColumn: 'Número Linha', dbColumn: 'line_number', required: true, transform: toString },
    { excelColumn: 'Operadora', dbColumn: 'carrier', required: true, transform: toString },
    { excelColumn: 'Sub Operadora', dbColumn: 'sub_carrier', transform: toString },
    // Aceita tanto "Status" quanto "Status (Ativa/Inativa)" (planilhas legadas)
    { excelColumn: 'Status (Ativa/Inativa)', dbColumn: 'status', transform: (v: string) => {
      const lower = v?.toLowerCase()?.trim();
      if (lower === 'ativa' || lower === 'active') return 'active';
      if (lower === 'inativa' || lower === 'inactive') return 'inactive';
      return 'active';
    }},
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => {
      const lower = v?.toLowerCase()?.trim();
      if (lower === 'ativa' || lower === 'active') return 'active';
      if (lower === 'inativa' || lower === 'inactive') return 'inactive';
      return 'active';
    }},
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'contract_ref', label: 'Contrato' },
    { key: 'equipment_serial', label: 'Serial Equipamento' },
    { key: 'line_number', label: 'Número Linha' },
    { key: 'carrier', label: 'Operadora' },
    { key: 'sub_carrier', label: 'Sub Operadora' },
    { key: 'status', label: 'Status (Ativa/Inativa)' },
  ],
};

// Component import config
export const componentImportConfig = {
  mappings: [
    { excelColumn: 'Código', dbColumn: 'code', transform: toString },
    { excelColumn: 'Descrição', dbColumn: 'name', required: true, transform: toString },
    { excelColumn: 'Tipo', dbColumn: 'type', transform: toString },
    { excelColumn: 'Valor', dbColumn: 'value', transform: toNumber },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'code', label: 'Código' },
    { key: 'name', label: 'Descrição' },
    { key: 'type', label: 'Tipo' },
    { key: 'value', label: 'Valor' },
  ],
};

// Chip numbers import config
export const chipNumberImportConfig = {
  mappings: [
    { excelColumn: 'Numero Linha', dbColumn: 'line_number', required: true, transform: (v: any) => String(v).trim() },
    { excelColumn: 'ICCID', dbColumn: 'iccid', required: false, transform: (v: any) => v ? String(v).trim() : null },
    { excelColumn: 'Operadora', dbColumn: 'carrier', required: true, transform: (v: string) => {
      const carrierMap: Record<string, string> = {
        'vivo': 'Vivo',
        'oi': 'Oi',
        'tim': 'TIM',
        'claro': 'Claro',
        'datatem': 'DATATEM',
      };
      const normalized = v?.toLowerCase().trim();
      return carrierMap[normalized] || v?.trim() || '';
    }},
    { excelColumn: 'Sub Operadora', dbColumn: 'sub_carrier', required: false, transform: (v: any) => v ? String(v).trim() : null },
    { excelColumn: 'Status', dbColumn: 'status', required: false, transform: (v: any) => {
      const statusMap: Record<string, string> = { 'ativo': 'Ativo', 'inativo': 'Inativo', 'suspenso': 'Suspenso', 'sobressalente': 'Sobressalente' };
      const normalized = v?.toLowerCase?.().trim();
      return statusMap[normalized] || 'Ativo';
    }},
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'line_number', label: 'Numero Linha' },
    { key: 'iccid', label: 'ICCID' },
    { key: 'carrier', label: 'Operadora' },
    { key: 'sub_carrier', label: 'Sub Operadora' },
    { key: 'status', label: 'Status' },
  ],
};
