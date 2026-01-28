
# Análise: Dados Aparecem na Listagem mas Não no Formulário de Edição

## Diagnóstico do Problema

Após analisar diversos módulos do sistema, identifiquei **três causas principais** para este problema recorrente:

---

## Causa 1: Incompatibilidade de Valores em Campos Select

**O que acontece:**
- O banco de dados armazena um valor (ex: "Convencional")
- O formulário tem opções diferentes nas listboxes (ex: "Energia Convencional")
- Quando o valor do banco não existe nas opções do Select, o campo aparece vazio

**Módulos afetados já corrigidos:**
- EquipmentForm (Tipo, Meio de Comunicação, Tipo de Energia)

**Módulos que precisam verificação:**
- CalibrationForm (Status)
- InfractionForm (Contrato, Equipamento)
- ServiceCallForm (Tipo, Contrato, Equipamento, Colaborador)
- AdvanceForm (Contrato, Colaborador, Status)
- TollTagForm (Contrato, Veículo)

---

## Causa 2: Conversão de Formato de Data/Hora

**O que acontece:**
- Campos `datetime-local` requerem formato `YYYY-MM-DDTHH:mm`
- O banco armazena formato `YYYY-MM-DD` ou `YYYY-MM-DD HH:mm:ss`
- Se a conversão não é feita, o campo aparece vazio

**Exemplo já corrigido:**
- EquipmentForm: `installation_date` agora converte corretamente

**Módulos que precisam verificação:**
- TollTagForm: `passage_date`
- Qualquer formulário com campos datetime-local

---

## Causa 3: Dependência de Dados Relacionais

**O que acontece:**
- Formulários com campos dependentes (ex: Contrato → Equipamento filtrado)
- Quando o `useEffect` popula o formulário, os dados relacionais (equipamentos, contratos) podem ainda não estar carregados
- O valor do banco é válido, mas não encontra correspondência nas opções disponíveis

**Exemplo no CalibrationForm:**
```javascript
// Linha 78-101: O useEffect depende de 'equipment' estar carregado
useEffect(() => {
  if (initialData) {
    const equipmentItem = equipment.find(e => e.id === initialData.equipment_id);
    form.reset({
      contract_id: equipmentItem?.contract_id || '', // Se equipment vazio, contract_id fica vazio
      // ...
    });
  }
}, [initialData, form, equipment]); // Equipment pode não estar carregado ainda
```

---

## Plano de Correção

### Etapa 1: Correção do CalibrationForm
- Garantir que o `useEffect` só execute quando `equipment` e `contracts` estiverem carregados
- Adicionar verificação de carregamento

### Etapa 2: Correção do InfractionForm  
- Verificar se os valores de `equipment_id` e `contract_id` existem nas opções
- Adicionar fallback para valores não encontrados

### Etapa 3: Correção do ServiceCallForm
- Verificar campos Select que podem não ter correspondência
- Adicionar z-index nas SelectContent se necessário

### Etapa 4: Correção do AdvanceForm
- Verificar filtragem de colaboradores por contrato
- Garantir que o colaborador seja populado mesmo se filtrado por outro contrato

### Etapa 5: Correção do TollTagForm
- Converter `passage_date` para formato datetime-local correto

### Etapa 6: Correção do InternetBillForm
- Verificar campo `reference_month` que usa input type="month" (formato diferente)

### Etapa 7: Auditoria Geral
- Revisar todos os formulários com campos Select dependentes
- Adicionar logs de debug em desenvolvimento para identificar valores não correspondentes

---

## Detalhes Técnicos das Correções

### Padrão de Correção para Campos Select com Dados Relacionais:

```typescript
useEffect(() => {
  // Aguardar dados carregarem antes de popular o form
  if (initialData && equipment.length > 0 && contracts.length > 0) {
    const equipmentItem = equipment.find(e => e.id === initialData.equipment_id);
    form.reset({
      contract_id: equipmentItem?.contract_id || '',
      equipment_id: initialData.equipment_id,
      // ...
    });
  }
}, [initialData, form, equipment, contracts]);
```

### Padrão de Correção para Campos datetime-local:

```typescript
useEffect(() => {
  if (initialData) {
    // Converter data do banco para formato datetime-local
    let passageDate = initialData.passage_date || '';
    if (passageDate && !passageDate.includes('T')) {
      passageDate = passageDate + 'T00:00';
    } else if (passageDate) {
      passageDate = passageDate.slice(0, 16); // YYYY-MM-DDTHH:mm
    }
    
    form.reset({
      passage_date: passageDate,
      // ...
    });
  }
}, [initialData, form]);
```

---

## Arquivos a Modificar

1. `src/components/calibrations/CalibrationForm.tsx` - Aguardar carregamento de dados
2. `src/components/infractions/InfractionForm.tsx` - Verificar correspondência de valores
3. `src/components/service-calls/ServiceCallForm.tsx` - Verificar correspondência de valores
4. `src/components/advances/AdvanceForm.tsx` - Corrigir filtragem de colaboradores
5. `src/components/tolls/TollTagForm.tsx` - Conversão de datetime
6. `src/components/internet/InternetBillForm.tsx` - Formato de mês
7. `src/components/energy/EnergyForm.tsx` - Verificar correspondência de contrato

---

## Resultado Esperado

Após as correções:
- Todos os campos serão populados corretamente ao abrir o formulário de edição
- Os dados do banco serão convertidos para os formatos esperados pelos inputs
- Os campos Select encontrarão correspondência mesmo quando dados relacionais demoram para carregar
