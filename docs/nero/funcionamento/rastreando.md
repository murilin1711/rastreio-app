# Rastreando — como cada funcionalidade funciona e em que se baseia

> Fase 1 (concluída em 16/09/2026). Escrito em 17/09/2026 a partir das decisões C-001–C-009 (`02-DECISOES.md`), da spec `docs/superpowers/specs/2026-09-15-nero-fase1-rastreando-design.md` e da semente `supabase/seed.sql`. Uma seção por funcionalidade; cada regra cita a referência do acervo (`../referencias/REFERENCIAS.md`) com a recomendação/tabela.
>
> Código: motor em `src/core/regras/` (handlers em `programas/`), serviços em `src/core/rastreando/`, telas em `app/(app)/rastreando/**`, textos em `src/modules/rastreando/conteudo/`. Revisão clínica dos textos pendente: `docs/nero/revisao/2026-09-16-revisao-textos-rastreando.md`.

## Referências usadas neste módulo

| Sigla | Documento | Arquivo | Decisão |
|---|---|---|---|
| CBR/SBM/FEBRASGO 2023 | Urban et al., Recomendações para o rastreamento do câncer de mama no Brasil (*Radiol Bras* 2023) + Nota Técnica CNM 2025 (reafirma) | `../referencias/pdf/2023-CBR-SBM-FEBRASGO-rastreamento-cancer-mama-Urban.pdf` · `2025-CNM-...-nota-tecnica-rastreamento-mama.pdf` | C-001 |
| MS 2025 | Mamografia no SUS: 50–74 bienal; 40–49 decisão compartilhada | `../referencias/texto/2025-MS-mamografia-40-anos-noticia-FEBRASGO.md` (secundária) | C-001 (texto "No SUS") |
| ACR BI-RADS | Atlas 5. ed. (categorias 0–6) | página oficial (atlas pago) | C-009 |
| INCA 2025 | Diretrizes para o Rastreamento do Câncer do Colo do Útero, 3. ed. (DNA-HPV) | `../referencias/pdf/2025-INCA-rastreamento-colo-utero-DNA-HPV-3ed.pdf` | C-002 |
| INCA 2016/2025 (citologia) | Detecção precoce do colo do útero (página) + diretriz 2016 **a obter** | `../referencias/texto/2025-INCA-deteccao-precoce-colo-pagina.md` | C-003 |
| CONITEC 2026 | Diretrizes do Rastreamento do Câncer de Cólon e Reto — relatório **preliminar** CP 20 | `../referencias/pdf/2026-CONITEC-rastreamento-colon-reto-relatorio-preliminar-CP20.pdf` | C-004 |
| ACG 2021 | Shaukat et al., Colorectal Cancer Screening (história familiar) | `../referencias/pdf/2021-ACG-colorectal-cancer-screening-Shaukat.pdf` | C-005 |
| USPSTF 2021 | Lung Cancer: Screening (Grau B), endossada pela SBPT | `../referencias/texto/2021-USPSTF-lung-cancer-screening.md` | C-006 |
| ACR Lung-RADS v2022 | Tabela oficial de categorias | `../referencias/pdf/2022-ACR-Lung-RADS-v2022.pdf` | C-007 |
| SBU/SBOC/SBRT 2023 | Posicionamento sobre rastreamento do câncer de próstata + notas SBU 2018/2020 | `../referencias/pdf/2023-SBU-SBOC-SBRT-posicionamento-rastreamento-prostata.pdf` · `texto/2018-2025-SBU-rastreamento-prostata.md` | C-008 |

---

## 1. Perfil e elegibilidade — "Seus rastreamentos" (§28)

### O que o app faz
1. Lê o Perfil de Saúde único (idade, sexo, colo do útero, atividade sexual, histerectomia, tabagismo, HIV/imunossupressão, DII, história pessoal, genética, radioterapia, antecedentes familiares, raça/cor).
2. Para cada programa, o handler (`src/core/regras/programas/<programa>.ts`) responde: aplicável? faixa etária? fatores que exigem avaliação individualizada?
3. Cruza com o último exame do programa e devolve um dos **8 status**: indicado · próximo de iniciar · não indicado no momento · avaliação individualizada · acompanhamento médico · em dia · exame próximo · exame atrasado.
4. Antes de qualquer cálculo, a **hierarquia de segurança (§66)** em `seguranca.ts`: sintoma de alarme registrado, pendência aberta ou acompanhamento especializado prevalecem sobre o calendário.
5. "Preciso rastrear?" pergunta só o que falta no perfil para aquele programa e grava de volta no perfil.

### Faixas e critérios por programa
| Programa | Aplicável | Faixa | Intervalo habitual | Fonte |
|---|---|---|---|---|
| Mama | sexo feminino | 40–74; ≥ 75 → acompanhamento médico (continuar se expectativa de vida ≥ 7 anos) | mamografia anual | CBR/SBM/FEBRASGO 2023 (C-001) |
| Colo do útero | possui colo **e** já teve atividade sexual (Rec. 34, 36) | início 25; encerra quando o último DNA-HPV acima dos 60 for negativo (Rec. 12–13) | DNA-HPV a cada 5 anos; **3 anos** se HIV/imunossupressão (Rec. 18, 39) | INCA 2025 (C-002) |
| Colorretal | todos | 50–74 (último FIT aos 74; "final aos 75", Rec. 6) | FIT a cada 2 anos | CONITEC 2026 Rec. 5–8 (C-004) |
| Pulmão | ≥ 20 maços-ano **e** (fuma ou parou há ≤ 15 anos) | 50–80 | TCBD anual; sai ao completar 15 anos sem fumar | USPSTF 2021 (C-006) |
| Próstata | sexo masculino | conversa a partir dos **50** (expectativa > 10 anos); a partir dos **40** se história familiar, raça/cor preta ou mutação BRCA; > 75 → acompanhamento médico | **sem intervalo automático** — o app pergunta a data definida pelo médico | SBU/SBOC/SBRT 2023 (C-008) |

### Avaliação individualizada (status com a regra citada na mensagem)
- **Mama** (C-001): mutação BRCA1 ou parente de 1º grau portadora sem teste → mamografia anual desde o diagnóstico, não antes de 35 (RM não antes de 25); TP53 → não antes de 30 (RM 20); BRCA2/outros → mamografia e RM não antes de 30; risco ≥ 20 % ao longo da vida por modelo → 10 anos antes do parente mais jovem, não antes de 30 (o app **não** calcula modelos: forte história familiar → orienta estimar com o médico); radioterapia torácica antes dos 30 → anual a partir do 8º ano após o tratamento, não antes de 30; HLA/CLIS/HDA → estimar risco; câncer de mama tratado → acompanhamento especializado; mamas densas → texto educativo sobre US adjunta.
- **Colo** (C-002): histerectomia por lesão/câncer → coleta vaginal por 25 anos (Rec. 35); NIC 2/3 ou AIS tratadas → manter por 25 anos (Rec. 14); histerectomia benigna com exames prévios normais → excluída (Rec. 34).
- **Colorretal** (C-004/C-005): CCR ou adenoma prévio, DII, Lynch/PAF → fora do "risco padrão"; 1 parente de 1º grau < 60 ou ≥ 2 de 1º grau → colonoscopia aos 40 ou 10 anos antes do caso mais jovem, a cada 5 anos (ACG Rec. 9–10; a mensagem calcula a idade); 1 parente de 1º grau ≥ 60 → iniciar aos 40 e seguir risco médio (Rec. 11); 2º grau → risco médio (Rec. 12).
- **Pulmão**: sem modificador; fora dos critérios → "não indicado no momento" com explicação.
- **Próstata** (C-008): obesidade é só fator educativo; PSA acima da referência do laboratório → "avaliação médica recomendada", nunca ponto de corte único.

---

## 2. Registro de exame e regras de resultado (§30–§31, §42–§53)

### O que o app faz ao registrar
1. Monta o contexto (`src/core/rastreando/contexto.ts`): perfil + sintomas de alarme + pendências abertas + histórico.
2. Carrega as regras ativas do programa em `regras_clinicas` (62 linhas semeadas, `versao 2026.1`, cada uma com fonte e ano).
3. `classificarExame` aplica a hierarquia de segurança e o handler escolhe a regra que casa com o **resultado estruturado** (BI-RADS, DNA-HPV, citologia Bethesda, colposcopia, FIT, achados de colonoscopia, Lung-RADS, PSA).
4. Grava em `exames`: classificação (normal · controle · complementar · investigação · especializado · pendente), nível (verde · amarelo · laranja · vermelho · cinza), próxima ação, data, `regra_id`/`regra_versao`.
5. Se a regra abre pendência (§50), grava em `pendencias`; ao registrar o exame que a resolve (`resolve_exame_id`), o trigger `exames_fecha_pendencia` a encerra (§51).
6. Agenda lembretes (seção 4).

### Condutas por resultado
| Programa | Resultado | Classificação / nível | Próxima ação | Fonte |
|---|---|---|---|---|
| Mama | BI-RADS 0 | pendente / cinza | complementação | ACR BI-RADS |
| Mama | BI-RADS 1–2 | normal / verde | mamografia em 12 meses | CBR 2023 |
| Mama | BI-RADS 3 | controle / amarelo | 6 meses (ou o intervalo do laudo) | ACR BI-RADS (C-009, a validar) |
| Mama | BI-RADS 4 | investigação / laranja | biópsia — pendência | ACR |
| Mama | BI-RADS 5–6 | especializado / vermelho | encaminhamento; 6 sai do rastreamento | ACR |
| Colo | DNA-HPV negativo | normal / verde | 5 anos (3 se imunossuprimida) | INCA Rec. 18 / 39 |
| Colo | HPV 16/18 | investigação / laranja | colposcopia — pendência | Rec. 19 |
| Colo | HPV outros, sem reflexa | pendente / cinza | aguardar citologia reflexa | Rec. 20 |
| Colo | HPV outros + reflexa negativa | controle / amarelo | novo DNA-HPV em 12 meses; positivo aos 24 meses → colposcopia | Rec. 22–25 |
| Colo | HPV outros + imunossuprimida | investigação / laranja | colposcopia | Rec. 40 |
| Colo | reflexa ≥ ASC-US ou insatisfatória | investigação / laranja | colposcopia | Rec. 20 |
| Colo | citologia isolada ASC-US/LSIL, insatisfatória | controle / amarelo · pendente | repetição por idade — **linhas marcadas "validar no texto" da INCA 2016** | C-003 (pendência do acervo) |
| Colo | ASC-H, HSIL, AGC, AIS, suspeita | especializado / vermelho | colposcopia/encaminhamento | INCA |
| Colo | colposcopia normal / NIC 1 | controle / amarelo | 12 meses | INCA |
| Colo | NIC 2/3, AIS, carcinoma | especializado / vermelho | tratamento; depois 25 anos de seguimento (Rec. 14) | INCA |
| Colorretal | FIT negativo | normal / verde | 2 anos | CONITEC Rec. 7 |
| Colorretal | FIT positivo | investigação / laranja | colonoscopia — pendência; novo FIT bloqueado | Rec. 8 |
| Colorretal | colonoscopia completa e de qualidade, normal | normal / verde | 10 anos, **sem FIT no intervalo** | CONITEC (texto) |
| Colorretal | colonoscopia incompleta / pólipos aguardando histopatológico | pendente / cinza | complementar | §47 |
| Colorretal | pólipo hiperplásico | normal / verde | 10 anos | §47 |
| Colorretal | adenoma / adenoma avançado | controle / amarelo (intervalo do laudo) ou individualizada | conforme laudo | §47 |
| Colorretal | massa suspeita / carcinoma | especializado / vermelho | encaminhamento | §47 |
| Pulmão | Lung-RADS 1–2 | normal / verde | TCBD em 12 meses (a partir da data do exame, nota 2) | ACR v2022 |
| Pulmão | Lung-RADS 3 | controle / amarelo | 6 meses | ACR v2022 |
| Pulmão | Lung-RADS 4A | investigação / laranja | 3 meses, PET/CT opcional | ACR v2022 |
| Pulmão | Lung-RADS 4B/4X | especializado / vermelho | TC diagnóstica/PET/biópsia | ACR v2022 |
| Pulmão | Lung-RADS 0 | pendente / cinza | comparar com prévio ou TCBD em 1–3 meses | ACR v2022 |
| Próstata | PSA dentro da referência do laboratório | normal / verde | data de repetição informada pelo paciente (definida pelo médico) | SBU (C-008), §49 |
| Próstata | PSA acima da referência | investigação / laranja | "avaliação médica recomendada" | §49 |

### Princípio de linguagem (§25, §43)
Mensagens orientam e remetem ao profissional; nunca "você tem câncer" nem "seu PSA indica câncer". A cor sinaliza a urgência da próxima ação, não um diagnóstico.

---

## 3. Sinais de alerta (§52)
Lista por câncer em `conteudo/<programa>.ts`. "Tenho este sintoma" grava em `sintomas_alarme`; enquanto houver sintoma não resolvido, o programa mostra orientação de avaliação médica **independentemente do calendário** (hierarquia §66) e a Home exibe item vermelho.

## 4. Lembretes (§38)
`src/core/rastreando/lembretes.ts`: para cada data de próxima ação, grava em `lembretes` e agenda notificação local em **60, 30 e 7 dias antes, no dia e 7 dias depois** (se o exame ainda não foi registrado). Um exame novo do mesmo programa cancela o calendário anterior.

## 5. Pendências (§50–§51)
Tela lista pendências abertas com o exame de origem e a ação esperada. Resolvem-se ao registrar o exame correspondente (trigger) ou manualmente com justificativa.

## 6. Dashboard, histórico e Home (§37, §39, §56)
"Seus rastreamentos" (cards por programa com status), histórico por câncer (linha do tempo de exames com classificação) e itens na Home via `montarItensHoje`: pendência aberta = laranja/vermelho; exame próximo = amarelo; atrasado = laranja; sintoma de alarme = vermelho.

## Pendências de validação (não bloqueiam)
- INCA 2016 (citologia): validar as 4 linhas de ASC-US/LSIL/insatisfatória por idade.
- Substituir o relatório preliminar da CONITEC pela versão final quando publicada.
- Localizar o ato normativo do MS (set/2025) sobre mamografia no SUS.
- C-009 (BI-RADS 3 = 6 meses) marcado "a validar" no atlas.
