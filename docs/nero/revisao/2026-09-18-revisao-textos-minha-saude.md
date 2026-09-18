# Revisão — textos de Minha Saúde (Fase 3: documentos, relatórios, QR, consulta, lembretes)

> Para o Murilo revisar. Cada bloco indica o arquivo de origem. Anote as correções aqui (ou me diga em conversa) e eu aplico no código.
> Regra: linguagem do §25 — orienta, não assusta, não diagnostica. O relatório **organiza**; a interpretação é do médico.

## Ressalvas literais (não alterar sem mudar a spec) — `src/core/relatorios/html.ts`
- §26 (cardio, geral, consulta): "Este relatório organiza suas aferições domiciliares e não substitui a interpretação realizada pelo seu médico."
- §40 (oncológico, geral, consulta): "As informações apresentadas foram registradas pelo usuário e organizadas pelo NERO para facilitar o acompanhamento com seu profissional de saúde. O relatório não substitui avaliação médica."
- Rodapé: "Gerado pelo NERO em <data> · dados registrados pelo paciente. O código QR dá acesso a este PDF até <data>."

## Títulos e frases fixas do relatório — `src/core/relatorios/montar.ts`
| Seção | Texto |
|---|---|
| Títulos dos relatórios | "Relatório cardiovascular e metabólico" · "Relatório de rastreamento oncológico" · "Relatório geral de acompanhamento" · "Preparação para consulta — <especialidade>" |
| Dados gerais | "<nome> · <idade> anos · sexo ao nascer: …" · "Condições informadas: …" · "Tabagismo: ex-fumante · 20,0 maços-ano" · "Câncer prévio: …" · "Síndromes/mutações: …" |
| Medicamentos | "O paciente declarou não usar medicamentos." / "Nenhum medicamento cadastrado." |
| PA avulsa | "<n> medidas no período · média 130/83 mmHg. Medidas avulsas são triagem e não definem diagnóstico; a referência domiciliar é a da MRPA." |
| MRPA | "Sessão iniciada em … (5 dias) · 24 medidas válidas, 0 excluídas · protocolo válido/incompleto · PA de consultório informada 142/92" · chip "Média acima/dentro da referência domiciliar (130/80 mmHg)" |
| Glicemia | "Metas em uso (SBD 2026 pelo perfil / definidas pelo médico): jejum 80–130 · pós-prandial até 180 · ao deitar 90–150 mg/dL · n abaixo e n acima da meta" · "Episódios registrados: n baixos · n altos" |
| Laboratório | colunas "Exame · Último resultado · Data · Referência do laboratório · Anteriores" |
| PREVENT | "Calculado em … · modelo base · risco em 10 anos 7,4% (categoria intermediário) · 30 anos 21,3%" + tabela "Dado usado · Valor · Data · Origem" |
| Agravantes | "Nenhum agravante informado." / "Agravantes ainda não revisados no app." |
| Check-up | "<n> de 8 itens atualizados" + "<item>: atualizado/pendente/não se aplica — <frase>" |
| Rastreamentos | colunas "Programa · Situação · Próxima data · Orientação"; situações: Indicado, Próximo de iniciar, Não indicado no momento, Avaliação individualizada, Acompanhamento médico, Em dia, Exame próximo, Exame atrasado |
| Programa | "Situação: <status>. <mensagem do módulo> Próxima data: …" · tabela "Exame · Data · Resultado · Classificação · Próxima recomendação" · chip "Pendência aberta desde <data>: <descrição>" |
| Pendências | "Nenhuma pendência aberta." · Sintomas: "Nenhum sintoma de alerta registrado." |
| História familiar | "<parentesco> (1º grau): câncer de mama aos 52 anos" · "O paciente declarou não ter antecedentes familiares relevantes." |
| Vazio | "Sem registros no período" |

## Telas — `src/modules/minha-saude/conteudo/relatorios.ts` e `app/(app)/minha-saude/**`
- Central: "O relatório organiza o que você registrou para levar ao médico. Ele é gerado no seu celular; só vai para a nuvem se você pedir um código QR."
- Prévia: "Período das medidas: últimos 90 dias. Exames e rastreamentos entram sem limite de data." · botões "Gerar PDF e compartilhar" / "Mostrar QR para o médico" · nota "O PDF é gerado no seu celular. Só sai daqui se você pedir o código QR."
- Confirmação do QR: "Para o médico abrir pelo celular dele, o PDF fica na nuvem por 7 dias, em um endereço privado que só quem tem o código consegue abrir. Você pode encerrar antes, a qualquer momento."
- Modal do QR: "Mostre este código ao médico" · "O médico aponta a câmera do celular e abre o PDF. Válido até <data>." · "Encerrar compartilhamento"
- Encerrar (central): "O código QR deixa de funcionar imediatamente e o PDF é removido da nuvem."
- Preparar consulta: "O NERO seleciona o que mais importa para esta consulta; o restante fica no relatório geral."
- Documentos: "Guarde laudos, receitas e imagens de exames. Só você vê estes arquivos; eles entram no relatório apenas se você pedir." · vazio: "Nenhum documento guardado ainda. Fotografe um laudo ou escolha um PDF para começar." · erro "Arquivo maior que 10 MB. Tire uma foto com menos resolução ou escolha um PDF menor." · permissões: "Permita o uso da câmera nas configurações do celular para fotografar o laudo." / "Permita o acesso às fotos…"
- Preferências: "Escolha quais avisos o celular deve mostrar. Desligar um tipo cancela só as notificações; as pendências continuam aparecendo na Home e nas telas do NERO." · nota "Para silenciar tudo em horários fixos, use o 'Não perturbe' do próprio celular." · tipos: Exames de rastreamento · MRPA (medidas em casa) · Plano de glicemia · Medicamentos · Consultas · Atualização de dados clínicos.
- Consultas: lembrete véspera "Amanhã: consulta de cardiologia às 14:00. Quer preparar o relatório?" · dia "Hoje: consulta de cardiologia às 14:00 — <local>. O relatório está em Minha Saúde › Preparar minha consulta." · vazio "Nenhuma consulta marcada. Ao marcar, o NERO avisa na véspera e no dia, e sugere preparar o relatório."
- Home: "Hoje: consulta de cardiologia às 14:00 — preparar" / "Amanhã: consulta de … às …" (amarelo).
- Central de lembretes: item silenciado mostra "· sem aviso no celular".
