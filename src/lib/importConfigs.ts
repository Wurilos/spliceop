import { ColumnMapping } from './import';

// Common transformers
const toNumber = (v: any) => {
  if (!v && v !== 0) return 0;
  const str = String(v).trim();
  
  // Check if it's already a plain number (no formatting)
  if (/^-?\d+\.?\d*$/.test(str)) {
    return parseFloat(str) || 0;
  }
  
  // Handle Brazilian currency format (R$ 23.000,00)
  const cleaned = str
    .replace(/[R$\s]/g, '')  // Remove R$, spaces
    .replace(/\./g, '')       // Remove thousand separators (dots)
    .replace(',', '.');       // Convert decimal comma to dot
  return parseFloat(cleaned) || 0;
};
const toInteger = (v: any) => parseInt(String(v).replace(/\D/g, ''), 10) || 0;
const toDate = (v: any) => {
  if (!v) return null;
  const str = String(v).trim();
  
  // Handle Brazilian date format DD/MM/YYYY
  const brDateMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brDateMatch) {
    const [, day, month, year] = brDateMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try standard Date parsing
  const date = new Date(v);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
};
const toDateTime = (v: any) => {
  if (!v) return null;
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
    { excelColumn: 'Odômetro', dbColumn: 'odometer', transform: toInteger },
    { excelColumn: 'Tipo Combustível', dbColumn: 'fuel_type', transform: toString },
    { excelColumn: 'Posto', dbColumn: 'station', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'vehicle_plate', label: 'Veículo' },
    { key: 'date', label: 'Data' },
    { key: 'liters', label: 'Litros' },
    { key: 'price_per_liter', label: 'Preço/Litro' },
    { key: 'total_value', label: 'Valor Total' },
    { key: 'odometer', label: 'Odômetro' },
    { key: 'fuel_type', label: 'Tipo Combustível' },
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
    { excelColumn: 'Data/Hora', dbColumn: 'date', transform: toDateTime },
    { excelColumn: 'Mês', dbColumn: 'month', transform: toString },
    { excelColumn: 'Ano', dbColumn: 'year', transform: toInteger },
    { excelColumn: 'Faixa Datacheck', dbColumn: 'datacheck_lane', transform: toString },
    { excelColumn: 'Faixa Física', dbColumn: 'physical_lane', transform: toString },
    { excelColumn: 'Qtd Imagens', dbColumn: 'image_count', transform: toInteger },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'date', label: 'Data/Hora' },
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

// Energy bills import config
export const energyImportConfig = {
  mappings: [
    { excelColumn: 'Unidade Consumidora', dbColumn: 'consumer_unit', required: true, transform: toString },
    { excelColumn: 'Mês Referência', dbColumn: 'reference_month', required: true, transform: toDate },
    { excelColumn: 'Consumo kWh', dbColumn: 'consumption_kwh', transform: toNumber },
    { excelColumn: 'Valor', dbColumn: 'value', transform: toNumber },
    { excelColumn: 'Vencimento', dbColumn: 'due_date', transform: toDate },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => v?.toLowerCase() || 'pending' },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'consumer_unit', label: 'Unidade Consumidora' },
    { key: 'reference_month', label: 'Mês Referência' },
    { key: 'consumption_kwh', label: 'Consumo kWh' },
    { key: 'value', label: 'Valor' },
    { key: 'due_date', label: 'Vencimento' },
    { key: 'status', label: 'Status' },
  ],
};

// Internet bills import config
export const internetImportConfig = {
  mappings: [
    { excelColumn: 'Provedor', dbColumn: 'provider', required: true, transform: toString },
    { excelColumn: 'Mês Referência', dbColumn: 'reference_month', required: true, transform: toDate },
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
    { excelColumn: 'Data', dbColumn: 'date', required: true, transform: toDate },
    { excelColumn: 'Valor', dbColumn: 'value', required: true, transform: toNumber },
    { excelColumn: 'Motivo', dbColumn: 'reason', transform: toString },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => v?.toLowerCase() || 'pending' },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'date', label: 'Data' },
    { key: 'value', label: 'Valor' },
    { key: 'reason', label: 'Motivo' },
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
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => v?.toLowerCase() || 'valid' },
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
    { excelColumn: 'Data', dbColumn: 'date', required: true, transform: toDate },
    { excelColumn: 'Tipo', dbColumn: 'type', transform: toString },
    { excelColumn: 'Descrição', dbColumn: 'description', transform: toString },
    { excelColumn: 'Resolução', dbColumn: 'resolution', transform: toString },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => v?.toLowerCase() || 'open' },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'date', label: 'Data' },
    { key: 'type', label: 'Tipo' },
    { key: 'description', label: 'Descrição' },
    { key: 'resolution', label: 'Resolução' },
    { key: 'status', label: 'Status' },
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
    { excelColumn: 'Trimestre', dbColumn: 'quarter', required: true, transform: toString },
    { excelColumn: 'Ano', dbColumn: 'year', required: true, transform: toInteger },
    { excelColumn: 'Nota', dbColumn: 'score', transform: toNumber },
    { excelColumn: 'Feedback', dbColumn: 'feedback', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
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
