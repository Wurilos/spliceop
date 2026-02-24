

# Corrigir Tela Branca em Determinados Computadores

## Problema Identificado

O sistema trava e exibe tela branca em alguns computadores. Após análise do codigo, identifiquei as seguintes causas principais:

1. **Carga pesada no carregamento inicial**: O hook `useSystemAlerts` executa mais de 10 consultas ao banco de dados em paralelo toda vez que qualquer pagina carrega (ele roda no `AppLayout` via `NotificationPopup`). Em computadores mais lentos ou com conexao instavel, isso pode travar o navegador.

2. **Ausencia de Error Boundary**: Quando ocorre qualquer erro nao tratado em JavaScript (como falha de rede, timeout, ou erro de renderizacao de graficos), o React "morre" silenciosamente e exibe tela branca. Nao existe nenhum componente de Error Boundary no projeto.

3. **Erros assincronos nao capturados**: Nao ha tratamento global para `unhandledrejection`, entao promises rejeitadas (ex: falha de rede) causam crash silencioso.

4. **Renderizacao pesada de graficos SVG**: Os dashboards com Recharts podem sobrecarregar computadores com hardware limitado.

## Solucao Proposta

### 1. Criar um Error Boundary Global
Adicionar um componente React Error Boundary que captura erros de renderizacao e exibe uma tela amigavel com opcao de recarregar, em vez de tela branca.

- Novo arquivo: `src/components/ErrorBoundary.tsx`
- Envolve toda a aplicacao no `App.tsx`

### 2. Adicionar Tratamento Global de Erros Assincronos
No `App.tsx`, adicionar listener para `unhandledrejection` que exibe um toast de erro em vez de crashar silenciosamente.

### 3. Otimizar o `useSystemAlerts`
- Adicionar `try/catch` em volta de cada consulta ao banco
- Usar `Promise.allSettled` em vez de executar consultas sequencialmente (se uma falhar, as outras continuam)
- Aumentar o `staleTime` para evitar reconsultas desnecessarias

### 4. Proteger o Dashboard contra erros de renderizacao
- Adicionar `try/catch` nos componentes de graficos/dashboards que usam Recharts

---

### Detalhes Tecnicos

**Arquivo: `src/components/ErrorBoundary.tsx`** (novo)
- Componente class-based React Error Boundary
- Exibe mensagem "Algo deu errado" com botao para recarregar a pagina
- Captura e loga o erro no console

**Arquivo: `src/App.tsx`** (modificar)
- Envolver `<Routes>` com `<ErrorBoundary>`
- Adicionar `useEffect` com listener `unhandledrejection`
- Converter `App` de arrow function para componente funcional para usar hooks

**Arquivo: `src/hooks/useSystemAlerts.ts`** (modificar)
- Envolver a `queryFn` principal em `try/catch` retornando array vazio em caso de erro
- Usar `Promise.allSettled` para as consultas paralelas ao banco
- Proteger cada bloco de processamento de alertas individualmente

**Arquivo: `src/pages/Index.tsx`** (modificar)
- Adicionar `try/catch` no `Promise.all` que busca stats do dashboard

