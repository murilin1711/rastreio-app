# NERO — Fase 0: Fundação — Spec Técnica

**Data:** 14/09/2026 · **Status:** em revisão pelo Murilo
**Base:** `docs/nero/01-ESPECIFICACAO-NERO.md` (§28, §41, §53–§56, §59, §64–§66, §89) · Decisões D-001 a D-006 em `docs/nero/02-DECISOES.md`

---

## 1. Objetivo

Transformar o app Rastreando (módulo único, Firebase) na plataforma NERO (multi-módulo, Supabase), entregando o alicerce que todos os módulos usam:

1. Backend Supabase (Auth + Postgres com RLS + Storage) substituindo o Firebase por completo.
2. **Perfil de Saúde único**, cadastrado uma vez e reutilizado por todos os módulos.
3. **Motor de regras clínicas** em TypeScript puro, testado, com a hierarquia de segurança do §66 e a elegibilidade do §28 — pronto para receber as árvores por câncer na Fase 1.
4. **Home do NERO** com os 4 módulos (Rastreando ativo; Coração & Metabolismo e Saúde & Bem-estar como "em breve"; Minha Saúde com Perfil e Medicamentos).
5. Código reorganizado (rotas finas em `app/`, lógica em `src/`), Expo atualizado, design system consolidado com a identidade do Nero.

**Critério de pronto (uma frase):** abrir o app no celular, cadastrar, preencher o perfil curto, ver a Home do NERO com os 4 módulos e o Nero, entrar em Minha Saúde e editar perfil e medicamentos — tudo lendo e gravando no Supabase — com o motor de regras estruturado e coberto por testes.

## 2. Fora de escopo (Fase 0)

Notificações push · geração de PDF · gráficos · upload de anexos (Storage fica configurado, não usado) · offline com sincronização · Nero em 3D · qualquer tela de Coração/Bem-estar além do card "em breve" · árvores de decisão por câncer (Fase 1) · migração das telas do Rastreando ao novo banco (Fase 1 — na Fase 0 elas continuam existindo, mas o card Rastreando da Home leva a uma tela-ponte "módulo em atualização" até a Fase 1 religá-las) · lado profissional (D-004, removido).

## 3. Arquitetura

```
┌──────────────── App (Expo / React Native / TypeScript) ────────────────┐
│  app/            rotas finas (Expo Router)                              │
│  src/ui/         design system (Poppins, paleta Nero, componentes)      │
│  src/modules/*   lógica + componentes por módulo                        │
│  src/core/perfil        leitura/escrita do Perfil de Saúde (hooks)      │
│  src/core/regras        MOTOR DE REGRAS — TS puro, sem UI, sem banco    │
│  src/core/supabase      cliente, tipos gerados, tradução de erros       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ supabase-js (anon key + JWT do usuário)
┌────────────────────────────────▼────────────────────────────────────────┐
│  Supabase (região São Paulo)                                            │
│  Auth (e-mail/senha) · Postgres (RLS em toda tabela por usuário)        │
│  Storage (bucket `laudos`, privado — configurado, uso na Fase 1/3)      │
│  supabase/migrations/*.sql versionado no repositório                    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Regra de ouro:** `src/core/regras` não importa nada de `src/ui`, `app/` ou `src/core/supabase`. Recebe objetos simples, devolve objetos simples.

### 3.1 Estrutura de pastas

```
app/
  _layout.tsx                 provider de sessão + fontes + redirecionamento
  index.tsx                   decide: onboarding / login / perfil-inicial / home
  (auth)/
    onboarding.tsx
    login.tsx
    cadastro.tsx
  perfil-inicial.tsx          formulário curto pós-cadastro (fora das tabs, exige sessão)
  (app)/
    _layout.tsx               Tabs: Home · Rastreando · Minha Saúde
    index.tsx                 Home do NERO
    rastreando/
      index.tsx               tela-ponte "módulo em atualização" (Fase 1 substitui)
    minha-saude/
      index.tsx               lista: Meu Perfil · Meus Medicamentos · (em breve) Exames, Documentos, Linha do tempo, Relatórios
      perfil.tsx              editar Perfil de Saúde completo
      antecedentes.tsx        lista + adicionar/editar antecedente familiar
      medicamentos.tsx        lista + adicionar/editar/desativar
src/
  core/
    supabase/
      client.ts               createClient com .env + AsyncStorage
      database.types.ts       gerado: `supabase gen types typescript`
      erros.ts                traduz PostgrestError/AuthError → mensagem pt-BR
    sessao/
      SessaoProvider.tsx      onAuthStateChange, usuário atual, loading
    perfil/
      tipos.ts                PerfilSaude, AntecedenteFamiliar (tipos de domínio)
      repositorio.ts          get/upsert perfil, CRUD antecedentes
      usePerfil.ts            hook com cache em memória
      calculos.ts             idade, IMC, maçosAno (puros, testados)
    medicacoes/
      tipos.ts · repositorio.ts · useMedicacoes.ts
    regras/                   ver §5
  modules/
    home/                     HomeHoje.tsx, CardModulo.tsx, montarItensHoje.ts
    minha-saude/              formulários (PerfilForm, AntecedenteForm, MedicacaoForm)
    rastreando/               vazio na Fase 0 (recebe telas migradas na Fase 1)
  ui/
    theme.ts                  tokens (cores, tipografia, espaçamento, raio, sombra)
    components/               ScreenHeader, InternalHeader, ListItem, Card, Button, Input, Select, StatusBadge, EmBreveBadge, NeroImage
assets/images/nero/           logo, nero-base.png, nero-rastreando.png, nero-cardio.png, nero-bem-estar.png, nero-minha-saude.png
supabase/
  config.toml
  migrations/
    0001_perfil.sql · 0002_exames_pendencias.sql · 0003_medidas.sql · 0004_medicacoes_lembretes.sql · 0005_regras_clinicas.sql · 0006_rls.sql · 0007_storage.sql
  seed/regras_clinicas.sql    vazio na Fase 0 (Fase 1 preenche)
  tests/rls.test.sql          pgTAP: isolamento entre usuários
```

O que sai: `config/firebase-config.js`, dependência `firebase`, `app/Home/TelaDeHomeProfissional*`, `app/RastrearMeuPaciente/**`, `components/ui/CrabLottie.tsx` e assets do caranguejo. As telas de `app/PerfilIndividual/**` e `app/ProximosExames` ficam no repositório até a Fase 1 (sem rota ativa a partir da Home).

### 3.2 Expo

Atualizar do SDK 51 para o **SDK estável mais recente na data de execução** (`npx expo install expo@latest` + `npx expo install --fix`), antes de qualquer código novo. Remover dependências mortas (`react-native-datepicker`, `react-native-elements`, `expo-app-loading`, `@react-navigation/stack` — Expo Router já traz navegação). Verificar que o app abre no Expo Go antes de seguir.

## 4. Modelo de dados

Convenções: snake_case; `id uuid default gen_random_uuid()`; `user_id uuid references auth.users(id) on delete cascade` em toda tabela do paciente; `created_at/updated_at timestamptz`; enumerações como `text` + `check`; contexto variável em `jsonb`. Toda tabela com `user_id` tem índice em `user_id` e RLS.

### 4.1 `perfil_saude` (1 por usuário)

| coluna | tipo | obs |
|---|---|---|
| user_id | uuid PK, FK auth.users | |
| nome | text not null | |
| data_nascimento | date not null | idade calculada, nunca armazenada |
| sexo_nascimento | text check in ('feminino','masculino') | §28 |
| possui_colo_utero | boolean | null = não perguntado; default true se feminino |
| histerectomia | boolean | |
| altura_cm | numeric(5,1) | peso vive em `medidas` (varia no tempo) |
| tabagismo_status | text check in ('nunca','ex','atual') | |
| cigarros_dia | integer | |
| anos_fumando | numeric(4,1) | |
| data_cessacao | date | só se 'ex' |
| tem_diabetes | boolean · tem_hipertensao · tem_doenca_renal · tem_imunossupressao · tem_hiv · tem_dii | booleans (null = não informado) |
| historico_cancer_pessoal | jsonb | `[{tipo, ano}]` |
| lesoes_precursoras | jsonb | `[{tipo, ano}]` |
| doencas_geneticas | jsonb | `[{nome}]` (Lynch, PAF, BRCA…) |
| radioterapia_toracica | boolean | §32 |
| tipo_usuario | text default 'paciente' | mantido para futuro (D-004) |
| perfil_inicial_completo | boolean default false | controla redirecionamento pós-cadastro |
| created_at, updated_at | timestamptz | trigger `set_updated_at` |

Derivados em código (`calculos.ts`): `idade`, `macosAno = (cigarros_dia/20) * anos_fumando`, `anosDesdeCessacao`.

### 4.2 `antecedentes_familiares`

`id, user_id, parentesco text check in ('mae','pai','irma_o','filha_o','avo_a','tia_o','outro'), grau text check in ('primeiro','segundo','outro'), condicao text` (mama, ovario, colorretal, prostata, pulmao, colo_utero, dcv_prematura, outro)`, idade_diagnostico integer, observacao text, created_at`. Índice `(user_id, condicao)`.

### 4.3 `exames` (criada agora, usada na Fase 1+)

| coluna | tipo |
|---|---|
| id, user_id | |
| tipo | text (mamografia, dna_hpv, citologia, fit, colonoscopia, tcbd, psa, ldl, hba1c, ecg, …) |
| categoria | text check in ('rastreamento','laboratorial','cardiologico','imagem','outro') |
| modulo | text check in ('rastreando','cardio','bem_estar','geral') |
| programa | text nullable (mama, colo_utero, colorretal, pulmao, prostata) |
| data_realizacao | date not null |
| resultado | jsonb not null default '{}' — estruturado por tipo (`{"birads":3}`, `{"hpv":"16"}`, `{"valor":87,"unidade":"mg/dL"}`) |
| laudo_texto, instituicao, solicitante, observacoes | text |
| anexos | jsonb default '[]' — `[{path, tipo}]` no bucket `laudos` |
| classificacao | text check in ('normal','controle','complementar','investigacao','especializado','pendente') |
| nivel_alerta | text check in ('verde','amarelo','laranja','vermelho','cinza') |
| proxima_acao | text |
| data_proxima_acao | date |
| abre_pendencia | boolean default false |
| regra_id | uuid FK regras_clinicas nullable |
| regra_versao | text |
| resolve_exame_id | uuid FK exames nullable — §51 |
| created_at, updated_at | |

Índices: `(user_id, data_realizacao desc)`, `(user_id, programa)`, `resolve_exame_id`, `regra_id`.

### 4.4 `pendencias`

`id, user_id, exame_origem_id FK exames not null, programa text, descricao text, nivel_alerta text, status text check in ('aberta','resolvida','cancelada') default 'aberta', exame_resolucao_id FK exames, aberta_em timestamptz, resolvida_em timestamptz`. Índice parcial `(user_id) where status = 'aberta'`.

### 4.5 `medidas` (PA, glicemia, peso, cintura, sono…)

`id, user_id, tipo text check in ('pa','glicemia','peso','cintura','quadril','composicao','sono','fc'), medido_em timestamptz not null, valores jsonb not null` (`{"pas":128,"pad":78,"fc":68}` / `{"mgdl":103}` / `{"kg":67.2}`)`, contexto jsonb default '{}'` (braço, posição, momento, medicação, sintomas)`, sessao_id uuid FK mrpa_sessoes nullable, observacao text, created_at`. Índice `(user_id, tipo, medido_em desc)`.

`mrpa_sessoes`: `id, user_id, inicio date, fim date, dias_previstos int, status text check in ('em_andamento','concluida','cancelada')`.

### 4.6 `medicacoes`

`id, user_id, nome text not null, dose text, horarios jsonb default '[]'` (`["08:00","20:00"]`)`, desde date, ate date, prescritor text, ativa boolean default true, observacao text, created_at, updated_at`. Índice parcial `(user_id) where ativa`.

### 4.7 `lembretes`

`id, user_id, origem_tipo text check in ('exame','medida','medicacao','perfil','sistema'), origem_id uuid, agendado_para timestamptz not null, titulo text, mensagem text, status text check in ('pendente','enviado','lido','cancelado') default 'pendente', created_at`. Índice `(user_id, agendado_para) where status = 'pendente'`.

### 4.8 `regras_clinicas` (do sistema, sem `user_id`) — §65

`id uuid, modulo text, programa text, exame_tipo text, condicao jsonb` (critério de entrada, ex. `{"birads":1}` ou `{"idade_min":50,"idade_max":75}`)`, classificacao text, nivel_alerta text, proxima_acao text, intervalo_meses integer, mensagem_paciente text, mensagem_profissional text, fonte text, ano integer, versao text, revisada_em date, ativa boolean default true, created_at`. Índice `(modulo, programa, exame_tipo) where ativa`.

### 4.9 Segurança

```sql
alter table public.perfil_saude enable row level security;
create policy perfil_saude_owner on public.perfil_saude
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
-- idem para antecedentes_familiares, exames, pendencias, medidas, mrpa_sessoes, medicacoes, lembretes

alter table public.regras_clinicas enable row level security;
create policy regras_leitura on public.regras_clinicas
  for select to authenticated using (ativa);
-- escrita: só via service_role (painel/CLI), nenhuma policy de insert/update para authenticated
```

Trigger `handle_new_user` em `auth.users` cria a linha de `perfil_saude` com `nome` vindo de `raw_user_meta_data`. Bucket `laudos` privado com policy por prefixo `user_id/`. Chaves em `.env` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`), `.env` no `.gitignore`, `.env.example` versionado.

## 5. Motor de regras (`src/core/regras/`)

```
regras/
  tipos.ts             contratos abaixo
  seguranca.ts         aplicarHierarquiaSeguranca()  §66
  elegibilidade.ts     avaliarElegibilidade()        §28
  classificar.ts       classificarExame()            §42/§53 — orquestra
  programas/
    mama.ts · colo.ts · colorretal.ts · pulmao.ts · prostata.ts   (Fase 1)
  __tests__/
```

### 5.1 Contratos

```ts
export type Programa = 'mama' | 'colo_utero' | 'colorretal' | 'pulmao' | 'prostata';
export type NivelAlerta = 'verde' | 'amarelo' | 'laranja' | 'vermelho' | 'cinza';
export type Classificacao = 'normal' | 'controle' | 'complementar' | 'investigacao' | 'especializado' | 'pendente';
export type StatusRastreamento =
  | 'indicado' | 'proximo_de_iniciar' | 'nao_indicado_no_momento' | 'avaliacao_individualizada'
  | 'acompanhamento_medico' | 'em_dia' | 'exame_proximo' | 'exame_atrasado';

export interface PerfilRegras {            // subconjunto do perfil, já derivado
  idade: number; sexoNascimento: 'feminino' | 'masculino';
  possuiColoUtero: boolean | null; tabagismo: { status: 'nunca'|'ex'|'atual'; macosAno: number | null; anosDesdeCessacao: number | null };
  condicoes: { diabetes?: boolean; dii?: boolean; imunossupressao?: boolean; hiv?: boolean; doencaRenal?: boolean };
  historicoCancerPessoal: string[]; lesoesPrecursoras: string[]; doencasGeneticas: string[]; radioterapiaToracica: boolean;
  antecedentes: { condicao: string; grau: string; idadeDiagnostico: number | null }[];
}

export interface ExameEntrada { tipo: string; programa: Programa; dataRealizacao: string; resultado: Record<string, unknown>; }

export interface ContextoAvaliacao {
  sintomasAlarme: string[];                  // registrados pelo usuário para o programa
  pendenciasAbertas: { programa: Programa; exameOrigemId: string }[];
  emAcompanhamentoEspecializado: Programa[];
  historicoExames: (ExameEntrada & { id: string; classificacao: Classificacao })[];
}

export interface RegraParametros {          // linha de regras_clinicas
  id: string; versao: string; fonte: string; ano: number;
  condicao: Record<string, unknown>; classificacao: Classificacao; nivelAlerta: NivelAlerta;
  proximaAcao: string; intervaloMeses: number | null; mensagemPaciente: string;
}

export interface ResultadoClassificacao {   // §53
  classificacao: Classificacao; nivelAlerta: NivelAlerta;
  proximaAcao: string; dataProximaAcao: string | null;
  abrePendencia: boolean; mensagemPaciente: string;
  regraId: string | null; regraVersao: string | null;
  motivoSeguranca?: 'sintoma_alarme' | 'pendencia_aberta' | 'acompanhamento_especializado';
}

export interface ResultadoElegibilidade {
  programa: Programa; status: StatusRastreamento; mensagem: string;
  regraId: string | null; regraVersao: string | null; proximaData: string | null;
}
```

### 5.2 Hierarquia de segurança — `aplicarHierarquiaSeguranca(programa, contexto)`

Retorna `null` (nada bloqueia) ou um `ResultadoClassificacao` parcial com `motivoSeguranca`, na ordem: sintoma de alarme → pendência aberta → acompanhamento especializado. `classificarExame` e `avaliarElegibilidade` chamam-na **antes** de qualquer cálculo de calendário. Sintoma de alarme nunca é sobrescrito por regra de rastreamento (§52, §66).

### 5.3 Elegibilidade — `avaliarElegibilidade(perfil, programa, regras, contexto)`

Fase 0 implementa a estrutura genérica: filtro anatômico (colo do útero só se `possuiColoUtero`; próstata só se masculino; mama conforme regra), faixa etária a partir de `condicao.idade_min/idade_max` da regra, "próximo de iniciar" quando faltam ≤ 24 meses, e bloqueio pela hierarquia de segurança. Fatores modificadores por programa (Lynch, BRCA, história familiar…) entram na Fase 1 em `programas/*.ts`, cada um retornando `'avaliacao_individualizada'` quando presente.

### 5.4 Testes (Jest, TS puro — rodam sem Expo)

Fase 0 cobre: hierarquia (3 casos + caso "nada bloqueia"), elegibilidade genérica (fora da faixa / dentro / próximo de iniciar / anatomicamente não aplicável / bloqueado por sintoma), `calculos.ts` (idade em aniversário, maços-ano, IMC, anos desde cessação). Fase 1 adiciona um teste por linha dos §44–§49.

## 6. Telas e fluxo

```
index → sem sessão → onboarding (1ª vez) → login | cadastro
      → com sessão e perfil_inicial_completo=false → perfil-inicial
      → com sessão e perfil completo → (app)/index (Home)
```

**Cadastro:** nome, e-mail, senha (mín. 8). Sem CPF na Fase 0 (não há uso; menos dado sensível). Cria usuário no Auth; trigger cria `perfil_saude`.

**Perfil inicial (6 passos, um por tela, barra de progresso):** data de nascimento → sexo ao nascimento → (se feminino) possui colo do útero / histerectomia → altura e peso atual (peso grava em `medidas`) → tabagismo (status; se ex/atual: cigarros/dia, anos; se ex: quando parou) → "tem alguma destas condições?" (diabetes, hipertensão, doença renal, imunossupressão/HIV, doença inflamatória intestinal, nenhuma). Ao final: `perfil_inicial_completo = true` → Home. Botão "pular por agora" só nos passos 4–6.

**Home (`(app)/index`):** saudação + Nero; bloco **Hoje** com itens de `montarItensHoje()` (Fase 0: "Complete seu perfil de saúde" se houver campos nulos relevantes; "Cadastre seus medicamentos" se lista vazia — cada item navega); **4 cards** — Saúde & Bem-estar (em breve), Coração & Metabolismo (em breve), Rastreando (ativo → tela-ponte), Minha Saúde (→ lista). Cards "em breve" não navegam e mostram `EmBreveBadge`.

**Tabs:** Home · Rastreando · Minha Saúde (ícones Ionicons; Cardio e Bem-estar entram quando existirem).

**Minha Saúde:** lista `ListItem`; Meu Perfil (formulário completo por seções: dados básicos, tabagismo, condições, histórico pessoal de câncer/lesões, doenças genéticas, radioterapia torácica), Antecedentes familiares (lista + form), Meus Medicamentos (lista ativos/inativos + form), itens "em breve": Meus Exames, Meus Documentos, Linha do tempo, Relatórios. Sair (logout).

**Visual:** tokens em `src/ui/theme.ts` — primária `#0f2d63` (mantida), secundária azul-aço `#5B8DB8`, fundo `#F3F0EA` (bege do Nero, clareado), superfície branca, alerta verde/amarelo/laranja/vermelho/cinza com nomes semânticos para os níveis do §43. Poppins mantida. Componente `NeroImage variant="base|rastreando|cardio|bem_estar|minha_saude"` usa os PNGs (placeholder = `nero-base.png` até as variantes existirem).

## 7. Tratamento de erros

`src/core/supabase/erros.ts`: mapeia códigos comuns (`invalid_credentials`, `email_exists`, `23505`, `42501`, `network`) para mensagens em português; tudo mais vira "Não foi possível concluir. Tente novamente." + log em console no dev. Repositórios lançam `ErroNero { mensagemUsuario, causa }`; telas mostram em `Alert` ou inline. Sem rede: `SessaoProvider` expõe `online` (NetInfo) e as telas de formulário desabilitam "Salvar" com aviso.

## 8. Testes e verificação

| Camada | Como | Fase 0 |
|---|---|---|
| Motor de regras e cálculos | Jest, TS puro | obrigatório, antes do código (TDD) |
| RLS | pgTAP em `supabase/tests`, `supabase test db` | 1 teste por tabela: usuário A não vê linha de B |
| Repositórios | Jest com Supabase local (`supabase start`) | perfil upsert, antecedentes CRUD, medicações CRUD |
| Telas | manual no celular (Expo Go), checklist | cadastro → perfil inicial → home → editar perfil → logout/login mantém dados |

## 9. Ordem sugerida de implementação (base para o plano)

1. Atualizar Expo; app abre. Commit.
2. Reorganizar pastas (`src/`, `app/(auth)`, `app/(app)`), mover design system, remover Firebase e lado profissional. App abre com tela vazia. Commit.
3. Supabase: projeto, CLI, migrações 0001–0007, tipos gerados, testes RLS. Commit.
4. `src/core/supabase` + `SessaoProvider` + login/cadastro/onboarding. Commit.
5. `calculos.ts` + motor de regras (tipos, segurança, elegibilidade) com testes. Commit.
6. Perfil: repositório, hook, perfil-inicial (6 passos), Minha Saúde → Meu Perfil e Antecedentes. Commit.
7. Medicamentos. Commit.
8. Home: Hoje + 4 cards + tabs + tela-ponte do Rastreando + identidade Nero. Commit.
9. Checklist manual no celular; atualizar `docs/nero/00-ROADMAP.md` e `ESTADO_ATUAL.md`.

## 10. Riscos

- **Upgrade do Expo quebra libs antigas** (`react-native-datepicker`, `react-native-elements`): mitigação — removê-las no passo 2; datas via `@react-native-community/datetimepicker`.
- **Variantes do Nero por módulo ainda não existem**: placeholder com o PNG base; não bloqueia.
- **Telas antigas do Rastreando ficam órfãs até a Fase 1**: aceito; tela-ponte deixa claro para o usuário de teste.
