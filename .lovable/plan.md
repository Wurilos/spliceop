

## Plano: Pesquisa por Nº Equipamento + Rótulos nos Filtros

### Problema
1. Não existe caixa de pesquisa por número de série no módulo Equipamentos
2. Os filtros (Select) não têm rótulos visíveis — o usuário não sabe o que cada um filtra

### Alterações

**1. `src/components/equipment/EquipmentFilters.tsx`**
- Adicionar um campo `Input` de pesquisa por número de série (serial_number) no topo dos filtros, com ícone de busca e placeholder "Pesquisar nº equipamento..."
- Adicionar rótulos (`<label>`) acima de cada Select: "Contrato", "Velocidade", "Comunicação", "Energia", "Tipo", "Status"
- Receber nova prop `searchTerm` e `onSearchChange` para controlar a pesquisa

**2. `src/pages/Equipment.tsx`**
- Adicionar estado `searchTerm` para a pesquisa por número de série
- Incluir filtro de pesquisa no `filteredEquipment` — filtra por `serial_number` usando `includes` (case-insensitive)
- Passar `searchTerm` e `onSearchChange` ao componente `EquipmentFilters`

### Resultado
- Campo de busca rápida por número de equipamento na barra de filtros
- Cada filtro terá um rótulo claro indicando seu propósito

