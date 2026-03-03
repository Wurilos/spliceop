

## Plano: Adicionar tipo "BASE" aos Atendimentos

### O que muda

**`src/components/service-calls/ServiceCallForm.tsx`**
- Adicionar `'BASE'` à lista `defaultCallTypes` para que apareça como opção no campo "Tipo" do formulário de atendimentos

Isso é tudo — o campo Equipamento já é opcional, então ao selecionar tipo "BASE" e deixar o equipamento vazio, o atendimento será cadastrado normalmente como um atendimento coringa.

