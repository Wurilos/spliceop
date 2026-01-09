import { ColumnMapping } from './import';

// Common transformers
const toNumber = (v: any) => parseFloat(String(v).replace(',', '.')) || 0;
const toInteger = (v: any) => parseInt(String(v), 10) || 0;
const toDate = (v: any) => {
  if (!v) return null;
  const date = new Date(v);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
};
const toDateTime = (v: any) => {
  if (!v) return null;
  const date = new Date(v);
  return isNaN(date.getTime()) ? null : date.toISOString();
};
const toString = (v: any) => String(v).trim();

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
    { excelColumn: 'Departamento', dbColumn: 'department', transform: toString },
    { excelColumn: 'Endereço', dbColumn: 'address', transform: toString },
    { excelColumn: 'Cidade', dbColumn: 'city', transform: toString },
    { excelColumn: 'Estado', dbColumn: 'state', transform: toString },
    { excelColumn: 'Data Admissão', dbColumn: 'admission_date', transform: toDate },
    { excelColumn: 'Salário', dbColumn: 'salary', transform: toNumber },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => v?.toLowerCase() || 'active' },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'full_name', label: 'Nome Completo' },
    { key: 'cpf', label: 'CPF' },
    { key: 'rg', label: 'RG' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefone' },
    { key: 'role', label: 'Cargo' },
    { key: 'department', label: 'Departamento' },
    { key: 'address', label: 'Endereço' },
    { key: 'city', label: 'Cidade' },
    { key: 'state', label: 'Estado' },
    { key: 'admission_date', label: 'Data Admissão' },
    { key: 'salary', label: 'Salário' },
    { key: 'status', label: 'Status' },
  ],
};

// Equipment import config
export const equipmentImportConfig = {
  mappings: [
    { excelColumn: 'Número de Série', dbColumn: 'serial_number', required: true, transform: toString },
    { excelColumn: 'Tipo', dbColumn: 'type', transform: toString },
    { excelColumn: 'Marca', dbColumn: 'brand', transform: toString },
    { excelColumn: 'Modelo', dbColumn: 'model', transform: toString },
    { excelColumn: 'Endereço', dbColumn: 'address', transform: toString },
    { excelColumn: 'Latitude', dbColumn: 'latitude', transform: toNumber },
    { excelColumn: 'Longitude', dbColumn: 'longitude', transform: toNumber },
    { excelColumn: 'Data Instalação', dbColumn: 'installation_date', transform: toDate },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => v?.toLowerCase() || 'active' },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'serial_number', label: 'Número de Série' },
    { key: 'type', label: 'Tipo' },
    { key: 'brand', label: 'Marca' },
    { key: 'model', label: 'Modelo' },
    { key: 'address', label: 'Endereço' },
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' },
    { key: 'installation_date', label: 'Data Instalação' },
    { key: 'status', label: 'Status' },
  ],
};

// Vehicle import config
export const vehicleImportConfig = {
  mappings: [
    { excelColumn: 'Placa', dbColumn: 'plate', required: true, transform: toString },
    { excelColumn: 'Marca', dbColumn: 'brand', transform: toString },
    { excelColumn: 'Modelo', dbColumn: 'model', transform: toString },
    { excelColumn: 'Ano', dbColumn: 'year', transform: toInteger },
    { excelColumn: 'Cor', dbColumn: 'color', transform: toString },
    { excelColumn: 'Renavam', dbColumn: 'renavam', transform: toString },
    { excelColumn: 'Chassi', dbColumn: 'chassis', transform: toString },
    { excelColumn: 'Cartão Combustível', dbColumn: 'fuel_card', transform: toString },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => v?.toLowerCase() || 'active' },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'plate', label: 'Placa' },
    { key: 'brand', label: 'Marca' },
    { key: 'model', label: 'Modelo' },
    { key: 'year', label: 'Ano' },
    { key: 'color', label: 'Cor' },
    { key: 'renavam', label: 'Renavam' },
    { key: 'chassis', label: 'Chassi' },
    { key: 'fuel_card', label: 'Cartão Combustível' },
    { key: 'status', label: 'Status' },
  ],
};

// Fuel records import config
export const fuelImportConfig = {
  mappings: [
    { excelColumn: 'Data', dbColumn: 'date', required: true, transform: toDate },
    { excelColumn: 'Litros', dbColumn: 'liters', required: true, transform: toNumber },
    { excelColumn: 'Preço/Litro', dbColumn: 'price_per_liter', transform: toNumber },
    { excelColumn: 'Valor Total', dbColumn: 'total_value', transform: toNumber },
    { excelColumn: 'Odômetro', dbColumn: 'odometer', transform: toInteger },
    { excelColumn: 'Tipo Combustível', dbColumn: 'fuel_type', transform: toString },
    { excelColumn: 'Posto', dbColumn: 'station', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
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
    { excelColumn: 'Número Tag', dbColumn: 'tag_number', required: true, transform: toString },
    { excelColumn: 'Data Passagem', dbColumn: 'passage_date', required: true, transform: toDateTime },
    { excelColumn: 'Valor', dbColumn: 'value', required: true, transform: toNumber },
    { excelColumn: 'Praça', dbColumn: 'toll_plaza', transform: toString },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'tag_number', label: 'Número Tag' },
    { key: 'passage_date', label: 'Data Passagem' },
    { key: 'value', label: 'Valor' },
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
    { excelColumn: 'Data Aferição', dbColumn: 'calibration_date', required: true, transform: toDate },
    { excelColumn: 'Data Vencimento', dbColumn: 'expiration_date', required: true, transform: toDate },
    { excelColumn: 'Número Certificado', dbColumn: 'certificate_number', transform: toString },
    { excelColumn: 'Número INMETRO', dbColumn: 'inmetro_number', transform: toString },
    { excelColumn: 'Status', dbColumn: 'status', transform: (v: string) => v?.toLowerCase() || 'valid' },
  ] as ColumnMapping[],
  templateColumns: [
    { key: 'calibration_date', label: 'Data Aferição' },
    { key: 'expiration_date', label: 'Data Vencimento' },
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
