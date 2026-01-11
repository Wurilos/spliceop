import * as XLSX from 'xlsx';

interface MaintenanceItemData {
  component_code: string;
  component_name: string;
  component_value: number;
  quantity: number;
  barcode: string;
  defect_description: string;
  field_service_code: string;
  equipment_serial: string;
}

interface MaintenanceData {
  id: string;
  contract_number: string;
  contract_name: string;
  centro_custo: string;
  remetente: string;
  destinatario: string;
  solicitante: string;
  send_date: string;
  observations: string;
  items: MaintenanceItemData[];
}

export function generateMaintenanceNFRequest(data: MaintenanceData) {
  const workbook = XLSX.utils.book_new();

  // Calculate total value
  const totalValue = data.items.reduce((sum, item) => sum + (item.component_value * item.quantity), 0);

  // ============ ABA 1: Pedido NF ============
  const pedidoNFData = [
    ['SPLICE INDÚSTRIA'],
    [''],
    ['', '', '', '', '', '', 'TIPO OPERAÇÃO:'],
    ['', '', '', '', '', '', 'ENVIO PARA CONSERTO', '', '', '', '', '', '', '', '', '', '', data.centro_custo],
    ['CÓD.FIRMA:', 'Destinatário ou Remetente', '', '', '', '', 'CÓD. FISCAL (CFOP):'],
    ['16321', `${data.contract_number} - CC: ${data.centro_custo}`],
    [''],
    ['COND.PGTO.:', '0', '', 'LOCAL DE ENTREGA:'],
    [''],
    ['', '', '', '', '', '', 'Destacar quando cobrado do Destinatário/Remetente na NOTA FISCAL'],
    [`VALOR TOTAL DA NF.`, '', '', totalValue.toFixed(2), '', '', 'Vlr. do FRETE:', '', 'Vlr. do Seguro', '', 'Despesas Acessórias'],
    ['', '', '', '', '', '', '0.00', '', '0.00', '', '0.00'],
    [''],
    ['IMPOSTO', 'VALOR DA BASE DE CALCULO', '', '', '%', 'VALOR DOS IMPOSTOS', 'BASE ISENTA', '', 'BASE OUTROS'],
    ['ICMS', '0.00', '', '', '12%', '0.00', '0.00', '', '0.00'],
    ['IPI', '0.00', '', '', '10%', '0.00', '0.00', '', '0.00'],
    [''],
    ['CÓDIGO', 'QTDA', '', 'UN', 'DESCRIÇÃO DO MATERIAL', '', 'N.C.M.', 'ST', 'P.unitário', 'P.total', 'IPI %', 'Vlr. do IPI'],
  ];

  // Add items to Pedido NF
  data.items.forEach(item => {
    pedidoNFData.push([
      item.component_code,
      item.quantity.toString(),
      '',
      '',
      item.component_name,
      '',
      'ELETRONICOS',
      '',
      item.component_value.toFixed(2),
      (item.component_value * item.quantity).toFixed(2),
      '',
      '',
    ]);
  });

  // Add footer to Pedido NF
  pedidoNFData.push(
    [''],
    ['DADOS ADICIONAIS', '', '', '', '', '', '', '', 'SUB TOTAL', '', totalValue.toFixed(2)],
    [''],
    ['TRANSPORTADORA:', '', '', '', '', '', 'FRETE POR CONTA'],
    [''],
    ['ENDEREÇO:', '', '', '', '', '', 'REMETENTE', 'X'],
    ['CIDADE:', '', '', '', 'ESTADO:', '', '', '', 'DESTINATÁRIO'],
    ['CNPJ:', '', '', '', 'I.E'],
    [''],
    ['MARCA', '', 'NÚMERO', '', 'QUANTIDADE', '', 'ESPÉCIE', '', 'P. BRUTO', '', 'P. LÍQUIDO'],
    [''],
    ['OBSERVAÇÕES EXTRAS:'],
    ['NÃO MOVIMENTAR ESTOQUE'],
    [`ENTRADA DE MATERIAL PARA MANUTENÇÃO. Referente Contrato: ${data.contract_number} - CC: ${data.centro_custo}`],
    [''],
    ['ORIGEM DO PRODUTO/MERCADORIA', '', '', '', '', 'FATURAMENTO'],
    [''],
    ['PRODUÇÃO', '', '', 'ATIVO', '', '', 'REQUISITANTE/GESTOR', '', '', 'CONTRATOS'],
    ['', '', '', '', '', '', data.solicitante],
    ['REVENDA', '', '', 'CONSUMO', 'X'],
    ['', '', '', '', '', '', `Data/Hora: ${new Date().toLocaleString('pt-BR')}`],
  );

  const wsPedidoNF = XLSX.utils.aoa_to_sheet(pedidoNFData);
  wsPedidoNF['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 6 }, { wch: 6 }, { wch: 50 }, { wch: 6 },
    { wch: 15 }, { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsPedidoNF, 'Pedido NF');

  // ============ ABA 2: Solicitação de Atendimento ============
  const solicitacaoData = [
    [`SOLICITAÇÃO DE ABERTURA DE ATENDIMENTO`, '', '', '', `${data.contract_number} - CC: ${data.centro_custo}`, '', '', '', ''],
    [''],
    [''],
    ['NF', '', '', '', '', '', '', '', ''],
    ['Data', '', '', '', '', '', '', '', ''],
    ['OM', '', '', '', '', '', '', '', ''],
    [''],
    ['Código da peça', 'Código de Barras', 'Descrição do produto', 'DEFEITO DETECTADO', 'Código do atendimento CAMPO/BASE', 'Nº de série do equipamento', 'Código de atendimento Mob2b', 'Retorno NF', ''],
  ];

  // Add items to Solicitação
  data.items.forEach(item => {
    solicitacaoData.push([
      item.component_code,
      item.barcode || '',
      item.component_name,
      item.defect_description || '',
      item.field_service_code || '',
      item.equipment_serial || '',
      '', // Código de atendimento Mob2b - vazio
      '', // Retorno NF - vazio
      '',
    ]);
  });

  const wsSolicitacao = XLSX.utils.aoa_to_sheet(solicitacaoData);
  wsSolicitacao['!cols'] = [
    { wch: 15 }, { wch: 30 }, { wch: 50 }, { wch: 35 }, { wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsSolicitacao, 'Solicitação de Atendimento');

  // ============ ABA 3: Envio de Material ============
  const envioData = [
    ['ENVIO DE MATERIAL PARA MANUTENÇÃO'],
    [''],
    ['Data de Envio:', formatDate(data.send_date)],
    ['Remetente:', data.remetente],
    ['Centro de Custo:', data.centro_custo],
    ['Destinatário:', data.destinatario],
    ['Solicitante:', data.solicitante],
    ['Nº OM:', ''],
    ['Nº NF:', ''],
    [''],
    ['ITENS ENVIADOS'],
    ['Código', 'Descrição', 'Quantidade', 'Valor Unitário', 'Valor Total'],
  ];

  // Add items to Envio
  data.items.forEach(item => {
    envioData.push([
      item.component_code,
      item.component_name,
      item.quantity.toString(),
      item.component_value.toFixed(2),
      (item.component_value * item.quantity).toFixed(2),
    ]);
  });

  envioData.push(
    [''],
    ['', '', 'TOTAL:', '', totalValue.toFixed(2)],
    [''],
    ['Observações:', data.observations || ''],
  );

  const wsEnvio = XLSX.utils.aoa_to_sheet(envioData);
  wsEnvio['!cols'] = [
    { wch: 15 }, { wch: 50 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsEnvio, 'Envio de Material');

  // Generate and download file
  const fileName = `pedido-nf-manutencao-${data.contract_number}-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);

  return fileName;
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}
