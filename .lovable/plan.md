

# Plano: Exibir Detalhes dos Equipamentos Vencidos nos Tooltips

## Objetivo
Ao passar o mouse sobre os segmentos de aferições **vencidas** nos gráficos do dashboard de Calibrações, exibir uma lista com os equipamentos específicos que estão com a calibração vencida.

---

## Resumo da Solução

Vou modificar o `CalibrationsDashboard.tsx` para:
1. Enriquecer os dados dos gráficos com listas de equipamentos
2. Criar um componente de tooltip customizado que exibe esses detalhes
3. Aplicar o tooltip nos gráficos relevantes

---

## Gráficos Afetados

| Gráfico | Comportamento Atual | Novo Comportamento |
|---------|---------------------|-------------------|
| **Aferições por Status** | Mostra apenas "Vencida: 2" | Mostrará os nº de série dos equipamentos vencidos |
| **Aferições por Tipo de Equipamento** | Mostra "Vencida: 2" por tipo | Mostrará quais equipamentos de cada tipo estão vencidos |
| **Vencimentos por Contrato e Mês** | Mostra quantidade por contrato | Mostrará os equipamentos que vencem em cada mês/contrato |

---

## Mudanças Técnicas

### 1. Enriquecer Dados com Listas de Equipamentos

Modificar os `useMemo` que calculam os dados dos gráficos para incluir arrays de equipamentos:

```typescript
// Exemplo para calibrationsByStatus
const calibrationsByStatus = useMemo(() => {
  const statusData: Record<string, { value: number; items: string[] }> = {
    'Válida': { value: 0, items: [] },
    'Vencida': { value: 0, items: [] },
    'Pendente': { value: 0, items: [] },
  };

  calibrations.forEach(cal => {
    const serial = cal.equipment?.serial_number || 'N/A';
    const expDate = new Date(cal.expiration_date);
    
    if (isBefore(expDate, today)) {
      statusData['Vencida'].value++;
      statusData['Vencida'].items.push(serial);
    } else if (cal.status === 'pending') {
      statusData['Pendente'].value++;
      statusData['Pendente'].items.push(serial);
    } else {
      statusData['Válida'].value++;
      statusData['Válida'].items.push(serial);
    }
  });

  return Object.entries(statusData)
    .filter(([_, data]) => data.value > 0)
    .map(([name, data]) => ({
      name,
      value: data.value,
      items: data.items,
      color: STATUS_COLORS[name === 'Válida' ? 'valid' : name === 'Vencida' ? 'expired' : 'pending'],
    }));
}, [calibrations]);
```

### 2. Criar Tooltip Customizado

Criar um componente local que renderiza a lista de equipamentos:

```typescript
const CalibrationTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-xl max-w-xs">
      {label && <div className="font-medium mb-2">{label}</div>}
      {payload.map((entry: any, idx: number) => {
        const items = entry.payload?.items || entry.payload?.[`${entry.dataKey}_items`] || [];
        return (
          <div key={idx} className="mb-2">
            <div className="flex items-center gap-2">
              <div 
                className="h-2.5 w-2.5 rounded-sm" 
                style={{ backgroundColor: entry.color || entry.payload?.color }}
              />
              <span>{entry.name}: <strong>{entry.value}</strong></span>
            </div>
            {items.length > 0 && items.length <= 10 && (
              <div className="ml-4 mt-1 text-muted-foreground">
                {items.map((item: string, i: number) => (
                  <div key={i}>• {item}</div>
                ))}
              </div>
            )}
            {items.length > 10 && (
              <div className="ml-4 mt-1 text-muted-foreground">
                <div>• {items.slice(0, 8).join(', ')}</div>
                <div className="italic">+{items.length - 8} outros...</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
```

### 3. Aplicar nos Gráficos

Substituir `<ChartTooltip content={<ChartTooltipContent />} />` pelo novo componente nos gráficos relevantes:

```typescript
<ChartTooltip content={<CalibrationTooltip />} />
```

---

## Arquivos a Modificar

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| `src/components/calibrations/CalibrationsDashboard.tsx` | Adicionar tooltip customizado e enriquecer dados |

---

## Comportamento Visual Esperado

Ao passar o mouse sobre uma barra "Vencida" no gráfico:

```text
┌─────────────────────────────┐
│ Fixo                        │
├─────────────────────────────┤
│ 🟢 Válida: 43               │
│ 🔴 Vencida: 2               │
│    • ECF-001234             │
│    • ECF-005678             │
└─────────────────────────────┘
```

Se houver muitos itens (>10), será resumido:

```text
│ 🔴 Vencida: 15              │
│    • ECF-001, ECF-002, ...  │
│    +7 outros...             │
```

