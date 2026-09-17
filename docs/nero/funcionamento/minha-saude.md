# Minha Saúde — como cada funcionalidade funciona e em que se baseia

> Módulo transversal (§59–§63). Fase 0 entregou perfil único, antecedentes e medicamentos; a Fase 3 entrega a central de exames com filtros, documentos, linha do tempo geral, relatórios em PDF, "Preparar minha consulta" e central de lembretes.

## Referências usadas neste módulo
*(a preencher na Fase 3; o perfil da Fase 0 não tem regra clínica própria — os campos existem para alimentar os módulos)*

## 1. Perfil de Saúde único (§64) — Fase 0
- Cadastrado uma vez (perfil inicial em passos) e editado em "Meu perfil"; todos os módulos leem daqui e gravam de volta o que perguntam.
- Campos: dados básicos, tabagismo (com maços-ano calculado em `src/core/perfil/calculos.ts`), comorbidades, história pessoal/genética, radioterapia, antecedentes familiares, declarações negativas ("não tomo medicamentos", "sem antecedentes").

## 2. Meus medicamentos (§21) — Fase 0
- Nome, dose, horários (`src/core/medicacoes/horarios.ts` normaliza "8h / 20h30"), desde quando, prescritor, ativo/inativo. Sem qualquer sugestão de dose (§25). Lembretes por horário chegam na Fase 2a.

## 3–7. Central de exames · Documentos · Linha do tempo geral · Relatórios em PDF · Preparar minha consulta · Central de lembretes — Fase 3
*(a escrever com a spec da Fase 3)*
