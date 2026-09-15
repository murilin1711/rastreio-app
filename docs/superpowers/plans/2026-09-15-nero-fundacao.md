# NERO Fase 0 — Fundação — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir Firebase por Supabase, criar o Perfil de Saúde único, o motor de regras clínicas testado e a Home do NERO com 4 módulos, mantendo o app abrindo no celular ao fim de cada tarefa.

**Architecture:** Rotas finas em `app/` (Expo Router: grupo `(auth)`, `perfil-inicial`, grupo `(app)` com tabs). Lógica em `src/core` (supabase, sessão, perfil, medicações, regras), `src/modules` (home, minha-saude) e `src/ui` (design system). Banco Postgres no Supabase com RLS em toda tabela do paciente; SQL versionado em `supabase/migrations`. `src/core/regras` é TypeScript puro sem importar UI nem banco.

**Tech Stack:** Expo SDK 57 · React Native · TypeScript strict · Expo Router · @supabase/supabase-js 2.x · Supabase CLI 2.75 (local via Docker) · Jest (jest-expo) · pgTAP.

**Spec:** `docs/superpowers/specs/2026-09-14-nero-fundacao-design.md`

## Global Constraints

- Idioma de toda UI, mensagens e comentários: português do Brasil, com acentos.
- `src/core/regras/**` não importa nada de `react`, `react-native`, `expo*`, `@supabase/*`, `src/ui`, `app/`.
- Toda tabela com `user_id` tem: índice em `user_id`, `enable row level security`, policy `for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)`.
- Identificadores SQL em snake_case minúsculo; enumerações como `text` + `check`; datas/horas em `timestamptz`; datas civis em `date`.
- Segredos só em `.env` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`); `.env` no `.gitignore`; `.env.example` versionado.
- Nada de Firebase, caranguejo ou lado profissional permanece ativo ao final da Fase 0.
- Cores dos níveis de alerta (§43): verde `#16a34a`, amarelo `#d97706`, laranja `#ea580c`, vermelho `#dc2626`, cinza `#6b7280`.
- Fonte Poppins mantida; primária `#0f2d63`; fundo `#F3F0EA`; azul-aço `#5B8DB8`.
- Commits pequenos, em português, com rodapé:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` e `Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY`.
- Branch de trabalho: `nero-fundacao` (criada a partir de `desenvolvimento-2`).
- **Antes de escrever qualquer tela ou componente visual (Tasks 2, 4, 8, 9, 10, 11), invocar a skill `frontend-design`** — pedido do Murilo.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/ui/theme.ts` | tokens (Colors, Typography, Spacing, Radius, Shadows, Alerta) |
| `src/ui/components/*.tsx` | Button, Input, Card, ListItem, InternalHeader, StatusBadge, EmBreveBadge, NeroImage, Select, ProgressBar |
| `src/core/supabase/client.ts` | instância única do supabase-js |
| `src/core/supabase/database.types.ts` | tipos gerados pelo CLI |
| `src/core/supabase/erros.ts` | `ErroNero`, `traduzirErro()` |
| `src/core/sessao/SessaoProvider.tsx` | contexto de sessão (`useSessao`) |
| `src/core/perfil/tipos.ts` | `PerfilSaude`, `AntecedenteFamiliar` |
| `src/core/perfil/calculos.ts` | `calcularIdade`, `calcularMacosAno`, `calcularIMC`, `anosDesde` |
| `src/core/perfil/repositorio.ts` | `obterPerfil`, `salvarPerfil`, CRUD antecedentes |
| `src/core/perfil/usePerfil.ts` | hook |
| `src/core/medicacoes/{tipos,repositorio,useMedicacoes}.ts` | medicações |
| `src/core/regras/{tipos,seguranca,elegibilidade,classificar}.ts` | motor |
| `src/modules/home/*` | `CardModulo`, `montarItensHoje` |
| `src/modules/minha-saude/*` | formulários |
| `app/**` | rotas |
| `supabase/migrations/000N_*.sql` | schema |
| `supabase/tests/rls.test.sql` | pgTAP |

---

## Task 1: Branch, upgrade do Expo para SDK 57 e limpeza de dependências mortas

**Files:**
- Modify: `package.json`, `app.json`
- Delete: nenhum ainda

**Interfaces:**
- Produces: projeto abrindo no Expo Go com SDK 57; `npm test` funcional (jest-expo 57).

- [ ] **Step 1: Criar branch**

```bash
cd "/Users/muriloroizpovoa/Desktop/App de Rastreio/app-de-rastreio"
git checkout -b nero-fundacao
```

- [ ] **Step 2: Remover dependências mortas**

```bash
npm uninstall react-native-datepicker @types/react-native-datepicker react-native-elements expo-app-loading @react-navigation/stack react-native-image-picker react-native-masked-text email-validator @dotlottie/react-player metro rastreando-app
```
(`rastreando-app: file:` é auto-referência inválida; `metro` não deve ser dependência direta.)

- [ ] **Step 3: Atualizar Expo**

```bash
npx expo install expo@^57.0.0
npx expo install --fix
npm install --save-dev jest-expo@~57.0.0 typescript@~5.9 @types/react@~19
```
Se `expo install --fix` reportar pacotes sem versão compatível, remover e reinstalar com `npx expo install <pacote>`.

- [ ] **Step 4: Ajustar `app.json`**

Trocar `"name": "rastreando-app"` → `"name": "NERO"`, `"slug": "nero"`, `"scheme": "nero"`, `"splash.backgroundColor": "#F3F0EA"`, `"android.adaptiveIcon.backgroundColor": "#F3F0EA"`. Manter ícones atuais por enquanto.

- [ ] **Step 5: Verificar que abre**

```bash
npx expo-doctor
npx expo start -c
```
Abrir no Expo Go (iOS ou Android). Esperado: onboarding antigo aparece sem erro vermelho. Se `expo-doctor` apontar `react-native-reanimated`/`lottie-react-native` incompatíveis, `npx expo install react-native-reanimated lottie-react-native`.

- [ ] **Step 6: Verificar Jest**

```bash
npx jest --ci components/__tests__ 2>&1 | tail -5
```
Esperado: teste `ThemedText` passa (ou é removido em Task 2 — se falhar só por snapshot, aceitar com `-u`).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json app.json
git commit -m "chore: atualizar Expo para SDK 57 e remover dependências mortas

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 2: Reorganizar pastas, mover design system para `src/ui`, remover Firebase, caranguejo e lado profissional

**Files:**
- Create: `src/ui/theme.ts`, `src/ui/components/{Button,Input,Card,ListItem,InternalHeader,StatusBadge,ProgressBar,EmBreveBadge,NeroImage}.tsx`, `src/ui/index.ts`
- Modify: `tsconfig.json`, `.gitignore`, `app/_layout.tsx`, `app/index.tsx`
- Delete: `config/firebase-config.js`, `components/`, `constants/`, `hooks/`, `app/Home/`, `app/RastrearMeuPaciente/`, `app/Login/`, `app/Cadastro/`, `app/paginaInicial.tsx`, `app/MarcarConsulta/`, `assets/lottie/{crab-float,dancing-crab}.*`, `assets/lottie/LOGIN.json`
- Keep (órfãs até Fase 1): `app/PerfilIndividual/**`, `app/ProximosExames/**`

**Interfaces:**
- Produces: `import { Colors, Typography, Spacing, Radius, Shadows, Alerta } from '@ui/theme'`; componentes via `@ui/components/<Nome>`.

- [ ] **Step 1: Aliases no `tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"],
      "@ui/*": ["./src/ui/*"],
      "@core/*": ["./src/core/*"],
      "@modules/*": ["./src/modules/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 2: Criar `src/ui/theme.ts`**

```ts
import { Platform } from 'react-native';

export const Colors = {
  primary:       '#0f2d63',
  primaryLight:  '#1a3a7a',
  accent:        '#5B8DB8',
  background:    '#F3F0EA',
  surface:       '#ffffff',
  surfaceAlt:    '#f5f7fc',
  border:        '#e3ddd3',
  textPrimary:   '#0f2d63',
  textSecondary: '#6b7fa3',
  textMuted:     '#a8b8d0',
  success:       '#16a34a',
  warning:       '#d97706',
  danger:        '#dc2626',
  white:         '#ffffff',
} as const;

/** Cores semânticas dos níveis de alerta clínico (§43). */
export const Alerta = {
  verde:    { bg: '#dcfce7', fg: '#16a34a' },
  amarelo:  { bg: '#fef3c7', fg: '#d97706' },
  laranja:  { bg: '#ffedd5', fg: '#ea580c' },
  vermelho: { bg: '#fee2e2', fg: '#dc2626' },
  cinza:    { bg: '#f3f4f6', fg: '#6b7280' },
} as const;
export type NivelAlertaUI = keyof typeof Alerta;

export const Typography = {
  display:    { fontFamily: 'Poppins-ExtraBold', fontSize: 28, letterSpacing: -0.5 },
  title:      { fontFamily: 'Poppins-Bold',      fontSize: 20 },
  heading:    { fontFamily: 'Poppins-Bold',      fontSize: 16 },
  subheading: { fontFamily: 'Poppins-SemiBold',  fontSize: 14 },
  body:       { fontFamily: 'Poppins-Regular',   fontSize: 14, lineHeight: 22 },
  caption:    { fontFamily: 'Poppins-Regular',   fontSize: 12 },
  label:      { fontFamily: 'Poppins-SemiBold',  fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' as const },
} as const;

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const Radius  = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const Shadows = {
  card: Platform.select({
    ios: { shadowColor: '#0f2d63', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 10 },
    android: { elevation: 4 },
  }),
  floating: Platform.select({
    ios: { shadowColor: '#0f2d63', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 16 },
    android: { elevation: 8 },
  }),
} as const;
```

- [ ] **Step 3: Mover componentes reaproveitáveis**

```bash
mkdir -p src/ui/components
git mv components/ui/Button.tsx components/ui/Input.tsx components/ui/Card.tsx components/ui/ListItem.tsx components/ui/InternalHeader.tsx components/ui/StatusBadge.tsx components/ui/ProgressBar.tsx src/ui/components/
```
Em cada arquivo movido, trocar `from '@/constants/Theme'` por `from '@ui/theme'`. Em `Card.tsx` trocar `backgroundColor: Colors.background` por `Colors.surface`. Em `InternalHeader.tsx` trocar `backgroundColor: Colors.background` por `'transparent'` e `backBtn` `backgroundColor: Colors.surface`. Em `Input.tsx` trocar `backgroundColor: Colors.background` por `Colors.surface`.

- [ ] **Step 4: Criar `src/ui/components/EmBreveBadge.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '@ui/theme';

export function EmBreveBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>EM BREVE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', backgroundColor: Colors.surfaceAlt, borderRadius: Radius.sm, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
  text:  { ...Typography.label, fontSize: 9, color: Colors.textMuted },
});
```

- [ ] **Step 5: Criar `src/ui/components/NeroImage.tsx`**

Copiar a referência como placeholder: `cp assets/images/nero/nero-referencia.jpeg assets/images/nero/nero-base.png` (substituir pelo PNG transparente quando o Murilo enviar).

```tsx
import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

export type NeroVariant = 'base' | 'rastreando' | 'cardio' | 'bem_estar' | 'minha_saude';

// Até existirem as variantes por módulo, todas apontam para a imagem base.
const fontes: Record<NeroVariant, number> = {
  base:        require('../../../assets/images/nero/nero-base.png'),
  rastreando:  require('../../../assets/images/nero/nero-base.png'),
  cardio:      require('../../../assets/images/nero/nero-base.png'),
  bem_estar:   require('../../../assets/images/nero/nero-base.png'),
  minha_saude: require('../../../assets/images/nero/nero-base.png'),
};

interface Props { variant?: NeroVariant; size?: number; style?: StyleProp<ImageStyle>; }

export function NeroImage({ variant = 'base', size = 96, style }: Props) {
  return <Image source={fontes[variant]} style={[{ width: size, height: size, resizeMode: 'contain' }, style]} accessibilityLabel="Nero, mascote do aplicativo" />;
}
```

- [ ] **Step 6: Criar `src/ui/index.ts`**

```ts
export * from './theme';
export { Button } from './components/Button';
export { Input } from './components/Input';
export { Card } from './components/Card';
export { ListItem } from './components/ListItem';
export { InternalHeader } from './components/InternalHeader';
export { StatusBadge } from './components/StatusBadge';
export { ProgressBar } from './components/ProgressBar';
export { EmBreveBadge } from './components/EmBreveBadge';
export { NeroImage } from './components/NeroImage';
```

- [ ] **Step 7: Remover o que sai**

```bash
git rm -r config components constants hooks app/Home app/RastrearMeuPaciente app/Login app/Cadastro app/MarcarConsulta app/paginaInicial.tsx
git rm assets/lottie/crab-float.json assets/lottie/dancing-crab.json assets/lottie/dancing-crab.lottie assets/lottie/LOGIN.json
npm uninstall firebase
```
Nas telas órfãs `app/PerfilIndividual/**` e `app/ProximosExames/**`, elas importam `@/config/firebase-config` e `@/constants/Theme` — **não corrigir agora**; renomear a pasta para tirá-las do roteador: `git mv app/PerfilIndividual legado/PerfilIndividual && git mv app/ProximosExames legado/ProximosExames`. Adicionar `legado/` ao `exclude` do `tsconfig.json`: `"exclude": ["legado", "node_modules"]`.

- [ ] **Step 8: `app/_layout.tsx` e `app/index.tsx` mínimos**

`app/_layout.tsx`:
```tsx
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular, 'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold, 'Poppins-Bold': Poppins_700Bold, 'Poppins-ExtraBold': Poppins_800ExtraBold,
  });
  useEffect(() => { if (fontsLoaded) SplashScreen.hideAsync(); }, [fontsLoaded]);
  if (!fontsLoaded) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`app/index.tsx` (provisório, substituído na Task 4):
```tsx
import { View, Text } from 'react-native';
import { Colors, Typography, NeroImage } from '@ui/index';

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
      <NeroImage size={160} />
      <Text style={{ ...Typography.display, color: Colors.primary, marginTop: 16 }}>NERO</Text>
    </View>
  );
}
```

- [ ] **Step 9: Verificar**

```bash
npx tsc --noEmit
npx expo start -c
```
Esperado: `tsc` sem erros; app mostra Nero + "NERO" em fundo bege.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor: mover design system para src/ui, remover Firebase, caranguejo e lado profissional

Telas antigas do Rastreando ficam em legado/ até a Fase 1.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 3: Supabase — projeto, migrações, RLS e testes pgTAP

**Pré-requisito humano:** o Murilo cria o projeto no Supabase (região South America — São Paulo) e fornece `Project URL`, `anon key` e o `project ref` (Settings → General). Até então, tudo roda **localmente** com `supabase start` (Docker).

**Files:**
- Create: `supabase/config.toml` (gerado), `supabase/migrations/0001_perfil.sql`, `0002_exames_pendencias.sql`, `0003_medidas.sql`, `0004_medicacoes_lembretes.sql`, `0005_regras_clinicas.sql`, `0006_rls.sql`, `0007_storage.sql`, `supabase/seed.sql`, `supabase/tests/rls.test.sql`, `.env.example`
- Modify: `.gitignore` (adicionar `.env`, `supabase/.temp/`)

**Interfaces:**
- Produces: schema conforme spec §4; função `public.handle_new_user()`; trigger `set_updated_at`.

- [ ] **Step 1: Inicializar CLI**

```bash
supabase init
supabase start
```
Anotar `API URL` e `anon key` locais impressos no final (usados no `.env` de desenvolvimento).

- [ ] **Step 2: `0001_perfil.sql`**

```sql
create extension if not exists pgtap with schema extensions;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table public.perfil_saude (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  data_nascimento date,
  sexo_nascimento text check (sexo_nascimento in ('feminino','masculino')),
  possui_colo_utero boolean,
  histerectomia boolean,
  altura_cm numeric(5,1) check (altura_cm is null or (altura_cm between 50 and 250)),
  tabagismo_status text check (tabagismo_status in ('nunca','ex','atual')),
  cigarros_dia integer check (cigarros_dia is null or cigarros_dia >= 0),
  anos_fumando numeric(4,1) check (anos_fumando is null or anos_fumando >= 0),
  data_cessacao date,
  tem_diabetes boolean, tem_hipertensao boolean, tem_doenca_renal boolean,
  tem_imunossupressao boolean, tem_hiv boolean, tem_dii boolean,
  historico_cancer_pessoal jsonb not null default '[]',
  lesoes_precursoras jsonb not null default '[]',
  doencas_geneticas jsonb not null default '[]',
  radioterapia_toracica boolean,
  tipo_usuario text not null default 'paciente' check (tipo_usuario in ('paciente','profissional')),
  perfil_inicial_completo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger perfil_saude_updated_at before update on public.perfil_saude
  for each row execute function public.set_updated_at();

create table public.antecedentes_familiares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parentesco text not null check (parentesco in ('mae','pai','irma_o','filha_o','avo_a','tia_o','outro')),
  grau text not null check (grau in ('primeiro','segundo','outro')),
  condicao text not null check (condicao in ('mama','ovario','colorretal','prostata','pulmao','colo_utero','dcv_prematura','outro')),
  idade_diagnostico integer check (idade_diagnostico is null or idade_diagnostico between 0 and 120),
  observacao text,
  created_at timestamptz not null default now()
);
create index antecedentes_familiares_user_condicao_idx on public.antecedentes_familiares (user_id, condicao);

-- cria o perfil ao cadastrar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfil_saude (user_id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 3: `0002_exames_pendencias.sql`**

```sql
create table public.regras_clinicas (
  id uuid primary key default gen_random_uuid(),
  modulo text not null check (modulo in ('rastreando','cardio','bem_estar','geral')),
  programa text check (programa in ('mama','colo_utero','colorretal','pulmao','prostata')),
  exame_tipo text,
  condicao jsonb not null default '{}',
  classificacao text check (classificacao in ('normal','controle','complementar','investigacao','especializado','pendente')),
  nivel_alerta text check (nivel_alerta in ('verde','amarelo','laranja','vermelho','cinza')),
  proxima_acao text,
  intervalo_meses integer check (intervalo_meses is null or intervalo_meses > 0),
  mensagem_paciente text,
  mensagem_profissional text,
  fonte text not null,
  ano integer not null,
  versao text not null,
  revisada_em date not null,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);
create index regras_clinicas_busca_idx on public.regras_clinicas (modulo, programa, exame_tipo) where ativa;

create table public.exames (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  categoria text not null check (categoria in ('rastreamento','laboratorial','cardiologico','imagem','outro')),
  modulo text not null check (modulo in ('rastreando','cardio','bem_estar','geral')),
  programa text check (programa in ('mama','colo_utero','colorretal','pulmao','prostata')),
  data_realizacao date not null,
  resultado jsonb not null default '{}',
  laudo_texto text, instituicao text, solicitante text, observacoes text,
  anexos jsonb not null default '[]',
  classificacao text check (classificacao in ('normal','controle','complementar','investigacao','especializado','pendente')),
  nivel_alerta text check (nivel_alerta in ('verde','amarelo','laranja','vermelho','cinza')),
  proxima_acao text,
  data_proxima_acao date,
  abre_pendencia boolean not null default false,
  regra_id uuid references public.regras_clinicas(id),
  regra_versao text,
  resolve_exame_id uuid references public.exames(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index exames_user_data_idx on public.exames (user_id, data_realizacao desc);
create index exames_user_programa_idx on public.exames (user_id, programa);
create index exames_resolve_idx on public.exames (resolve_exame_id);
create index exames_regra_idx on public.exames (regra_id);
create trigger exames_updated_at before update on public.exames
  for each row execute function public.set_updated_at();

create table public.pendencias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exame_origem_id uuid not null references public.exames(id) on delete cascade,
  programa text check (programa in ('mama','colo_utero','colorretal','pulmao','prostata')),
  descricao text not null,
  nivel_alerta text not null check (nivel_alerta in ('verde','amarelo','laranja','vermelho','cinza')),
  status text not null default 'aberta' check (status in ('aberta','resolvida','cancelada')),
  exame_resolucao_id uuid references public.exames(id),
  aberta_em timestamptz not null default now(),
  resolvida_em timestamptz
);
create index pendencias_user_abertas_idx on public.pendencias (user_id) where status = 'aberta';
create index pendencias_origem_idx on public.pendencias (exame_origem_id);
create index pendencias_resolucao_idx on public.pendencias (exame_resolucao_id);
```

- [ ] **Step 4: `0003_medidas.sql`**

```sql
create table public.mrpa_sessoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inicio date not null,
  fim date,
  dias_previstos integer not null default 7 check (dias_previstos between 3 and 14),
  status text not null default 'em_andamento' check (status in ('em_andamento','concluida','cancelada')),
  created_at timestamptz not null default now()
);
create index mrpa_sessoes_user_idx on public.mrpa_sessoes (user_id);

create table public.medidas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('pa','glicemia','peso','cintura','quadril','composicao','sono','fc')),
  medido_em timestamptz not null,
  valores jsonb not null,
  contexto jsonb not null default '{}',
  sessao_id uuid references public.mrpa_sessoes(id) on delete set null,
  observacao text,
  created_at timestamptz not null default now()
);
create index medidas_user_tipo_data_idx on public.medidas (user_id, tipo, medido_em desc);
create index medidas_sessao_idx on public.medidas (sessao_id);
```

- [ ] **Step 5: `0004_medicacoes_lembretes.sql`**

```sql
create table public.medicacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  dose text,
  horarios jsonb not null default '[]',
  desde date,
  ate date,
  prescritor text,
  ativa boolean not null default true,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index medicacoes_user_ativas_idx on public.medicacoes (user_id) where ativa;
create trigger medicacoes_updated_at before update on public.medicacoes
  for each row execute function public.set_updated_at();

create table public.lembretes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  origem_tipo text not null check (origem_tipo in ('exame','medida','medicacao','perfil','sistema')),
  origem_id uuid,
  agendado_para timestamptz not null,
  titulo text not null,
  mensagem text,
  status text not null default 'pendente' check (status in ('pendente','enviado','lido','cancelado')),
  created_at timestamptz not null default now()
);
create index lembretes_user_pendentes_idx on public.lembretes (user_id, agendado_para) where status = 'pendente';
```

- [ ] **Step 6: `0005_rls.sql`** (arquivo 0005; renumerar a lista da spec — regras já foram criadas em 0002)

```sql
do $$
declare t text;
begin
  foreach t in array array['perfil_saude','antecedentes_familiares','exames','pendencias','mrpa_sessoes','medidas','medicacoes','lembretes']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I_owner on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t, t);
  end loop;
end $$;

alter table public.regras_clinicas enable row level security;
create policy regras_clinicas_leitura on public.regras_clinicas
  for select to authenticated using (ativa);
```

- [ ] **Step 7: `0006_storage.sql`**

```sql
insert into storage.buckets (id, name, public) values ('laudos', 'laudos', false)
on conflict (id) do nothing;

create policy laudos_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'laudos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy laudos_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'laudos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy laudos_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'laudos' and (storage.foldername(name))[1] = (select auth.uid())::text);
```

- [ ] **Step 8: Teste pgTAP `supabase/tests/rls.test.sql`**

```sql
begin;
select plan(4);

-- dois usuários
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@teste.dev'),
  ('00000000-0000-0000-0000-00000000000b', 'b@teste.dev');

-- trigger criou perfis
select is((select count(*) from public.perfil_saude), 2::bigint, 'trigger cria perfil ao inserir usuário');

-- B tem uma medicação
insert into public.medicacoes (user_id, nome) values ('00000000-0000-0000-0000-00000000000b', 'Losartana');

-- age como A
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select is((select count(*) from public.perfil_saude), 1::bigint, 'A vê só o próprio perfil');
select is((select count(*) from public.medicacoes), 0::bigint, 'A não vê medicação de B');
select throws_ok(
  $$insert into public.medicacoes (user_id, nome) values ('00000000-0000-0000-0000-00000000000b', 'Invasão')$$,
  '42501', null, 'A não insere em nome de B');

select * from finish();
rollback;
```

- [ ] **Step 9: Aplicar e testar**

```bash
supabase db reset
supabase test db
```
Esperado: `All tests successful. Files=1, Tests=4`.

- [ ] **Step 10: `.env.example` e `.gitignore`**

`.env.example`:
```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=cole-aqui-a-anon-key-local
```
Criar `.env` com os valores locais de `supabase status`. Acrescentar ao `.gitignore`: `.env` e `supabase/.temp/`.

- [ ] **Step 11: Vincular ao projeto remoto (quando existir)**

```bash
supabase link --project-ref <ref>
supabase db push
```
Trocar `.env` para URL/anon key do projeto remoto quando testar no celular fora da rede local.

- [ ] **Step 12: Commit**

```bash
git add supabase .env.example .gitignore
git commit -m "feat(db): schema NERO no Supabase com RLS e testes pgTAP

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 4: Cliente Supabase, tradução de erros, sessão e telas de autenticação

**Files:**
- Create: `src/core/supabase/client.ts`, `src/core/supabase/database.types.ts` (gerado), `src/core/supabase/erros.ts`, `src/core/supabase/__tests__/erros.test.ts`, `src/core/sessao/SessaoProvider.tsx`, `app/(auth)/_layout.tsx`, `app/(auth)/onboarding.tsx`, `app/(auth)/login.tsx`, `app/(auth)/cadastro.tsx`, `app/perfil-inicial.tsx` (provisório), `app/(app)/_layout.tsx` (provisório), `app/(app)/index.tsx` (provisório)
- Modify: `app/_layout.tsx`, `app/index.tsx`, `package.json`

**Interfaces:**
- Produces: `supabase` (cliente), `class ErroNero extends Error { mensagemUsuario: string }`, `traduzirErro(e: unknown): ErroNero`, `useSessao(): { sessao: Session | null; carregando: boolean; online: boolean; sair(): Promise<void> }`.

- [ ] **Step 1: Instalar**

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill @react-native-community/netinfo
```

- [ ] **Step 2: Gerar tipos**

```bash
mkdir -p src/core/supabase
supabase gen types typescript --local > src/core/supabase/database.types.ts
```
Adicionar script em `package.json`: `"db:types": "supabase gen types typescript --local > src/core/supabase/database.types.ts"`.

- [ ] **Step 3: `client.ts`**

```ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  throw new Error('Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env');
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
```

- [ ] **Step 4: Teste de `erros.ts` (falhando)**

`src/core/supabase/__tests__/erros.test.ts`:
```ts
import { traduzirErro, ErroNero } from '../erros';

describe('traduzirErro', () => {
  it('traduz credenciais inválidas', () => {
    const e = traduzirErro({ code: 'invalid_credentials', message: 'Invalid login credentials' });
    expect(e).toBeInstanceOf(ErroNero);
    expect(e.mensagemUsuario).toBe('E-mail ou senha incorretos.');
  });
  it('traduz e-mail já cadastrado', () => {
    expect(traduzirErro({ code: 'user_already_exists', message: '' }).mensagemUsuario).toBe('Este e-mail já está cadastrado.');
  });
  it('traduz violação de RLS (42501)', () => {
    expect(traduzirErro({ code: '42501', message: '' }).mensagemUsuario).toBe('Você não tem permissão para esta ação.');
  });
  it('traduz falha de rede', () => {
    expect(traduzirErro(new TypeError('Network request failed')).mensagemUsuario).toBe('Sem conexão com a internet. Verifique sua rede e tente novamente.');
  });
  it('usa mensagem genérica para o resto', () => {
    expect(traduzirErro({ code: 'xyz', message: 'weird' }).mensagemUsuario).toBe('Não foi possível concluir. Tente novamente.');
  });
  it('devolve o próprio ErroNero se já for um', () => {
    const original = new ErroNero('Teste', null);
    expect(traduzirErro(original)).toBe(original);
  });
});
```

- [ ] **Step 5: Rodar (falha)**

```bash
npx jest src/core/supabase
```
Esperado: FAIL — módulo `../erros` não encontrado.

- [ ] **Step 6: `erros.ts`**

```ts
export class ErroNero extends Error {
  constructor(public mensagemUsuario: string, public causa: unknown) {
    super(mensagemUsuario);
    this.name = 'ErroNero';
  }
}

const porCodigo: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  user_already_exists: 'Este e-mail já está cadastrado.',
  email_exists: 'Este e-mail já está cadastrado.',
  weak_password: 'A senha precisa ter pelo menos 8 caracteres.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar.',
  '23505': 'Este registro já existe.',
  '42501': 'Você não tem permissão para esta ação.',
  PGRST116: 'Registro não encontrado.',
};

const GENERICA = 'Não foi possível concluir. Tente novamente.';
const SEM_REDE = 'Sem conexão com a internet. Verifique sua rede e tente novamente.';

export function traduzirErro(e: unknown): ErroNero {
  if (e instanceof ErroNero) return e;
  const obj = (e ?? {}) as { code?: string; message?: string; status?: number };
  const msg = obj.message ?? (e instanceof Error ? e.message : '');
  if (/network request failed|failed to fetch/i.test(msg)) return new ErroNero(SEM_REDE, e);
  if (obj.code && porCodigo[obj.code]) return new ErroNero(porCodigo[obj.code], e);
  if (__DEV__) console.warn('[NERO] erro não traduzido:', e);
  return new ErroNero(GENERICA, e);
}
```
Adicionar em `jest` (package.json) `"globals": { "__DEV__": true }` se o preset não definir.

- [ ] **Step 7: Rodar (passa)**

```bash
npx jest src/core/supabase
```
Esperado: 6 passed.

- [ ] **Step 8: `SessaoProvider.tsx`**

```tsx
import NetInfo from '@react-native-community/netinfo';
import type { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@core/supabase/client';

interface Sessao { sessao: Session | null; carregando: boolean; online: boolean; sair: () => Promise<void>; }
const Ctx = createContext<Sessao | null>(null);

export function SessaoProvider({ children }: { children: React.ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSessao(data.session); setCarregando(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => setSessao(s));
    const unsubNet = NetInfo.addEventListener((estado) => setOnline(estado.isConnected !== false));
    return () => { sub.subscription.unsubscribe(); unsubNet(); };
  }, []);

  const sair = async () => { await supabase.auth.signOut(); };

  return <Ctx.Provider value={{ sessao, carregando, online, sair }}>{children}</Ctx.Provider>;
}

export function useSessao(): Sessao {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSessao precisa estar dentro de SessaoProvider');
  return v;
}
```

- [ ] **Step 9: `app/_layout.tsx` com provider**

Envolver o `<Stack>` com `<SessaoProvider>`:
```tsx
import { SessaoProvider } from '@core/sessao/SessaoProvider';
// ...
return (
  <SessaoProvider>
    <Stack screenOptions={{ headerShown: false }} />
  </SessaoProvider>
);
```

- [ ] **Step 10: `app/index.tsx` — roteador de entrada**

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSessao } from '@core/sessao/SessaoProvider';
import { supabase } from '@core/supabase/client';
import { Colors } from '@ui/theme';

export const ONBOARDING_KEY = 'nero_onboarding_visto';

export default function Index() {
  const { sessao, carregando } = useSessao();
  const [onboardingVisto, setOnboardingVisto] = useState<boolean | null>(null);
  const [perfilCompleto, setPerfilCompleto] = useState<boolean | null>(null);

  useEffect(() => { AsyncStorage.getItem(ONBOARDING_KEY).then((v) => setOnboardingVisto(v === 'true')); }, []);

  useEffect(() => {
    if (!sessao) { setPerfilCompleto(null); return; }
    supabase.from('perfil_saude').select('perfil_inicial_completo').eq('user_id', sessao.user.id).single()
      .then(({ data }) => setPerfilCompleto(data?.perfil_inicial_completo ?? false));
  }, [sessao?.user.id]);

  if (carregando || onboardingVisto === null || (sessao && perfilCompleto === null)) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}><ActivityIndicator color={Colors.primary} /></View>;
  }
  if (!sessao) return <Redirect href={onboardingVisto ? '/(auth)/login' : '/(auth)/onboarding'} />;
  if (!perfilCompleto) return <Redirect href="/perfil-inicial" />;
  return <Redirect href="/(app)" />;
}
```

- [ ] **Step 11: `app/(auth)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';
export default function AuthLayout() { return <Stack screenOptions={{ headerShown: false }} />; }
```

- [ ] **Step 12: `app/(auth)/onboarding.tsx`** (3 slides, Nero em vez de Lottie)

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ONBOARDING_KEY } from '../index';
import { Button, Colors, NeroImage, Radius, Spacing, Typography } from '@ui/index';

const { width } = Dimensions.get('window');
const slides = [
  { id: '1', titulo: 'Sua saúde,\nem um só lugar', texto: 'Pressão, glicemia, exames, hábitos e rastreamento de câncer — organizados para você e para o seu médico.' },
  { id: '2', titulo: 'Cadastre uma vez,\nuse em tudo', texto: 'Idade, tabagismo, medicamentos e histórico alimentam todos os módulos automaticamente.' },
  { id: '3', titulo: 'Orientação,\nnão diagnóstico', texto: 'O NERO organiza seus dados e avisa quando algo merece atenção. As decisões continuam com o seu médico.' },
];

export default function Onboarding() {
  const router = useRouter();
  const lista = useRef<FlatList>(null);
  const [atual, setAtual] = useState(0);

  const concluir = async () => { await AsyncStorage.setItem(ONBOARDING_KEY, 'true'); router.replace('/(auth)/login'); };
  const proximo = () => atual < slides.length - 1 ? lista.current?.scrollToIndex({ index: atual + 1 }) : concluir();

  return (
    <SafeAreaView style={styles.tela}>
      <TouchableOpacity onPress={concluir} style={styles.pular}><Text style={styles.pularTexto}>Pular</Text></TouchableOpacity>
      <FlatList ref={lista} data={slides} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={(s) => s.id}
        onMomentumScrollEnd={(e) => setAtual(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <NeroImage size={220} />
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.texto}>{item.texto}</Text>
          </View>
        )} />
      <View style={styles.rodape}>
        <View style={styles.pontos}>{slides.map((_, i) => <View key={i} style={[styles.ponto, i === atual && styles.pontoAtivo]} />)}</View>
        <Button label={atual === slides.length - 1 ? 'Começar' : 'Próximo'} onPress={proximo} pill />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  pular: { alignSelf: 'flex-end', padding: Spacing.lg },
  pularTexto: { ...Typography.subheading, color: Colors.textSecondary },
  slide: { width, alignItems: 'center', paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl },
  titulo: { ...Typography.display, color: Colors.primary, textAlign: 'center', marginTop: Spacing.xl },
  texto: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.md },
  rodape: { padding: Spacing.xl, gap: Spacing.lg },
  pontos: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  ponto: { width: 8, height: 8, borderRadius: Radius.pill, backgroundColor: Colors.border },
  pontoAtivo: { width: 24, backgroundColor: Colors.primary },
});
```

- [ ] **Step 13: `app/(auth)/login.tsx`**

```tsx
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { Button, Colors, Input, NeroImage, Spacing, Typography } from '@ui/index';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const entrar = async () => {
    if (!email.trim() || !senha) return Alert.alert('Atenção', 'Preencha e-mail e senha.');
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setCarregando(false);
    if (error) return Alert.alert('Não foi possível entrar', traduzirErro(error).mensagemUsuario);
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.tela}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <NeroImage size={140} style={{ alignSelf: 'center' }} />
          <Text style={styles.titulo}>Bem-vindo ao NERO</Text>
          <Text style={styles.sub}>Entre para continuar</Text>
          <View style={styles.form}>
            <Input placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Input placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
            <Button label="Entrar" onPress={entrar} loading={carregando} />
          </View>
          <Link href="/(auth)/cadastro" style={styles.link}>Ainda não tem conta? <Text style={{ fontFamily: 'Poppins-SemiBold' }}>Cadastre-se</Text></Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
  titulo: { ...Typography.display, color: Colors.primary, textAlign: 'center', marginTop: Spacing.lg },
  sub: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  form: { gap: Spacing.md, marginTop: Spacing.xl },
  link: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xl },
});
```

- [ ] **Step 14: `app/(auth)/cadastro.tsx`**

```tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { Button, Colors, Input, InternalHeader, Spacing, Typography } from '@ui/index';

export default function Cadastro() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const cadastrar = async () => {
    if (nome.trim().length < 2) return Alert.alert('Atenção', 'Informe seu nome.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return Alert.alert('Atenção', 'Informe um e-mail válido.');
    if (senha.length < 8) return Alert.alert('Atenção', 'A senha precisa ter pelo menos 8 caracteres.');
    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: senha, options: { data: { nome: nome.trim() } } });
    setCarregando(false);
    if (error) return Alert.alert('Não foi possível cadastrar', traduzirErro(error).mensagemUsuario);
    if (!data.session) return Alert.alert('Confirme seu e-mail', 'Enviamos um link de confirmação. Depois, volte e entre.', [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]);
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.tela}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <InternalHeader sectionLabel="NERO" title="Criar conta" />
          <View style={styles.form}>
            <Input placeholder="Nome" value={nome} onChangeText={setNome} />
            <Input placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Input placeholder="Senha (mínimo 8 caracteres)" secureTextEntry value={senha} onChangeText={setSenha} />
            <Button label="Cadastrar" onPress={cadastrar} loading={carregando} />
            <Text style={styles.aviso}>Seus dados de saúde são seus. O NERO organiza informações e não substitui a avaliação do seu médico.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { flexGrow: 1 },
  form: { gap: Spacing.md, padding: Spacing.xl },
  aviso: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.md },
});
```
No painel do Supabase (Authentication → Providers → Email), **desativar "Confirm email"** para o ambiente de desenvolvimento; localmente já vem desativado em `config.toml` (`[auth.email] enable_confirmations = false`).

- [ ] **Step 15: Telas provisórias para o fluxo fechar**

`app/perfil-inicial.tsx` (substituído na Task 6):
```tsx
import { useRouter } from 'expo-router';
import { SafeAreaView, Text } from 'react-native';
import { useSessao } from '@core/sessao/SessaoProvider';
import { supabase } from '@core/supabase/client';
import { Button, Colors, Typography } from '@ui/index';

export default function PerfilInicial() {
  const router = useRouter();
  const { sessao } = useSessao();
  const concluir = async () => {
    await supabase.from('perfil_saude').update({ perfil_inicial_completo: true }).eq('user_id', sessao!.user.id);
    router.replace('/');
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, padding: 24, justifyContent: 'center', gap: 16 }}>
      <Text style={{ ...Typography.title, color: Colors.primary }}>Perfil inicial (provisório)</Text>
      <Button label="Concluir" onPress={concluir} />
    </SafeAreaView>
  );
}
```

`app/(app)/_layout.tsx` (provisório): `import { Stack } from 'expo-router'; export default () => <Stack screenOptions={{ headerShown: false }} />;`

`app/(app)/index.tsx` (provisório):
```tsx
import { SafeAreaView, Text } from 'react-native';
import { useSessao } from '@core/sessao/SessaoProvider';
import { Button, Colors, Typography } from '@ui/index';
export default function Home() {
  const { sessao, sair } = useSessao();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, padding: 24, justifyContent: 'center', gap: 16 }}>
      <Text style={{ ...Typography.title, color: Colors.primary }}>Home (provisória) — {sessao?.user.email}</Text>
      <Button label="Sair" variant="outline" onPress={sair} />
    </SafeAreaView>
  );
}
```

- [ ] **Step 16: Verificar no celular**

`npx tsc --noEmit` sem erros. Com `supabase start` rodando e `.env` apontando para o IP da máquina (`http://192.168.x.x:54321`, não `127.0.0.1`, para o celular alcançar): onboarding → cadastro → perfil provisório → Home provisória → Sair → login → volta à Home. Verificar em `supabase studio` (http://127.0.0.1:54323) que `perfil_saude` tem a linha com o nome.

- [ ] **Step 17: Commit**

```bash
git add -A
git commit -m "feat(auth): cliente Supabase, sessão, onboarding, login e cadastro

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 5: Cálculos do perfil (TDD)

**Files:**
- Create: `src/core/perfil/tipos.ts`, `src/core/perfil/calculos.ts`, `src/core/perfil/__tests__/calculos.test.ts`

**Interfaces:**
- Produces: `PerfilSaude`, `AntecedenteFamiliar` (tipos de domínio, camelCase), `calcularIdade(dataNascimento: string, hoje?: Date): number`, `calcularMacosAno(cigarrosDia: number | null, anosFumando: number | null): number | null`, `calcularIMC(pesoKg: number, alturaCm: number): number`, `anosDesde(data: string | null, hoje?: Date): number | null`.

- [ ] **Step 1: `tipos.ts`**

```ts
export type SexoNascimento = 'feminino' | 'masculino';
export type TabagismoStatus = 'nunca' | 'ex' | 'atual';

export interface PerfilSaude {
  userId: string;
  nome: string;
  dataNascimento: string | null;          // 'AAAA-MM-DD'
  sexoNascimento: SexoNascimento | null;
  possuiColoUtero: boolean | null;
  histerectomia: boolean | null;
  alturaCm: number | null;
  tabagismoStatus: TabagismoStatus | null;
  cigarrosDia: number | null;
  anosFumando: number | null;
  dataCessacao: string | null;
  temDiabetes: boolean | null; temHipertensao: boolean | null; temDoencaRenal: boolean | null;
  temImunossupressao: boolean | null; temHiv: boolean | null; temDii: boolean | null;
  historicoCancerPessoal: { tipo: string; ano?: number }[];
  lesoesPrecursoras: { tipo: string; ano?: number }[];
  doencasGeneticas: { nome: string }[];
  radioterapiaToracica: boolean | null;
  perfilInicialCompleto: boolean;
}

export type Parentesco = 'mae' | 'pai' | 'irma_o' | 'filha_o' | 'avo_a' | 'tia_o' | 'outro';
export type GrauParentesco = 'primeiro' | 'segundo' | 'outro';
export type CondicaoFamiliar = 'mama' | 'ovario' | 'colorretal' | 'prostata' | 'pulmao' | 'colo_utero' | 'dcv_prematura' | 'outro';

export interface AntecedenteFamiliar {
  id: string;
  parentesco: Parentesco;
  grau: GrauParentesco;
  condicao: CondicaoFamiliar;
  idadeDiagnostico: number | null;
  observacao: string | null;
}
```

- [ ] **Step 2: Teste (falhando)**

`src/core/perfil/__tests__/calculos.test.ts`:
```ts
import { calcularIdade, calcularMacosAno, calcularIMC, anosDesde } from '../calculos';

const hoje = new Date('2026-09-15T12:00:00Z');

describe('calcularIdade', () => {
  it('antes do aniversário no ano', () => expect(calcularIdade('1990-12-01', hoje)).toBe(35));
  it('no dia do aniversário', () => expect(calcularIdade('1990-09-15', hoje)).toBe(36));
  it('depois do aniversário', () => expect(calcularIdade('1990-01-10', hoje)).toBe(36));
});

describe('calcularMacosAno', () => {
  it('20 cigarros/dia por 30 anos = 30 maços-ano (§35)', () => expect(calcularMacosAno(20, 30)).toBe(30));
  it('10 cigarros/dia por 15 anos = 7,5', () => expect(calcularMacosAno(10, 15)).toBe(7.5));
  it('null se faltar dado', () => { expect(calcularMacosAno(null, 10)).toBeNull(); expect(calcularMacosAno(20, null)).toBeNull(); });
});

describe('calcularIMC', () => {
  it('67 kg / 1,65 m = 24,6', () => expect(calcularIMC(67, 165)).toBe(24.6));
  it('arredonda a uma casa', () => expect(calcularIMC(80, 180)).toBe(24.7));
});

describe('anosDesde', () => {
  it('conta anos completos', () => expect(anosDesde('2016-09-16', hoje)).toBe(9));
  it('null se data ausente', () => expect(anosDesde(null, hoje)).toBeNull());
});
```

- [ ] **Step 3: Rodar (falha)** — `npx jest src/core/perfil` → FAIL, módulo não encontrado.

- [ ] **Step 4: `calculos.ts`**

```ts
function paraData(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

function anosCompletos(inicio: Date, fim: Date): number {
  let anos = fim.getUTCFullYear() - inicio.getUTCFullYear();
  const aindaNaoFezAniversario =
    fim.getUTCMonth() < inicio.getUTCMonth() ||
    (fim.getUTCMonth() === inicio.getUTCMonth() && fim.getUTCDate() < inicio.getUTCDate());
  if (aindaNaoFezAniversario) anos -= 1;
  return anos;
}

export function calcularIdade(dataNascimento: string, hoje: Date = new Date()): number {
  return anosCompletos(paraData(dataNascimento), hoje);
}

/** Maços-ano = (cigarros/dia ÷ 20) × anos fumando (§35). */
export function calcularMacosAno(cigarrosDia: number | null, anosFumando: number | null): number | null {
  if (cigarrosDia == null || anosFumando == null) return null;
  return Math.round(((cigarrosDia / 20) * anosFumando) * 10) / 10;
}

export function calcularIMC(pesoKg: number, alturaCm: number): number {
  const m = alturaCm / 100;
  return Math.round((pesoKg / (m * m)) * 10) / 10;
}

export function anosDesde(data: string | null, hoje: Date = new Date()): number | null {
  if (!data) return null;
  return anosCompletos(paraData(data), hoje);
}
```

- [ ] **Step 5: Rodar (passa)** — `npx jest src/core/perfil` → 10 passed.

- [ ] **Step 6: Commit**

```bash
git add src/core/perfil
git commit -m "feat(perfil): tipos de domínio e cálculos (idade, maços-ano, IMC) com testes

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 6: Motor de regras — tipos, hierarquia de segurança e elegibilidade (TDD)

**Files:**
- Create: `src/core/regras/tipos.ts`, `src/core/regras/seguranca.ts`, `src/core/regras/elegibilidade.ts`, `src/core/regras/classificar.ts`, `src/core/regras/programas/index.ts`, `src/core/regras/__tests__/seguranca.test.ts`, `src/core/regras/__tests__/elegibilidade.test.ts`, `src/core/regras/__tests__/classificar.test.ts`, `src/core/regras/__tests__/sem-dependencias.test.ts`

**Interfaces:**
- Consumes: nada de fora (TS puro).
- Produces: tipos da spec §5.1; `aplicarHierarquiaSeguranca(programa, contexto): BloqueioSeguranca | null`; `avaliarElegibilidade(perfil, programa, regras, contexto, hoje?): ResultadoElegibilidade`; `classificarExame(exame, perfil, contexto, regras): ResultadoClassificacao`; `ProgramaHandlers` (ponto de extensão da Fase 1).

- [ ] **Step 1: `tipos.ts`** — copiar literalmente o bloco da spec §5.1 e acrescentar:

```ts
export interface BloqueioSeguranca {
  motivo: 'sintoma_alarme' | 'pendencia_aberta' | 'acompanhamento_especializado';
  nivelAlerta: NivelAlerta;
  mensagemPaciente: string;
}

/** Ponto de extensão por programa (Fase 1 implementa mama, colo, colorretal, pulmão, próstata). */
export interface ProgramaHandler {
  /** Fatores que exigem avaliação individualizada; devolve mensagem ou null. */
  fatoresModificadores(perfil: PerfilRegras): string | null;
  /** Aplicável anatomicamente/por sexo ao perfil? */
  aplicavel(perfil: PerfilRegras): boolean;
  /** Seleciona a regra que casa com o resultado do exame (ou null). */
  selecionarRegra(exame: ExameEntrada, regras: RegraParametros[], perfil: PerfilRegras, contexto: ContextoAvaliacao): RegraParametros | null;
}
export type ProgramaHandlers = Partial<Record<Programa, ProgramaHandler>>;
```

- [ ] **Step 2: Teste de isolamento (falha até existirem os arquivos)**

`__tests__/sem-dependencias.test.ts`:
```ts
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const raiz = join(__dirname, '..');
const proibidos = ['react', 'react-native', 'expo', '@supabase', '@ui', '@core/supabase', 'app/'];

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === '__tests__' ? [] : arquivos(p);
    return p.endsWith('.ts') ? [p] : [];
  });
}

test('src/core/regras não importa UI, Expo nem Supabase', () => {
  for (const arq of arquivos(raiz)) {
    const imports = readFileSync(arq, 'utf8').match(/from\s+['"]([^'"]+)['"]/g) ?? [];
    for (const imp of imports) for (const p of proibidos) expect(imp).not.toContain(`'${p}`);
  }
});
```

- [ ] **Step 3: Teste da hierarquia (falhando)**

`__tests__/seguranca.test.ts`:
```ts
import { aplicarHierarquiaSeguranca } from '../seguranca';
import type { ContextoAvaliacao } from '../tipos';

const vazio: ContextoAvaliacao = { sintomasAlarme: [], pendenciasAbertas: [], emAcompanhamentoEspecializado: [], historicoExames: [] };

describe('hierarquia de segurança (§66)', () => {
  it('nada bloqueia → null', () => expect(aplicarHierarquiaSeguranca('mama', vazio)).toBeNull());

  it('sintoma de alarme tem prioridade máxima', () => {
    const r = aplicarHierarquiaSeguranca('mama', { ...vazio, sintomasAlarme: ['nodulo_mamario'], pendenciasAbertas: [{ programa: 'mama', exameOrigemId: 'x' }] });
    expect(r?.motivo).toBe('sintoma_alarme');
    expect(r?.nivelAlerta).toBe('vermelho');
    expect(r?.mensagemPaciente).toMatch(/Não espere pela data/);
  });

  it('pendência aberta bloqueia rotina', () => {
    const r = aplicarHierarquiaSeguranca('colorretal', { ...vazio, pendenciasAbertas: [{ programa: 'colorretal', exameOrigemId: 'fit1' }] });
    expect(r?.motivo).toBe('pendencia_aberta');
    expect(r?.nivelAlerta).toBe('laranja');
  });

  it('pendência de outro programa não bloqueia', () => {
    expect(aplicarHierarquiaSeguranca('mama', { ...vazio, pendenciasAbertas: [{ programa: 'colorretal', exameOrigemId: 'fit1' }] })).toBeNull();
  });

  it('acompanhamento especializado bloqueia cálculo automático', () => {
    const r = aplicarHierarquiaSeguranca('mama', { ...vazio, emAcompanhamentoEspecializado: ['mama'] });
    expect(r?.motivo).toBe('acompanhamento_especializado');
    expect(r?.nivelAlerta).toBe('cinza');
  });
});
```

- [ ] **Step 4: Rodar (falha)** — `npx jest src/core/regras`.

- [ ] **Step 5: `seguranca.ts`**

```ts
import type { BloqueioSeguranca, ContextoAvaliacao, Programa } from './tipos';

export const MENSAGENS_SEGURANCA = {
  sintoma_alarme:
    'Não espere pela data do seu próximo rastreamento. O rastreamento é destinado principalmente a pessoas sem sintomas. Como você informou um sinal de alerta, procure avaliação médica.',
  pendencia_aberta:
    'Existe um resultado anterior que ainda precisa de avaliação. Um novo exame de rotina só será programado depois que essa etapa for concluída.',
  acompanhamento_especializado:
    'Você está em acompanhamento especializado. As datas de seguimento são definidas pelo profissional responsável, não pelo calendário automático.',
} as const;

/** Ordem obrigatória (§66): sintoma de alarme → pendência aberta → acompanhamento especializado. */
export function aplicarHierarquiaSeguranca(programa: Programa, contexto: ContextoAvaliacao): BloqueioSeguranca | null {
  if (contexto.sintomasAlarme.length > 0) {
    return { motivo: 'sintoma_alarme', nivelAlerta: 'vermelho', mensagemPaciente: MENSAGENS_SEGURANCA.sintoma_alarme };
  }
  if (contexto.pendenciasAbertas.some((p) => p.programa === programa)) {
    return { motivo: 'pendencia_aberta', nivelAlerta: 'laranja', mensagemPaciente: MENSAGENS_SEGURANCA.pendencia_aberta };
  }
  if (contexto.emAcompanhamentoEspecializado.includes(programa)) {
    return { motivo: 'acompanhamento_especializado', nivelAlerta: 'cinza', mensagemPaciente: MENSAGENS_SEGURANCA.acompanhamento_especializado };
  }
  return null;
}
```

- [ ] **Step 6: Teste de elegibilidade (falhando)**

`__tests__/elegibilidade.test.ts`:
```ts
import { avaliarElegibilidade } from '../elegibilidade';
import type { ContextoAvaliacao, PerfilRegras, RegraParametros } from '../tipos';

const hoje = new Date('2026-09-15T12:00:00Z');
const vazio: ContextoAvaliacao = { sintomasAlarme: [], pendenciasAbertas: [], emAcompanhamentoEspecializado: [], historicoExames: [] };
const perfilBase: PerfilRegras = {
  idade: 45, sexoNascimento: 'feminino', possuiColoUtero: true,
  tabagismo: { status: 'nunca', macosAno: null, anosDesdeCessacao: null },
  condicoes: {}, historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, antecedentes: [],
};
// regra genérica de elegibilidade: exame_tipo null, condicao com faixa etária e intervalo
const regraFaixa: RegraParametros = {
  id: 'r-mama-faixa', versao: '2026.1', fonte: 'Teste', ano: 2026,
  condicao: { idade_min: 40, idade_max: 74 }, classificacao: 'normal', nivelAlerta: 'verde',
  proximaAcao: 'Realizar mamografia', intervaloMeses: 12, mensagemPaciente: 'Você está na faixa etária de rastreamento.',
};

describe('avaliarElegibilidade (§28)', () => {
  it('dentro da faixa, sem exame → indicado', () => {
    const r = avaliarElegibilidade(perfilBase, 'mama', [regraFaixa], vazio, hoje);
    expect(r.status).toBe('indicado');
    expect(r.regraId).toBe('r-mama-faixa');
  });
  it('faltam ≤ 24 meses para a faixa → próximo de iniciar', () => {
    expect(avaliarElegibilidade({ ...perfilBase, idade: 38 }, 'mama', [regraFaixa], vazio, hoje).status).toBe('proximo_de_iniciar');
  });
  it('muito jovem → não indicado no momento', () => {
    expect(avaliarElegibilidade({ ...perfilBase, idade: 25 }, 'mama', [regraFaixa], vazio, hoje).status).toBe('nao_indicado_no_momento');
  });
  it('acima da faixa → acompanhamento médico', () => {
    expect(avaliarElegibilidade({ ...perfilBase, idade: 80 }, 'mama', [regraFaixa], vazio, hoje).status).toBe('acompanhamento_medico');
  });
  it('sem colo do útero → não indicado para colo_utero', () => {
    const r = avaliarElegibilidade({ ...perfilBase, possuiColoUtero: false }, 'colo_utero', [{ ...regraFaixa, id: 'r-colo', condicao: { idade_min: 25, idade_max: 64 } }], vazio, hoje);
    expect(r.status).toBe('nao_indicado_no_momento');
    expect(r.mensagem).toMatch(/não é aplicável ao seu perfil/);
  });
  it('próstata só para sexo masculino', () => {
    expect(avaliarElegibilidade(perfilBase, 'prostata', [{ ...regraFaixa, id: 'r-prost', condicao: { idade_min: 50, idade_max: 75 } }], vazio, hoje).status).toBe('nao_indicado_no_momento');
  });
  it('sintoma de alarme → acompanhamento médico com mensagem de segurança', () => {
    const r = avaliarElegibilidade(perfilBase, 'mama', [regraFaixa], { ...vazio, sintomasAlarme: ['nodulo_mamario'] }, hoje);
    expect(r.status).toBe('acompanhamento_medico');
    expect(r.mensagem).toMatch(/Não espere/);
  });
  it('exame normal recente → em dia, com próxima data = data + intervalo', () => {
    const ctx: ContextoAvaliacao = { ...vazio, historicoExames: [{ id: 'e1', tipo: 'mamografia', programa: 'mama', dataRealizacao: '2026-03-10', resultado: { birads: 1 }, classificacao: 'normal' }] };
    const r = avaliarElegibilidade(perfilBase, 'mama', [regraFaixa], ctx, hoje);
    expect(r.status).toBe('em_dia');
    expect(r.proximaData).toBe('2027-03-10');
  });
  it('próxima data em ≤ 60 dias → exame próximo', () => {
    const ctx: ContextoAvaliacao = { ...vazio, historicoExames: [{ id: 'e1', tipo: 'mamografia', programa: 'mama', dataRealizacao: '2025-10-01', resultado: { birads: 1 }, classificacao: 'normal' }] };
    expect(avaliarElegibilidade(perfilBase, 'mama', [regraFaixa], ctx, hoje).status).toBe('exame_proximo');
  });
  it('próxima data passada → exame atrasado', () => {
    const ctx: ContextoAvaliacao = { ...vazio, historicoExames: [{ id: 'e1', tipo: 'mamografia', programa: 'mama', dataRealizacao: '2025-01-01', resultado: { birads: 1 }, classificacao: 'normal' }] };
    expect(avaliarElegibilidade(perfilBase, 'mama', [regraFaixa], ctx, hoje).status).toBe('exame_atrasado');
  });
  it('sem regra cadastrada → avaliação individualizada', () => {
    expect(avaliarElegibilidade(perfilBase, 'mama', [], vazio, hoje).status).toBe('avaliacao_individualizada');
  });
});
```

- [ ] **Step 7: `elegibilidade.ts`**

```ts
import { aplicarHierarquiaSeguranca } from './seguranca';
import type { ContextoAvaliacao, PerfilRegras, Programa, ProgramaHandlers, RegraParametros, ResultadoElegibilidade } from './tipos';

export function somarMeses(iso: string, meses: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1 + meses, d));
  return dt.toISOString().slice(0, 10);
}

function diasEntre(deIso: string, ate: Date): number {
  const [a, m, d] = deIso.split('-').map(Number);
  return Math.round((Date.UTC(a, m - 1, d) - Date.UTC(ate.getUTCFullYear(), ate.getUTCMonth(), ate.getUTCDate())) / 86_400_000);
}

/** Aplicabilidade anatômica/por sexo padrão; handlers da Fase 1 podem refinar. */
export function aplicavelAoPerfil(programa: Programa, perfil: PerfilRegras): boolean {
  switch (programa) {
    case 'colo_utero': return perfil.possuiColoUtero === true;
    case 'prostata':   return perfil.sexoNascimento === 'masculino';
    case 'mama':       return perfil.sexoNascimento === 'feminino';
    default:           return true;
  }
}

const MSG = {
  naoAplicavel: 'Este rastreamento não é aplicável ao seu perfil atual.',
  jovem: 'Você ainda não está na faixa etária habitual de rastreamento. Mantenha seus dados atualizados para que o NERO possa avisá-lo quando chegar o momento adequado.',
  proximo: 'Você está próximo da faixa etária de rastreamento. O NERO avisará quando chegar o momento.',
  acima: 'Acima da faixa etária habitual de rastreamento. A continuidade deve ser decidida com seu médico.',
  semRegra: 'Ainda não há protocolo cadastrado para este rastreamento. Converse com seu médico.',
  emDia: 'Seu rastreamento está em dia.',
  proximoExame: 'Seu próximo exame está previsto para os próximos 60 dias.',
  atrasado: 'A data prevista do seu exame já passou. Procure agendar.',
} as const;

export function avaliarElegibilidade(
  perfil: PerfilRegras, programa: Programa, regras: RegraParametros[], contexto: ContextoAvaliacao,
  hoje: Date = new Date(), handlers: ProgramaHandlers = {},
): ResultadoElegibilidade {
  const base = { programa, regraId: null as string | null, regraVersao: null as string | null, proximaData: null as string | null };
  const handler = handlers[programa];

  if (!(handler?.aplicavel(perfil) ?? aplicavelAoPerfil(programa, perfil))) {
    return { ...base, status: 'nao_indicado_no_momento', mensagem: MSG.naoAplicavel };
  }

  const bloqueio = aplicarHierarquiaSeguranca(programa, contexto);
  if (bloqueio) return { ...base, status: 'acompanhamento_medico', mensagem: bloqueio.mensagemPaciente };

  const modificador = handler?.fatoresModificadores(perfil) ?? null;
  if (modificador) return { ...base, status: 'avaliacao_individualizada', mensagem: modificador };

  const regra = regras.find((r) => typeof r.condicao.idade_min === 'number');
  if (!regra) return { ...base, status: 'avaliacao_individualizada', mensagem: MSG.semRegra };
  const ref = { ...base, regraId: regra.id, regraVersao: regra.versao };
  const min = regra.condicao.idade_min as number;
  const max = (regra.condicao.idade_max as number | undefined) ?? Infinity;

  if (perfil.idade > max) return { ...ref, status: 'acompanhamento_medico', mensagem: MSG.acima };
  if (perfil.idade < min) {
    return perfil.idade >= min - 2
      ? { ...ref, status: 'proximo_de_iniciar', mensagem: MSG.proximo }
      : { ...ref, status: 'nao_indicado_no_momento', mensagem: MSG.jovem };
  }

  const ultimoNormal = contexto.historicoExames
    .filter((e) => e.programa === programa && (e.classificacao === 'normal' || e.classificacao === 'controle'))
    .sort((a, b) => b.dataRealizacao.localeCompare(a.dataRealizacao))[0];

  if (!ultimoNormal || regra.intervaloMeses == null) return { ...ref, status: 'indicado', mensagem: regra.mensagemPaciente };

  const proximaData = somarMeses(ultimoNormal.dataRealizacao, regra.intervaloMeses);
  const dias = diasEntre(proximaData, hoje);
  if (dias < 0)   return { ...ref, status: 'exame_atrasado', mensagem: MSG.atrasado, proximaData };
  if (dias <= 60) return { ...ref, status: 'exame_proximo', mensagem: MSG.proximoExame, proximaData };
  return { ...ref, status: 'em_dia', mensagem: MSG.emDia, proximaData };
}
```

- [ ] **Step 8: Teste de `classificarExame` (falhando)**

`__tests__/classificar.test.ts`:
```ts
import { classificarExame } from '../classificar';
import type { ContextoAvaliacao, ExameEntrada, PerfilRegras, RegraParametros } from '../tipos';

const vazio: ContextoAvaliacao = { sintomasAlarme: [], pendenciasAbertas: [], emAcompanhamentoEspecializado: [], historicoExames: [] };
const perfil: PerfilRegras = { idade: 52, sexoNascimento: 'feminino', possuiColoUtero: true, tabagismo: { status: 'nunca', macosAno: null, anosDesdeCessacao: null }, condicoes: {}, historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, antecedentes: [] };
const regraB1: RegraParametros = { id: 'b1', versao: '1', fonte: 'T', ano: 2026, condicao: { birads: 1 }, classificacao: 'normal', nivelAlerta: 'verde', proximaAcao: 'Nova mamografia', intervaloMeses: 12, mensagemPaciente: 'Sem achados suspeitos.' };
const regraB4: RegraParametros = { id: 'b4', versao: '1', fonte: 'T', ano: 2026, condicao: { birads: 4 }, classificacao: 'investigacao', nivelAlerta: 'laranja', proximaAcao: 'Avaliação médica', intervaloMeses: null, mensagemPaciente: 'Achado que necessita investigação.' };
const mamo = (birads: number): ExameEntrada => ({ tipo: 'mamografia', programa: 'mama', dataRealizacao: '2026-09-01', resultado: { birads } });

describe('classificarExame (§42/§53) — casamento genérico por igualdade de campos da condição', () => {
  it('BI-RADS 1 → normal, verde, próxima data +12 meses, sem pendência', () => {
    const r = classificarExame(mamo(1), perfil, vazio, [regraB1, regraB4]);
    expect(r).toMatchObject({ classificacao: 'normal', nivelAlerta: 'verde', dataProximaAcao: '2027-09-01', abrePendencia: false, regraId: 'b1', regraVersao: '1' });
  });
  it('BI-RADS 4 → investigação, laranja, abre pendência, sem data', () => {
    const r = classificarExame(mamo(4), perfil, vazio, [regraB1, regraB4]);
    expect(r).toMatchObject({ classificacao: 'investigacao', nivelAlerta: 'laranja', dataProximaAcao: null, abrePendencia: true, regraId: 'b4' });
  });
  it('sem regra para o resultado → pendente, cinza, abre pendência', () => {
    const r = classificarExame(mamo(9), perfil, vazio, [regraB1]);
    expect(r).toMatchObject({ classificacao: 'pendente', nivelAlerta: 'cinza', abrePendencia: true, regraId: null });
  });
  it('sintoma de alarme sobrepõe regra normal', () => {
    const r = classificarExame(mamo(1), perfil, { ...vazio, sintomasAlarme: ['nodulo_mamario'] }, [regraB1]);
    expect(r.motivoSeguranca).toBe('sintoma_alarme');
    expect(r.nivelAlerta).toBe('vermelho');
    expect(r.dataProximaAcao).toBeNull();
  });
  it('classificação especializada abre pendência e não calcula data', () => {
    const regraB6: RegraParametros = { ...regraB4, id: 'b6', condicao: { birads: 6 }, classificacao: 'especializado', nivelAlerta: 'vermelho', intervaloMeses: 12 };
    const r = classificarExame(mamo(6), perfil, vazio, [regraB6]);
    expect(r).toMatchObject({ classificacao: 'especializado', dataProximaAcao: null, abrePendencia: true });
  });
});
```

- [ ] **Step 9: `classificar.ts` e `programas/index.ts`**

`programas/index.ts`:
```ts
import type { ProgramaHandlers } from '../tipos';
/** Fase 1 registra aqui: mama, colo_utero, colorretal, pulmao, prostata. */
export const handlers: ProgramaHandlers = {};
```

`classificar.ts`:
```ts
import { somarMeses } from './elegibilidade';
import { handlers as handlersPadrao } from './programas';
import { aplicarHierarquiaSeguranca } from './seguranca';
import type { Classificacao, ContextoAvaliacao, ExameEntrada, PerfilRegras, ProgramaHandlers, RegraParametros, ResultadoClassificacao } from './tipos';

const ABRE_PENDENCIA: ReadonlySet<Classificacao> = new Set(['complementar', 'investigacao', 'especializado', 'pendente']);
const CALCULA_DATA:   ReadonlySet<Classificacao> = new Set(['normal', 'controle']);

/** Casamento genérico: toda chave da condição da regra deve ser igual no resultado do exame. */
export function regraCasa(regra: RegraParametros, exame: ExameEntrada): boolean {
  const chaves = Object.keys(regra.condicao).filter((k) => !k.startsWith('idade_'));
  return chaves.length > 0 && chaves.every((k) => regra.condicao[k] === exame.resultado[k]);
}

export function classificarExame(
  exame: ExameEntrada, perfil: PerfilRegras, contexto: ContextoAvaliacao, regras: RegraParametros[],
  handlers: ProgramaHandlers = handlersPadrao,
): ResultadoClassificacao {
  const bloqueio = aplicarHierarquiaSeguranca(exame.programa, contexto);
  if (bloqueio) {
    return {
      classificacao: 'pendente', nivelAlerta: bloqueio.nivelAlerta, proximaAcao: 'Procure avaliação médica',
      dataProximaAcao: null, abrePendencia: true, mensagemPaciente: bloqueio.mensagemPaciente,
      regraId: null, regraVersao: null, motivoSeguranca: bloqueio.motivo,
    };
  }

  const handler = handlers[exame.programa];
  const regra = handler
    ? handler.selecionarRegra(exame, regras, perfil, contexto)
    : regras.find((r) => regraCasa(r, exame)) ?? null;

  if (!regra) {
    return {
      classificacao: 'pendente', nivelAlerta: 'cinza',
      proximaAcao: 'Registrar o resultado final ou procurar avaliação médica',
      dataProximaAcao: null, abrePendencia: true,
      mensagemPaciente: 'Seu rastreamento ainda não foi concluído. É necessário complementar este exame ou registrar o resultado final para que o NERO consiga atualizar seu acompanhamento.',
      regraId: null, regraVersao: null,
    };
  }

  const calculaData = CALCULA_DATA.has(regra.classificacao) && regra.intervaloMeses != null;
  return {
    classificacao: regra.classificacao,
    nivelAlerta: regra.nivelAlerta,
    proximaAcao: regra.proximaAcao,
    dataProximaAcao: calculaData ? somarMeses(exame.dataRealizacao, regra.intervaloMeses!) : null,
    abrePendencia: ABRE_PENDENCIA.has(regra.classificacao),
    mensagemPaciente: regra.mensagemPaciente,
    regraId: regra.id,
    regraVersao: regra.versao,
  };
}
```

- [ ] **Step 10: Rodar tudo (passa)** — `npx jest src/core/regras` → todos verdes, inclusive `sem-dependencias`.

- [ ] **Step 11: Commit**

```bash
git add src/core/regras
git commit -m "feat(regras): motor de regras clínicas — hierarquia de segurança, elegibilidade e classificação genérica, com testes

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 7: Perfil — repositório, hook e componentes de formulário

**Files:**
- Create: `src/core/perfil/mapeamento.ts`, `src/core/perfil/__tests__/mapeamento.test.ts`, `src/core/perfil/repositorio.ts`, `src/core/perfil/usePerfil.ts`, `src/ui/components/Select.tsx`, `src/ui/components/CampoData.tsx`, `src/ui/components/Opcoes.tsx`
- Modify: `src/ui/index.ts`

**Interfaces:**
- Consumes: `supabase`, `traduzirErro`, `PerfilSaude`, `AntecedenteFamiliar`.
- Produces: `paraDominio(row): PerfilSaude`, `paraBanco(perfil: Partial<PerfilSaude>): Update`, `obterPerfil(userId): Promise<PerfilSaude>`, `salvarPerfil(userId, dados: Partial<PerfilSaude>): Promise<void>`, `listarAntecedentes(userId)`, `salvarAntecedente(userId, a: Omit<AntecedenteFamiliar,'id'> & {id?: string})`, `excluirAntecedente(id)`, `usePerfil(): { perfil, antecedentes, carregando, erro, recarregar, salvar(dados), salvarAntecedente, excluirAntecedente }`; componentes `Select`, `CampoData`, `Opcoes`.

- [ ] **Step 1: Teste do mapeamento (falhando)**

`src/core/perfil/__tests__/mapeamento.test.ts`:
```ts
import { paraDominio, paraBanco } from '../mapeamento';

const row = {
  user_id: 'u1', nome: 'Ana', data_nascimento: '1980-05-02', sexo_nascimento: 'feminino', possui_colo_utero: true, histerectomia: false,
  altura_cm: 165, tabagismo_status: 'ex', cigarros_dia: 10, anos_fumando: 12, data_cessacao: '2020-01-01',
  tem_diabetes: false, tem_hipertensao: null, tem_doenca_renal: null, tem_imunossupressao: null, tem_hiv: null, tem_dii: null,
  historico_cancer_pessoal: [], lesoes_precursoras: [], doencas_geneticas: [{ nome: 'BRCA1' }], radioterapia_toracica: null,
  tipo_usuario: 'paciente', perfil_inicial_completo: true, created_at: '', updated_at: '',
};

test('paraDominio converte snake_case → camelCase', () => {
  const p = paraDominio(row as any);
  expect(p.dataNascimento).toBe('1980-05-02');
  expect(p.tabagismoStatus).toBe('ex');
  expect(p.doencasGeneticas).toEqual([{ nome: 'BRCA1' }]);
  expect(p.perfilInicialCompleto).toBe(true);
});

test('paraBanco converte só os campos presentes', () => {
  expect(paraBanco({ alturaCm: 170, temDiabetes: true })).toEqual({ altura_cm: 170, tem_diabetes: true });
});

test('ida e volta preserva os dados', () => {
  const p = paraDominio(row as any);
  const { userId, perfilInicialCompleto, ...resto } = p;
  const volta = paraDominio({ ...row, ...paraBanco(resto) } as any);
  expect(volta).toEqual(p);
});
```

- [ ] **Step 2: `mapeamento.ts`**

```ts
import type { Database } from '@core/supabase/database.types';
import type { PerfilSaude } from './tipos';

type Row = Database['public']['Tables']['perfil_saude']['Row'];
type Update = Database['public']['Tables']['perfil_saude']['Update'];

const mapa: Record<Exclude<keyof PerfilSaude, 'userId'>, keyof Update> = {
  nome: 'nome', dataNascimento: 'data_nascimento', sexoNascimento: 'sexo_nascimento', possuiColoUtero: 'possui_colo_utero',
  histerectomia: 'histerectomia', alturaCm: 'altura_cm', tabagismoStatus: 'tabagismo_status', cigarrosDia: 'cigarros_dia',
  anosFumando: 'anos_fumando', dataCessacao: 'data_cessacao', temDiabetes: 'tem_diabetes', temHipertensao: 'tem_hipertensao',
  temDoencaRenal: 'tem_doenca_renal', temImunossupressao: 'tem_imunossupressao', temHiv: 'tem_hiv', temDii: 'tem_dii',
  historicoCancerPessoal: 'historico_cancer_pessoal', lesoesPrecursoras: 'lesoes_precursoras', doencasGeneticas: 'doencas_geneticas',
  radioterapiaToracica: 'radioterapia_toracica', perfilInicialCompleto: 'perfil_inicial_completo',
};

export function paraDominio(r: Row): PerfilSaude {
  return {
    userId: r.user_id, nome: r.nome, dataNascimento: r.data_nascimento, sexoNascimento: r.sexo_nascimento as PerfilSaude['sexoNascimento'],
    possuiColoUtero: r.possui_colo_utero, histerectomia: r.histerectomia, alturaCm: r.altura_cm,
    tabagismoStatus: r.tabagismo_status as PerfilSaude['tabagismoStatus'], cigarrosDia: r.cigarros_dia, anosFumando: r.anos_fumando, dataCessacao: r.data_cessacao,
    temDiabetes: r.tem_diabetes, temHipertensao: r.tem_hipertensao, temDoencaRenal: r.tem_doenca_renal,
    temImunossupressao: r.tem_imunossupressao, temHiv: r.tem_hiv, temDii: r.tem_dii,
    historicoCancerPessoal: (r.historico_cancer_pessoal as PerfilSaude['historicoCancerPessoal']) ?? [],
    lesoesPrecursoras: (r.lesoes_precursoras as PerfilSaude['lesoesPrecursoras']) ?? [],
    doencasGeneticas: (r.doencas_geneticas as PerfilSaude['doencasGeneticas']) ?? [],
    radioterapiaToracica: r.radioterapia_toracica, perfilInicialCompleto: r.perfil_inicial_completo,
  };
}

export function paraBanco(p: Partial<Omit<PerfilSaude, 'userId'>>): Update {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    const col = mapa[k as keyof typeof mapa];
    if (col && v !== undefined) out[col] = v;
  }
  return out as Update;
}
```

- [ ] **Step 3: Rodar** — `npx jest src/core/perfil` → passa. (Se `database.types.ts` tipar `numeric` como `number`, ok; se como `string`, ajustar `Number(...)` em `alturaCm`, `anosFumando`.)

- [ ] **Step 4: `repositorio.ts`**

```ts
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { paraBanco, paraDominio } from './mapeamento';
import type { AntecedenteFamiliar, PerfilSaude } from './tipos';

export async function obterPerfil(userId: string): Promise<PerfilSaude> {
  const { data, error } = await supabase.from('perfil_saude').select('*').eq('user_id', userId).single();
  if (error) throw traduzirErro(error);
  return paraDominio(data);
}

export async function salvarPerfil(userId: string, dados: Partial<Omit<PerfilSaude, 'userId'>>): Promise<void> {
  const { error } = await supabase.from('perfil_saude').update(paraBanco(dados)).eq('user_id', userId);
  if (error) throw traduzirErro(error);
}

export async function listarAntecedentes(userId: string): Promise<AntecedenteFamiliar[]> {
  const { data, error } = await supabase.from('antecedentes_familiares').select('*').eq('user_id', userId).order('created_at');
  if (error) throw traduzirErro(error);
  return data.map((a) => ({ id: a.id, parentesco: a.parentesco as AntecedenteFamiliar['parentesco'], grau: a.grau as AntecedenteFamiliar['grau'], condicao: a.condicao as AntecedenteFamiliar['condicao'], idadeDiagnostico: a.idade_diagnostico, observacao: a.observacao }));
}

export async function salvarAntecedente(userId: string, a: Omit<AntecedenteFamiliar, 'id'> & { id?: string }): Promise<void> {
  const linha = { user_id: userId, parentesco: a.parentesco, grau: a.grau, condicao: a.condicao, idade_diagnostico: a.idadeDiagnostico, observacao: a.observacao };
  const { error } = a.id
    ? await supabase.from('antecedentes_familiares').update(linha).eq('id', a.id)
    : await supabase.from('antecedentes_familiares').insert(linha);
  if (error) throw traduzirErro(error);
}

export async function excluirAntecedente(id: string): Promise<void> {
  const { error } = await supabase.from('antecedentes_familiares').delete().eq('id', id);
  if (error) throw traduzirErro(error);
}
```

- [ ] **Step 5: `usePerfil.ts`**

```ts
import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import type { ErroNero } from '@core/supabase/erros';
import * as repo from './repositorio';
import type { AntecedenteFamiliar, PerfilSaude } from './tipos';

export function usePerfil() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [perfil, setPerfil] = useState<PerfilSaude | null>(null);
  const [antecedentes, setAntecedentes] = useState<AntecedenteFamiliar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true); setErro(null);
    try {
      const [p, a] = await Promise.all([repo.obterPerfil(userId), repo.listarAntecedentes(userId)]);
      setPerfil(p); setAntecedentes(a);
    } catch (e) { setErro(e as ErroNero); }
    finally { setCarregando(false); }
  }, [userId]);

  useEffect(() => { recarregar(); }, [recarregar]);

  const salvar = async (dados: Partial<Omit<PerfilSaude, 'userId'>>) => {
    if (!userId) return;
    await repo.salvarPerfil(userId, dados);
    setPerfil((p) => (p ? { ...p, ...dados } : p));
  };
  const salvarAntecedente = async (a: Omit<AntecedenteFamiliar, 'id'> & { id?: string }) => {
    if (!userId) return;
    await repo.salvarAntecedente(userId, a);
    setAntecedentes(await repo.listarAntecedentes(userId));
  };
  const excluirAntecedente = async (id: string) => {
    await repo.excluirAntecedente(id);
    setAntecedentes((l) => l.filter((x) => x.id !== id));
  };

  return { perfil, antecedentes, carregando, erro, recarregar, salvar, salvarAntecedente, excluirAntecedente };
}
```

- [ ] **Step 6: Componentes de formulário**

`src/ui/components/Opcoes.tsx` — grupo de botões (uma ou várias escolhas):
```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

export interface Opcao<T extends string> { valor: T; rotulo: string; descricao?: string; }
interface Props<T extends string> {
  opcoes: Opcao<T>[]; valor: T | T[] | null; onChange: (v: T) => void; multiplo?: boolean;
}

export function Opcoes<T extends string>({ opcoes, valor, onChange, multiplo }: Props<T>) {
  const selecionado = (v: T) => (Array.isArray(valor) ? valor.includes(v) : valor === v);
  return (
    <View style={styles.grupo}>
      {opcoes.map((o) => (
        <Pressable key={o.valor} onPress={() => onChange(o.valor)} style={[styles.item, selecionado(o.valor) && styles.ativo]}
          accessibilityRole={multiplo ? 'checkbox' : 'radio'} accessibilityState={{ selected: selecionado(o.valor) }}>
          <Text style={[styles.rotulo, selecionado(o.valor) && styles.rotuloAtivo]}>{o.rotulo}</Text>
          {o.descricao ? <Text style={styles.descricao}>{o.descricao}</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: Spacing.sm },
  item: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.lg },
  ativo: { borderColor: Colors.primary, backgroundColor: '#eef3fb' },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary },
  rotuloAtivo: { color: Colors.primary },
  descricao: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
});
```

`src/ui/components/CampoData.tsx` — três campos numéricos DD / MM / AAAA (sem lib nativa; funciona no Expo Go):
```tsx
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

interface Props { valor: string | null; onChange: (iso: string | null) => void; rotulo?: string; }

/** Valor em ISO 'AAAA-MM-DD'; devolve null enquanto incompleto ou inválido. */
export function CampoData({ valor, onChange, rotulo }: Props) {
  const [d, setD] = useState(valor?.slice(8, 10) ?? '');
  const [m, setM] = useState(valor?.slice(5, 7) ?? '');
  const [a, setA] = useState(valor?.slice(0, 4) ?? '');

  const emitir = (dd: string, mm: string, aa: string) => {
    if (dd.length === 2 && mm.length === 2 && aa.length === 4) {
      const iso = `${aa}-${mm}-${dd}`;
      const dt = new Date(`${iso}T00:00:00Z`);
      const valida = !isNaN(dt.getTime()) && dt.toISOString().slice(0, 10) === iso && dt <= new Date();
      onChange(valida ? iso : null);
    } else onChange(null);
  };

  return (
    <View>
      {rotulo ? <Text style={styles.rotulo}>{rotulo}</Text> : null}
      <View style={styles.linha}>
        <TextInput style={styles.campo} placeholder="DD" keyboardType="number-pad" maxLength={2} value={d} onChangeText={(v) => { setD(v); emitir(v, m, a); }} />
        <Text style={styles.sep}>/</Text>
        <TextInput style={styles.campo} placeholder="MM" keyboardType="number-pad" maxLength={2} value={m} onChangeText={(v) => { setM(v); emitir(d, v, a); }} />
        <Text style={styles.sep}>/</Text>
        <TextInput style={[styles.campo, { flex: 1.6 }]} placeholder="AAAA" keyboardType="number-pad" maxLength={4} value={a} onChangeText={(v) => { setA(v); emitir(d, m, v); }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginBottom: Spacing.sm },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  campo: { flex: 1, ...Typography.body, color: Colors.textPrimary, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, textAlign: 'center' },
  sep: { ...Typography.title, color: Colors.textMuted },
});
```

`src/ui/components/Select.tsx` — lista de opções em modal simples:
```tsx
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';
import type { Opcao } from './Opcoes';

interface Props<T extends string> { opcoes: Opcao<T>[]; valor: T | null; onChange: (v: T) => void; placeholder?: string; }

export function Select<T extends string>({ opcoes, valor, onChange, placeholder = 'Selecione' }: Props<T>) {
  const [aberto, setAberto] = useState(false);
  const atual = opcoes.find((o) => o.valor === valor);
  return (
    <>
      <Pressable onPress={() => setAberto(true)} style={styles.campo}>
        <Text style={[styles.texto, !atual && { color: Colors.textMuted }]}>{atual?.rotulo ?? placeholder}</Text>
        <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
      </Pressable>
      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable style={styles.fundo} onPress={() => setAberto(false)}>
          <View style={styles.caixa}>
            <FlatList data={opcoes} keyExtractor={(o) => o.valor} renderItem={({ item }) => (
              <Pressable style={styles.opcao} onPress={() => { onChange(item.valor); setAberto(false); }}>
                <Text style={[styles.texto, item.valor === valor && { color: Colors.primary, fontFamily: 'Poppins-SemiBold' }]}>{item.rotulo}</Text>
              </Pressable>
            )} />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  campo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4 },
  texto: { ...Typography.body, color: Colors.textPrimary },
  fundo: { flex: 1, backgroundColor: 'rgba(15,45,99,0.35)', justifyContent: 'flex-end' },
  caixa: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, maxHeight: '60%', paddingVertical: Spacing.md },
  opcao: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
});
```

Exportar em `src/ui/index.ts`: `export { Opcoes } from './components/Opcoes'; export type { Opcao } from './components/Opcoes'; export { CampoData } from './components/CampoData'; export { Select } from './components/Select';`

- [ ] **Step 7: `npx tsc --noEmit` e `npx jest`** → sem erros, todos os testes verdes.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat(perfil): repositório, hook usePerfil e componentes de formulário (Opcoes, CampoData, Select)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 8: Perfil inicial em 6 passos

**Files:**
- Create: `src/modules/minha-saude/opcoes.ts`, `src/modules/minha-saude/PassoPerfil.tsx`
- Modify: `app/perfil-inicial.tsx` (substitui o provisório)

**Interfaces:**
- Consumes: `usePerfil`, `salvar`, `supabase` (peso → `medidas`), `Opcoes`, `CampoData`, `Input`, `Button`, `ProgressBar`.
- Produces: `OPCOES_SEXO`, `OPCOES_TABAGISMO`, `OPCOES_CONDICOES`, `OPCOES_PARENTESCO`, `OPCOES_GRAU`, `OPCOES_CONDICAO_FAMILIAR` (reutilizadas na Task 9); `PassoPerfil` (moldura de um passo).

- [ ] **Step 1: `opcoes.ts`**

```ts
import type { Opcao } from '@ui/components/Opcoes';
import type { CondicaoFamiliar, GrauParentesco, Parentesco, SexoNascimento, TabagismoStatus } from '@core/perfil/tipos';

export const OPCOES_SEXO: Opcao<SexoNascimento>[] = [
  { valor: 'feminino', rotulo: 'Feminino' }, { valor: 'masculino', rotulo: 'Masculino' },
];
export const OPCOES_TABAGISMO: Opcao<TabagismoStatus>[] = [
  { valor: 'nunca', rotulo: 'Nunca fumei' }, { valor: 'ex', rotulo: 'Já fumei, mas parei' }, { valor: 'atual', rotulo: 'Fumo atualmente' },
];
export type CondicaoChave = 'temDiabetes' | 'temHipertensao' | 'temDoencaRenal' | 'temImunossupressao' | 'temHiv' | 'temDii' | 'nenhuma';
export const OPCOES_CONDICOES: Opcao<CondicaoChave>[] = [
  { valor: 'temDiabetes', rotulo: 'Diabetes' },
  { valor: 'temHipertensao', rotulo: 'Pressão alta (hipertensão)' },
  { valor: 'temDoencaRenal', rotulo: 'Doença renal crônica' },
  { valor: 'temImunossupressao', rotulo: 'Imunossupressão', descricao: 'Transplante, quimioterapia, corticoide prolongado…' },
  { valor: 'temHiv', rotulo: 'HIV' },
  { valor: 'temDii', rotulo: 'Doença inflamatória intestinal', descricao: 'Crohn ou retocolite ulcerativa' },
  { valor: 'nenhuma', rotulo: 'Nenhuma destas' },
];
export const OPCOES_PARENTESCO: Opcao<Parentesco>[] = [
  { valor: 'mae', rotulo: 'Mãe' }, { valor: 'pai', rotulo: 'Pai' }, { valor: 'irma_o', rotulo: 'Irmã / irmão' }, { valor: 'filha_o', rotulo: 'Filha / filho' },
  { valor: 'avo_a', rotulo: 'Avó / avô' }, { valor: 'tia_o', rotulo: 'Tia / tio' }, { valor: 'outro', rotulo: 'Outro' },
];
export const OPCOES_GRAU: Opcao<GrauParentesco>[] = [
  { valor: 'primeiro', rotulo: '1º grau', descricao: 'pais, irmãos, filhos' }, { valor: 'segundo', rotulo: '2º grau', descricao: 'avós, tios, netos' }, { valor: 'outro', rotulo: 'Outro' },
];
export const OPCOES_CONDICAO_FAMILIAR: Opcao<CondicaoFamiliar>[] = [
  { valor: 'mama', rotulo: 'Câncer de mama' }, { valor: 'ovario', rotulo: 'Câncer de ovário' }, { valor: 'colorretal', rotulo: 'Câncer colorretal (intestino)' },
  { valor: 'prostata', rotulo: 'Câncer de próstata' }, { valor: 'pulmao', rotulo: 'Câncer de pulmão' }, { valor: 'colo_utero', rotulo: 'Câncer do colo do útero' },
  { valor: 'dcv_prematura', rotulo: 'Infarto ou AVC antes dos 55 (homem) / 65 (mulher)' }, { valor: 'outro', rotulo: 'Outro' },
];
```

- [ ] **Step 2: `PassoPerfil.tsx`**

```tsx
import React from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Colors, ProgressBar, Spacing, Typography } from '@ui/index';

interface Props {
  passo: number; total: number; titulo: string; ajuda?: string;
  podeAvancar: boolean; ultimo?: boolean; podePular?: boolean; salvando?: boolean;
  onAvancar: () => void; onVoltar?: () => void; onPular?: () => void; children: React.ReactNode;
}

export function PassoPerfil({ passo, total, titulo, ajuda, podeAvancar, ultimo, podePular, salvando, onAvancar, onVoltar, onPular, children }: Props) {
  return (
    <SafeAreaView style={styles.tela}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.topo}>
          <ProgressBar value={Math.round((passo / total) * 100)} label={`Passo ${passo} de ${total}`} />
        </View>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <Text style={styles.titulo}>{titulo}</Text>
          {ajuda ? <Text style={styles.ajuda}>{ajuda}</Text> : null}
          <View style={{ marginTop: Spacing.xl }}>{children}</View>
        </ScrollView>
        <View style={styles.rodape}>
          {onVoltar ? <Button label="Voltar" variant="ghost" onPress={onVoltar} /> : <View />}
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {podePular && onPular ? <Button label="Pular por agora" variant="outline" onPress={onPular} /> : null}
            <Button label={ultimo ? 'Concluir' : 'Continuar'} onPress={onAvancar} disabled={!podeAvancar} loading={salvando} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  topo: { padding: Spacing.xl, paddingBottom: 0 },
  conteudo: { padding: Spacing.xl },
  titulo: { ...Typography.display, fontSize: 24, color: Colors.primary },
  ajuda: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.sm },
  rodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, paddingTop: Spacing.md },
});
```
(Se `ProgressBar` movido na Task 2 não aceitar `label`/`value` com essa assinatura, ajustar o componente para `{ value: number; label?: string }`.)

- [ ] **Step 3: `app/perfil-inicial.tsx`**

```tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { usePerfil } from '@core/perfil/usePerfil';
import type { SexoNascimento, TabagismoStatus } from '@core/perfil/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { PassoPerfil } from '@modules/minha-saude/PassoPerfil';
import { OPCOES_CONDICOES, OPCOES_SEXO, OPCOES_TABAGISMO, type CondicaoChave } from '@modules/minha-saude/opcoes';
import { CampoData, Colors, Input, Opcoes, Spacing, Typography } from '@ui/index';

export default function PerfilInicial() {
  const router = useRouter();
  const { sessao } = useSessao();
  const { salvar } = usePerfil();
  const [passo, setPasso] = useState(1);
  const [salvando, setSalvando] = useState(false);

  const [dataNascimento, setDataNascimento] = useState<string | null>(null);
  const [sexo, setSexo] = useState<SexoNascimento | null>(null);
  const [possuiColo, setPossuiColo] = useState<'sim' | 'nao' | null>(null);
  const [altura, setAltura] = useState('');
  const [peso, setPeso] = useState('');
  const [tabagismo, setTabagismo] = useState<TabagismoStatus | null>(null);
  const [cigarros, setCigarros] = useState('');
  const [anos, setAnos] = useState('');
  const [cessacao, setCessacao] = useState<string | null>(null);
  const [condicoes, setCondicoes] = useState<CondicaoChave[]>([]);

  const feminino = sexo === 'feminino';
  const TOTAL = feminino ? 6 : 5;
  // passos lógicos: 1 nascimento · 2 sexo · 3 colo (só feminino) · 4 altura/peso · 5 tabagismo · 6 condições
  const logico = feminino || passo < 3 ? passo : passo + 1;

  const toggleCondicao = (c: CondicaoChave) =>
    setCondicoes((l) => (c === 'nenhuma' ? ['nenhuma'] : l.includes(c) ? l.filter((x) => x !== c) : [...l.filter((x) => x !== 'nenhuma'), c]));

  const concluir = async (pularUltimo = false) => {
    if (!sessao) return;
    setSalvando(true);
    try {
      const cond = pularUltimo ? {} : {
        temDiabetes: condicoes.includes('temDiabetes'), temHipertensao: condicoes.includes('temHipertensao'),
        temDoencaRenal: condicoes.includes('temDoencaRenal'), temImunossupressao: condicoes.includes('temImunossupressao'),
        temHiv: condicoes.includes('temHiv'), temDii: condicoes.includes('temDii'),
      };
      await salvar({
        dataNascimento, sexoNascimento: sexo,
        possuiColoUtero: feminino ? possuiColo === 'sim' : false,
        alturaCm: altura ? Number(altura.replace(',', '.')) : null,
        tabagismoStatus: tabagismo,
        cigarrosDia: tabagismo && tabagismo !== 'nunca' && cigarros ? Number(cigarros) : null,
        anosFumando: tabagismo && tabagismo !== 'nunca' && anos ? Number(anos.replace(',', '.')) : null,
        dataCessacao: tabagismo === 'ex' ? cessacao : null,
        ...cond, perfilInicialCompleto: true,
      });
      if (peso) {
        const { error } = await supabase.from('medidas').insert({ user_id: sessao.user.id, tipo: 'peso', medido_em: new Date().toISOString(), valores: { kg: Number(peso.replace(',', '.')) } });
        if (error) throw traduzirErro(error);
      }
      router.replace('/');
    } catch (e) {
      Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario);
    } finally { setSalvando(false); }
  };

  const avancar = () => (passo === TOTAL ? concluir() : setPasso(passo + 1));
  const voltar = passo > 1 ? () => setPasso(passo - 1) : undefined;
  const pularEste = () => (passo === TOTAL ? concluir(true) : setPasso(passo + 1));
  const comum = { passo, total: TOTAL, onAvancar: avancar, onVoltar: voltar, salvando, ultimo: passo === TOTAL };

  switch (logico) {
    case 1: return (
      <PassoPerfil {...comum} titulo="Quando você nasceu?" ajuda="Usamos sua idade para saber quais acompanhamentos fazem sentido para você." podeAvancar={!!dataNascimento}>
        <CampoData valor={dataNascimento} onChange={setDataNascimento} />
      </PassoPerfil>);
    case 2: return (
      <PassoPerfil {...comum} titulo="Sexo atribuído ao nascimento" ajuda="Alguns rastreamentos dependem de órgãos presentes ao nascimento. Essa informação não define sua identidade." podeAvancar={!!sexo}>
        <Opcoes opcoes={OPCOES_SEXO} valor={sexo} onChange={setSexo} />
      </PassoPerfil>);
    case 3: return (
      <PassoPerfil {...comum} titulo="Você possui colo do útero?" ajuda="Quem passou por histerectomia total não possui colo do útero. Se não tiver certeza, marque 'sim' e converse com seu médico." podeAvancar={!!possuiColo}>
        <Opcoes opcoes={[{ valor: 'sim' as const, rotulo: 'Sim' }, { valor: 'nao' as const, rotulo: 'Não (histerectomia)' }]} valor={possuiColo} onChange={setPossuiColo} />
      </PassoPerfil>);
    case 4: return (
      <PassoPerfil {...comum} titulo="Altura e peso" ajuda="O peso pode ser atualizado sempre que quiser; a altura fica no seu perfil." podeAvancar={!!altura || !!peso} podePular onPular={pularEste}>
        <View style={{ gap: Spacing.md }}>
          <Input placeholder="Altura em cm (ex.: 165)" keyboardType="decimal-pad" value={altura} onChangeText={setAltura} />
          <Input placeholder="Peso em kg (ex.: 67,5)" keyboardType="decimal-pad" value={peso} onChangeText={setPeso} />
        </View>
      </PassoPerfil>);
    case 5: return (
      <PassoPerfil {...comum} titulo="Tabagismo" ajuda="Essa informação alimenta o risco cardiovascular e o rastreamento de câncer de pulmão." podeAvancar={!!tabagismo} podePular onPular={pularEste}>
        <View style={{ gap: Spacing.md }}>
          <Opcoes opcoes={OPCOES_TABAGISMO} valor={tabagismo} onChange={setTabagismo} />
          {tabagismo && tabagismo !== 'nunca' ? (<>
            <Input placeholder="Cigarros por dia (média)" keyboardType="number-pad" value={cigarros} onChangeText={setCigarros} />
            <Input placeholder="Anos fumando" keyboardType="decimal-pad" value={anos} onChangeText={setAnos} />
          </>) : null}
          {tabagismo === 'ex' ? <CampoData rotulo="Quando parou?" valor={cessacao} onChange={setCessacao} /> : null}
        </View>
      </PassoPerfil>);
    default: return (
      <PassoPerfil {...comum} titulo="Você tem alguma destas condições?" ajuda="Marque todas que se aplicam." podeAvancar={condicoes.length > 0} podePular onPular={pularEste}>
        <Opcoes opcoes={OPCOES_CONDICOES} valor={condicoes} onChange={toggleCondicao} multiplo />
        <Text style={{ ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.lg }}>Você poderá completar o restante do perfil (antecedentes familiares, histórico) em Minha Saúde.</Text>
      </PassoPerfil>);
  }
}
```

- [ ] **Step 4: Verificar no celular**

Novo cadastro → 5 ou 6 passos conforme sexo → Home provisória. No Studio: `perfil_saude` com campos preenchidos e `perfil_inicial_completo = true`; `medidas` com a linha de peso. Fechar e reabrir o app: vai direto à Home.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(perfil): perfil inicial em passos após o cadastro

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 9: Minha Saúde — lista, Meu Perfil completo e Antecedentes familiares

**Files:**
- Create: `app/(app)/minha-saude/_layout.tsx`, `app/(app)/minha-saude/index.tsx`, `app/(app)/minha-saude/perfil.tsx`, `app/(app)/minha-saude/antecedentes.tsx`, `src/modules/minha-saude/Secao.tsx`, `src/modules/minha-saude/ListaTexto.tsx`

**Interfaces:**
- Consumes: `usePerfil`, opções da Task 8, `Opcoes`, `Select`, `CampoData`, `Input`, `Button`, `Card`, `ListItem`, `InternalHeader`, `EmBreveBadge`.

- [ ] **Step 1: `Secao.tsx`** (título + cartão)

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, Colors, Spacing, Typography } from '@ui/index';

export function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.secao}>
      <Text style={styles.titulo}>{titulo}</Text>
      <Card style={{ gap: Spacing.md, padding: Spacing.lg }}>{children}</Card>
    </View>
  );
}
const styles = StyleSheet.create({
  secao: { marginBottom: Spacing.xl },
  titulo: { ...Typography.label, color: Colors.textMuted, marginBottom: Spacing.sm, marginLeft: Spacing.xs },
});
```

- [ ] **Step 2: `ListaTexto.tsx`** (editar listas `{tipo|nome, ano?}` — histórico de câncer, lesões, doenças genéticas)

```tsx
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Colors, Input, Spacing, Typography } from '@ui/index';

interface Item { texto: string; ano?: number }
interface Props { itens: Item[]; onChange: (itens: Item[]) => void; placeholder: string; comAno?: boolean; }

export function ListaTexto({ itens, onChange, placeholder, comAno }: Props) {
  const [texto, setTexto] = useState('');
  const [ano, setAno] = useState('');
  const adicionar = () => {
    if (!texto.trim()) return;
    onChange([...itens, { texto: texto.trim(), ano: comAno && ano ? Number(ano) : undefined }]);
    setTexto(''); setAno('');
  };
  return (
    <View style={{ gap: Spacing.sm }}>
      {itens.map((it, i) => (
        <View key={i} style={styles.item}>
          <Text style={styles.texto}>{it.texto}{it.ano ? ` (${it.ano})` : ''}</Text>
          <Pressable onPress={() => onChange(itens.filter((_, j) => j !== i))} accessibilityLabel="Remover"><Ionicons name="close-circle" size={20} color={Colors.textMuted} /></Pressable>
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <Input style={{ flex: 1 }} placeholder={placeholder} value={texto} onChangeText={setTexto} />
        {comAno ? <Input style={{ width: 90 }} placeholder="Ano" keyboardType="number-pad" maxLength={4} value={ano} onChangeText={setAno} /> : null}
      </View>
      <Button label="Adicionar" variant="outline" onPress={adicionar} disabled={!texto.trim()} />
    </View>
  );
}
const styles = StyleSheet.create({
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surfaceAlt, borderRadius: 8, padding: Spacing.md },
  texto: { ...Typography.body, color: Colors.textPrimary },
});
```

- [ ] **Step 3: Rotas**

`app/(app)/minha-saude/_layout.tsx`: `import { Stack } from 'expo-router'; export default () => <Stack screenOptions={{ headerShown: false }} />;`

`app/(app)/minha-saude/index.tsx`:
```tsx
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSessao } from '@core/sessao/SessaoProvider';
import { usePerfil } from '@core/perfil/usePerfil';
import { Button, Colors, EmBreveBadge, ListItem, NeroImage, Spacing, Typography } from '@ui/index';

export default function MinhaSaude() {
  const router = useRouter();
  const { sair } = useSessao();
  const { perfil, antecedentes } = usePerfil();
  return (
    <SafeAreaView style={styles.tela}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.cabecalho}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rotulo}>MINHA SAÚDE</Text>
            <Text style={styles.titulo}>{perfil?.nome || 'Seu perfil'}</Text>
          </View>
          <NeroImage variant="minha_saude" size={72} />
        </View>
        <View style={{ gap: Spacing.md }}>
          <ListItem icon="person-outline" title="Meu Perfil" subtitle="Dados básicos, tabagismo, condições e histórico" onPress={() => router.push('/(app)/minha-saude/perfil')} />
          <ListItem icon="people-outline" title="Antecedentes familiares" subtitle={antecedentes.length ? `${antecedentes.length} registrado(s)` : 'Nenhum registrado'} onPress={() => router.push('/(app)/minha-saude/antecedentes')} />
          <ListItem icon="medkit-outline" title="Meus Medicamentos" subtitle="Lista atual e histórico" onPress={() => router.push('/(app)/minha-saude/medicamentos')} />
          <EmBreve titulo="Meus Exames" /><EmBreve titulo="Meus Documentos" /><EmBreve titulo="Linha do tempo" /><EmBreve titulo="Relatórios" />
        </View>
        <Button label="Sair da conta" variant="ghost" onPress={sair} style={{ marginTop: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function EmBreve({ titulo }: { titulo: string }) {
  return (
    <View style={styles.emBreve}>
      <Text style={[Typography.subheading, { color: Colors.textMuted, flex: 1 }]}>{titulo}</Text>
      <EmBreveBadge />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xl },
  cabecalho: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  rotulo: { ...Typography.label, color: Colors.textMuted },
  titulo: { ...Typography.display, fontSize: 26, color: Colors.primary },
  emBreve: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceAlt, borderRadius: 16, padding: Spacing.lg, opacity: 0.8 },
});
```

`app/(app)/minha-saude/perfil.tsx`:
```tsx
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { calcularIdade, calcularMacosAno } from '@core/perfil/calculos';
import type { PerfilSaude } from '@core/perfil/tipos';
import { usePerfil } from '@core/perfil/usePerfil';
import { traduzirErro } from '@core/supabase/erros';
import { ListaTexto } from '@modules/minha-saude/ListaTexto';
import { Secao } from '@modules/minha-saude/Secao';
import { OPCOES_CONDICOES, OPCOES_SEXO, OPCOES_TABAGISMO, type CondicaoChave } from '@modules/minha-saude/opcoes';
import { Button, CampoData, Colors, Input, InternalHeader, Opcoes, Spacing, Typography } from '@ui/index';

type Form = Omit<PerfilSaude, 'userId' | 'perfilInicialCompleto'>;
const CHAVES_CONDICAO: Exclude<CondicaoChave, 'nenhuma'>[] = ['temDiabetes', 'temHipertensao', 'temDoencaRenal', 'temImunossupressao', 'temHiv', 'temDii'];

export default function MeuPerfil() {
  const router = useRouter();
  const { perfil, carregando, salvar } = usePerfil();
  const [f, setF] = useState<Form | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { if (perfil && !f) { const { userId, perfilInicialCompleto, ...resto } = perfil; setF(resto); } }, [perfil]);
  if (carregando || !f) return <View style={styles.centro}><ActivityIndicator color={Colors.primary} /></View>;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((a) => (a ? { ...a, [k]: v } : a));
  const condicoesMarcadas = CHAVES_CONDICAO.filter((k) => f[k] === true);
  const toggleCondicao = (c: CondicaoChave) => {
    if (c === 'nenhuma') { CHAVES_CONDICAO.forEach((k) => set(k, false)); return; }
    set(c, !f[c]);
  };

  const gravar = async () => {
    setSalvando(true);
    try { await salvar(f); Alert.alert('Perfil salvo'); router.back(); }
    catch (e) { Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario); }
    finally { setSalvando(false); }
  };

  const idade = f.dataNascimento ? calcularIdade(f.dataNascimento) : null;
  const macos = calcularMacosAno(f.cigarrosDia, f.anosFumando);

  return (
    <SafeAreaView style={styles.tela}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Minha Saúde" title="Meu Perfil" />
        <Secao titulo="Dados básicos">
          <Input placeholder="Nome" value={f.nome} onChangeText={(v) => set('nome', v)} />
          <CampoData rotulo={idade != null ? `Data de nascimento · ${idade} anos` : 'Data de nascimento'} valor={f.dataNascimento} onChange={(v) => set('dataNascimento', v)} />
          <Text style={styles.rotulo}>Sexo ao nascimento</Text>
          <Opcoes opcoes={OPCOES_SEXO} valor={f.sexoNascimento} onChange={(v) => set('sexoNascimento', v)} />
          {f.sexoNascimento === 'feminino' ? (<>
            <Text style={styles.rotulo}>Possui colo do útero?</Text>
            <Opcoes opcoes={[{ valor: 'sim' as const, rotulo: 'Sim' }, { valor: 'nao' as const, rotulo: 'Não (histerectomia)' }]} valor={f.possuiColoUtero == null ? null : f.possuiColoUtero ? 'sim' : 'nao'} onChange={(v) => { set('possuiColoUtero', v === 'sim'); set('histerectomia', v === 'nao'); }} />
          </>) : null}
          <Input placeholder="Altura (cm)" keyboardType="decimal-pad" value={f.alturaCm?.toString() ?? ''} onChangeText={(v) => set('alturaCm', v ? Number(v.replace(',', '.')) : null)} />
        </Secao>

        <Secao titulo={macos != null ? `Tabagismo · ${macos} maços-ano` : 'Tabagismo'}>
          <Opcoes opcoes={OPCOES_TABAGISMO} valor={f.tabagismoStatus} onChange={(v) => set('tabagismoStatus', v)} />
          {f.tabagismoStatus && f.tabagismoStatus !== 'nunca' ? (<>
            <Input placeholder="Cigarros por dia" keyboardType="number-pad" value={f.cigarrosDia?.toString() ?? ''} onChangeText={(v) => set('cigarrosDia', v ? Number(v) : null)} />
            <Input placeholder="Anos fumando" keyboardType="decimal-pad" value={f.anosFumando?.toString() ?? ''} onChangeText={(v) => set('anosFumando', v ? Number(v.replace(',', '.')) : null)} />
          </>) : null}
          {f.tabagismoStatus === 'ex' ? <CampoData rotulo="Quando parou?" valor={f.dataCessacao} onChange={(v) => set('dataCessacao', v)} /> : null}
        </Secao>

        <Secao titulo="Condições de saúde">
          <Opcoes opcoes={OPCOES_CONDICOES} valor={condicoesMarcadas.length ? condicoesMarcadas : ['nenhuma']} onChange={toggleCondicao} multiplo />
        </Secao>

        <Secao titulo="Histórico pessoal de câncer">
          <ListaTexto comAno placeholder="Tipo de câncer" itens={f.historicoCancerPessoal.map((h) => ({ texto: h.tipo, ano: h.ano }))} onChange={(l) => set('historicoCancerPessoal', l.map((i) => ({ tipo: i.texto, ano: i.ano })))} />
        </Secao>
        <Secao titulo="Lesões precursoras (pólipos, NIC, etc.)">
          <ListaTexto comAno placeholder="Lesão" itens={f.lesoesPrecursoras.map((h) => ({ texto: h.tipo, ano: h.ano }))} onChange={(l) => set('lesoesPrecursoras', l.map((i) => ({ tipo: i.texto, ano: i.ano })))} />
        </Secao>
        <Secao titulo="Doenças genéticas conhecidas">
          <ListaTexto placeholder="Ex.: BRCA1, Lynch, PAF" itens={f.doencasGeneticas.map((d) => ({ texto: d.nome }))} onChange={(l) => set('doencasGeneticas', l.map((i) => ({ nome: i.texto })))} />
        </Secao>
        <Secao titulo="Radioterapia no tórax antes dos 30 anos">
          <Opcoes opcoes={[{ valor: 'sim' as const, rotulo: 'Sim' }, { valor: 'nao' as const, rotulo: 'Não' }]} valor={f.radioterapiaToracica == null ? null : f.radioterapiaToracica ? 'sim' : 'nao'} onChange={(v) => set('radioterapiaToracica', v === 'sim')} />
        </Secao>

        <Button label="Salvar" onPress={gravar} loading={salvando} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary },
});
```

`app/(app)/minha-saude/antecedentes.tsx`:
```tsx
import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AntecedenteFamiliar, CondicaoFamiliar, GrauParentesco, Parentesco } from '@core/perfil/tipos';
import { usePerfil } from '@core/perfil/usePerfil';
import { traduzirErro } from '@core/supabase/erros';
import { Secao } from '@modules/minha-saude/Secao';
import { OPCOES_CONDICAO_FAMILIAR, OPCOES_GRAU, OPCOES_PARENTESCO } from '@modules/minha-saude/opcoes';
import { Button, Card, Colors, Input, InternalHeader, Select, Spacing, Typography } from '@ui/index';

const rotulo = <T extends string>(lista: { valor: T; rotulo: string }[], v: T) => lista.find((o) => o.valor === v)?.rotulo ?? v;

export default function Antecedentes() {
  const { antecedentes, salvarAntecedente, excluirAntecedente } = usePerfil();
  const [editando, setEditando] = useState<Partial<AntecedenteFamiliar> | null>(null);
  const [salvando, setSalvando] = useState(false);

  const gravar = async () => {
    if (!editando?.parentesco || !editando.grau || !editando.condicao) return Alert.alert('Atenção', 'Informe parentesco, grau e condição.');
    setSalvando(true);
    try {
      await salvarAntecedente({ id: editando.id, parentesco: editando.parentesco, grau: editando.grau, condicao: editando.condicao, idadeDiagnostico: editando.idadeDiagnostico ?? null, observacao: editando.observacao ?? null });
      setEditando(null);
    } catch (e) { Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario); }
    finally { setSalvando(false); }
  };

  const excluir = (a: AntecedenteFamiliar) => Alert.alert('Excluir', `Remover ${rotulo(OPCOES_PARENTESCO, a.parentesco)} — ${rotulo(OPCOES_CONDICAO_FAMILIAR, a.condicao)}?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: () => excluirAntecedente(a.id).catch((e) => Alert.alert('Erro', traduzirErro(e).mensagemUsuario)) },
  ]);

  return (
    <SafeAreaView style={styles.tela}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Minha Saúde" title="Antecedentes familiares" />
        <Text style={styles.ajuda}>Registre casos de câncer e de infarto/AVC precoce em familiares. A idade ao diagnóstico ajuda a definir quando você deve começar alguns rastreamentos.</Text>

        {antecedentes.map((a) => (
          <Card key={a.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitulo}>{rotulo(OPCOES_CONDICAO_FAMILIAR, a.condicao)}</Text>
              <Text style={styles.cardSub}>{rotulo(OPCOES_PARENTESCO, a.parentesco)} · {rotulo(OPCOES_GRAU, a.grau)}{a.idadeDiagnostico ? ` · diagnóstico aos ${a.idadeDiagnostico} anos` : ''}</Text>
            </View>
            <Pressable onPress={() => setEditando(a)} hitSlop={8}><Ionicons name="create-outline" size={20} color={Colors.textSecondary} /></Pressable>
            <Pressable onPress={() => excluir(a)} hitSlop={8}><Ionicons name="trash-outline" size={20} color={Colors.danger} /></Pressable>
          </Card>
        ))}

        {editando ? (
          <Secao titulo={editando.id ? 'Editar antecedente' : 'Novo antecedente'}>
            <Select placeholder="Condição" opcoes={OPCOES_CONDICAO_FAMILIAR} valor={editando.condicao ?? null} onChange={(v: CondicaoFamiliar) => setEditando({ ...editando, condicao: v })} />
            <Select placeholder="Parentesco" opcoes={OPCOES_PARENTESCO} valor={editando.parentesco ?? null} onChange={(v: Parentesco) => setEditando({ ...editando, parentesco: v, grau: ['mae', 'pai', 'irma_o', 'filha_o'].includes(v) ? 'primeiro' : ['avo_a', 'tia_o'].includes(v) ? 'segundo' : editando.grau })} />
            <Select placeholder="Grau" opcoes={OPCOES_GRAU} valor={editando.grau ?? null} onChange={(v: GrauParentesco) => setEditando({ ...editando, grau: v })} />
            <Input placeholder="Idade ao diagnóstico (se souber)" keyboardType="number-pad" value={editando.idadeDiagnostico?.toString() ?? ''} onChangeText={(v) => setEditando({ ...editando, idadeDiagnostico: v ? Number(v) : null })} />
            <Input placeholder="Observação" value={editando.observacao ?? ''} onChangeText={(v) => setEditando({ ...editando, observacao: v })} />
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Button label="Cancelar" variant="ghost" onPress={() => setEditando(null)} style={{ flex: 1 }} />
              <Button label="Salvar" onPress={gravar} loading={salvando} style={{ flex: 1 }} />
            </View>
          </Secao>
        ) : <Button label="+ Adicionar antecedente" variant="outline" onPress={() => setEditando({})} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl, gap: Spacing.md },
  ajuda: { ...Typography.body, color: Colors.textSecondary },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  cardTitulo: { ...Typography.subheading, color: Colors.textPrimary },
  cardSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
});
```

- [ ] **Step 3b: Sem conexão → botão Salvar desabilitado com aviso (spec §7)**

Em `perfil.tsx`, `antecedentes.tsx` e, na Task 10, `medicamentos.tsx`: obter `const { online } = useSessao();` e trocar o botão de salvar por:
```tsx
{!online ? <Text style={{ ...Typography.caption, color: Colors.warning, textAlign: 'center' }}>Sem conexão com a internet. Você poderá salvar quando a rede voltar.</Text> : null}
<Button label="Salvar" onPress={gravar} loading={salvando} disabled={!online} />
```

- [ ] **Step 4: Ligar na Home provisória** — em `app/(app)/index.tsx` adicionar `<Button label="Minha Saúde" onPress={() => router.push('/(app)/minha-saude')} />` (a Home definitiva vem na Task 11).

- [ ] **Step 5: Verificar no celular** — editar perfil, salvar, sair, entrar: dados persistem. Adicionar/editar/excluir antecedente; a lista de Minha Saúde mostra a contagem. `npx tsc --noEmit` limpo.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(minha-saude): lista, Meu Perfil completo e antecedentes familiares

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 10: Meus Medicamentos

**Files:**
- Create: `src/core/medicacoes/tipos.ts`, `src/core/medicacoes/repositorio.ts`, `src/core/medicacoes/useMedicacoes.ts`, `src/core/medicacoes/__tests__/horarios.test.ts`, `src/core/medicacoes/horarios.ts`, `app/(app)/minha-saude/medicamentos.tsx`

**Interfaces:**
- Produces: `Medicacao { id, nome, dose, horarios: string[], desde, ate, prescritor, ativa, observacao }`, `listarMedicacoes(userId)`, `salvarMedicacao(userId, m)`, `alternarAtiva(id, ativa)`, `useMedicacoes(): { medicacoes, ativas, carregando, salvar, alternarAtiva, recarregar }`, `normalizarHorario(texto): string | null`, `formatarHorarios(h: string[]): string`.

- [ ] **Step 1: Teste de horários (falhando)**

`__tests__/horarios.test.ts`:
```ts
import { normalizarHorario, formatarHorarios } from '../horarios';

test('aceita 8, 08, 8:00, 08h, 20h30, 20:30', () => {
  expect(normalizarHorario('8')).toBe('08:00');
  expect(normalizarHorario('08')).toBe('08:00');
  expect(normalizarHorario('8:00')).toBe('08:00');
  expect(normalizarHorario('08h')).toBe('08:00');
  expect(normalizarHorario('20h30')).toBe('20:30');
  expect(normalizarHorario('20:30')).toBe('20:30');
});
test('rejeita inválidos', () => {
  expect(normalizarHorario('25:00')).toBeNull();
  expect(normalizarHorario('abc')).toBeNull();
  expect(normalizarHorario('12:75')).toBeNull();
});
test('formata lista como "08h / 20h"', () => {
  expect(formatarHorarios(['08:00', '20:00'])).toBe('08h / 20h');
  expect(formatarHorarios(['20:30'])).toBe('20h30');
  expect(formatarHorarios([])).toBe('');
});
```

- [ ] **Step 2: `horarios.ts`**

```ts
export function normalizarHorario(texto: string): string | null {
  const m = texto.trim().match(/^(\d{1,2})(?:[:h](\d{2})?)?$/i);
  if (!m) return null;
  const h = Number(m[1]); const min = m[2] ? Number(m[2]) : 0;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function formatarHorarios(horarios: string[]): string {
  return horarios.map((h) => { const [hh, mm] = h.split(':'); return mm === '00' ? `${hh}h` : `${hh}h${mm}`; }).join(' / ');
}
```

- [ ] **Step 3: Rodar** — `npx jest src/core/medicacoes` → passa.

- [ ] **Step 4: `tipos.ts` e `repositorio.ts`**

```ts
// tipos.ts
export interface Medicacao {
  id: string; nome: string; dose: string | null; horarios: string[];
  desde: string | null; ate: string | null; prescritor: string | null; ativa: boolean; observacao: string | null;
}
```
```ts
// repositorio.ts
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import type { Medicacao } from './tipos';

export async function listarMedicacoes(userId: string): Promise<Medicacao[]> {
  const { data, error } = await supabase.from('medicacoes').select('*').eq('user_id', userId).order('ativa', { ascending: false }).order('nome');
  if (error) throw traduzirErro(error);
  return data.map((m) => ({ id: m.id, nome: m.nome, dose: m.dose, horarios: (m.horarios as string[]) ?? [], desde: m.desde, ate: m.ate, prescritor: m.prescritor, ativa: m.ativa, observacao: m.observacao }));
}

export async function salvarMedicacao(userId: string, m: Omit<Medicacao, 'id'> & { id?: string }): Promise<void> {
  const linha = { user_id: userId, nome: m.nome, dose: m.dose, horarios: m.horarios, desde: m.desde, ate: m.ate, prescritor: m.prescritor, ativa: m.ativa, observacao: m.observacao };
  const { error } = m.id ? await supabase.from('medicacoes').update(linha).eq('id', m.id) : await supabase.from('medicacoes').insert(linha);
  if (error) throw traduzirErro(error);
}

export async function alternarAtiva(id: string, ativa: boolean): Promise<void> {
  const { error } = await supabase.from('medicacoes').update({ ativa, ate: ativa ? null : new Date().toISOString().slice(0, 10) }).eq('id', id);
  if (error) throw traduzirErro(error);
}
```

- [ ] **Step 5: `useMedicacoes.ts`**

```ts
import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import * as repo from './repositorio';
import type { Medicacao } from './tipos';

export function useMedicacoes() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [medicacoes, setMedicacoes] = useState<Medicacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try { setMedicacoes(await repo.listarMedicacoes(userId)); } finally { setCarregando(false); }
  }, [userId]);
  useEffect(() => { recarregar(); }, [recarregar]);

  const salvar = async (m: Omit<Medicacao, 'id'> & { id?: string }) => { if (!userId) return; await repo.salvarMedicacao(userId, m); await recarregar(); };
  const alternarAtiva = async (id: string, ativa: boolean) => { await repo.alternarAtiva(id, ativa); await recarregar(); };

  return { medicacoes, ativas: medicacoes.filter((m) => m.ativa), carregando, salvar, alternarAtiva, recarregar };
}
```

- [ ] **Step 6: `app/(app)/minha-saude/medicamentos.tsx`**

```tsx
import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatarHorarios, normalizarHorario } from '@core/medicacoes/horarios';
import type { Medicacao } from '@core/medicacoes/tipos';
import { useMedicacoes } from '@core/medicacoes/useMedicacoes';
import { traduzirErro } from '@core/supabase/erros';
import { Secao } from '@modules/minha-saude/Secao';
import { Button, CampoData, Card, Colors, Input, InternalHeader, Spacing, Typography } from '@ui/index';

type Form = Partial<Medicacao> & { horariosTexto?: string };

export default function Medicamentos() {
  const { medicacoes, salvar, alternarAtiva } = useMedicacoes();
  const [editando, setEditando] = useState<Form | null>(null);
  const [salvando, setSalvando] = useState(false);

  const gravar = async () => {
    if (!editando?.nome?.trim()) return Alert.alert('Atenção', 'Informe o nome do medicamento.');
    const partes = (editando.horariosTexto ?? '').split(/[,\s/]+/).filter(Boolean);
    const horarios = partes.map(normalizarHorario);
    if (horarios.some((h) => h === null)) return Alert.alert('Atenção', 'Horários inválidos. Use o formato 08:00 ou 20h30, separados por vírgula.');
    setSalvando(true);
    try {
      await salvar({ id: editando.id, nome: editando.nome.trim(), dose: editando.dose ?? null, horarios: horarios as string[], desde: editando.desde ?? null, ate: editando.ate ?? null, prescritor: editando.prescritor ?? null, ativa: editando.ativa ?? true, observacao: editando.observacao ?? null });
      setEditando(null);
    } catch (e) { Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario); }
    finally { setSalvando(false); }
  };

  const abrir = (m?: Medicacao) => setEditando(m ? { ...m, horariosTexto: m.horarios.join(', ') } : { ativa: true, horariosTexto: '' });
  const ativas = medicacoes.filter((m) => m.ativa); const inativas = medicacoes.filter((m) => !m.ativa);

  return (
    <SafeAreaView style={styles.tela}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Minha Saúde" title="Meus Medicamentos" />
        <Text style={styles.ajuda}>Seus relatórios podem informar ao médico o que você usa e desde quando. O NERO não recomenda alterar doses.</Text>

        {ativas.map((m) => <CardMed key={m.id} m={m} onEditar={() => abrir(m)} onAlternar={() => alternarAtiva(m.id, false)} />)}
        {inativas.length ? <Text style={styles.subtitulo}>Interrompidos</Text> : null}
        {inativas.map((m) => <CardMed key={m.id} m={m} onEditar={() => abrir(m)} onAlternar={() => alternarAtiva(m.id, true)} />)}

        {editando ? (
          <Secao titulo={editando.id ? 'Editar medicamento' : 'Novo medicamento'}>
            <Input placeholder="Nome (ex.: Losartana)" value={editando.nome ?? ''} onChangeText={(v) => setEditando({ ...editando, nome: v })} />
            <Input placeholder="Dose (ex.: 50 mg)" value={editando.dose ?? ''} onChangeText={(v) => setEditando({ ...editando, dose: v })} />
            <Input placeholder="Horários (ex.: 08:00, 20:00)" value={editando.horariosTexto ?? ''} onChangeText={(v) => setEditando({ ...editando, horariosTexto: v })} />
            <CampoData rotulo="Desde quando?" valor={editando.desde ?? null} onChange={(v) => setEditando({ ...editando, desde: v })} />
            <Input placeholder="Quem prescreveu (opcional)" value={editando.prescritor ?? ''} onChangeText={(v) => setEditando({ ...editando, prescritor: v })} />
            <Input placeholder="Observação (opcional)" value={editando.observacao ?? ''} onChangeText={(v) => setEditando({ ...editando, observacao: v })} />
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Button label="Cancelar" variant="ghost" onPress={() => setEditando(null)} style={{ flex: 1 }} />
              <Button label="Salvar" onPress={gravar} loading={salvando} style={{ flex: 1 }} />
            </View>
          </Secao>
        ) : <Button label="+ Adicionar medicamento" variant="outline" onPress={() => abrir()} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function CardMed({ m, onEditar, onAlternar }: { m: Medicacao; onEditar: () => void; onAlternar: () => void }) {
  return (
    <Card style={[styles.card, !m.ativa && { opacity: 0.6 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitulo}>{m.nome}{m.dose ? ` · ${m.dose}` : ''}</Text>
        <Text style={styles.cardSub}>{m.horarios.length ? formatarHorarios(m.horarios) : 'Sem horário definido'}{m.desde ? ` · desde ${m.desde.slice(8, 10)}/${m.desde.slice(5, 7)}/${m.desde.slice(0, 4)}` : ''}</Text>
      </View>
      <Pressable onPress={onEditar} hitSlop={8}><Ionicons name="create-outline" size={20} color={Colors.textSecondary} /></Pressable>
      <Pressable onPress={onAlternar} hitSlop={8} accessibilityLabel={m.ativa ? 'Marcar como interrompido' : 'Reativar'}>
        <Ionicons name={m.ativa ? 'pause-circle-outline' : 'play-circle-outline'} size={22} color={Colors.textSecondary} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl, gap: Spacing.md },
  ajuda: { ...Typography.body, color: Colors.textSecondary },
  subtitulo: { ...Typography.label, color: Colors.textMuted, marginTop: Spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  cardTitulo: { ...Typography.subheading, color: Colors.textPrimary },
  cardSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
});
```

- [ ] **Step 7: Verificar** — adicionar "Losartana 50 mg 08:00, 20:00", ver "08h / 20h"; pausar → vai para "Interrompidos" com `ate` preenchido no Studio; reativar. `npx tsc --noEmit` e `npx jest` limpos.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(medicacoes): lista, cadastro e interrupção de medicamentos

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 11: Home do NERO, abas e tela-ponte do Rastreando

**Files:**
- Create: `src/modules/home/montarItensHoje.ts`, `src/modules/home/__tests__/montarItensHoje.test.ts`, `src/modules/home/CardModulo.tsx`, `src/modules/home/ItemHoje.tsx`, `app/(app)/rastreando/index.tsx`
- Modify: `app/(app)/_layout.tsx` (Tabs), `app/(app)/index.tsx` (Home definitiva)

**Interfaces:**
- Produces: `ItemHoje { id, nivel: NivelAlertaUI, titulo, descricao, rota }`, `montarItensHoje(entrada: { perfil: PerfilSaude | null; antecedentesQtd: number; medicacoesAtivasQtd: number }): ItemHoje[]`, `CardModulo`, `ItemHoje` (componente).

- [ ] **Step 1: Teste (falhando)**

`__tests__/montarItensHoje.test.ts`:
```ts
import { montarItensHoje } from '../montarItensHoje';
import type { PerfilSaude } from '@core/perfil/tipos';

const completo: PerfilSaude = {
  userId: 'u', nome: 'Ana', dataNascimento: '1980-01-01', sexoNascimento: 'feminino', possuiColoUtero: true, histerectomia: false, alturaCm: 165,
  tabagismoStatus: 'nunca', cigarrosDia: null, anosFumando: null, dataCessacao: null,
  temDiabetes: false, temHipertensao: false, temDoencaRenal: false, temImunossupressao: false, temHiv: false, temDii: false,
  historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, perfilInicialCompleto: true,
};

test('perfil com campos essenciais nulos → item "Complete seu perfil" (amarelo)', () => {
  const itens = montarItensHoje({ perfil: { ...completo, tabagismoStatus: null }, antecedentesQtd: 1, medicacoesAtivasQtd: 1 });
  expect(itens.map((i) => i.id)).toContain('perfil_incompleto');
  expect(itens.find((i) => i.id === 'perfil_incompleto')?.nivel).toBe('amarelo');
});
test('sem antecedentes → sugestão (cinza)', () => {
  const itens = montarItensHoje({ perfil: completo, antecedentesQtd: 0, medicacoesAtivasQtd: 1 });
  expect(itens.find((i) => i.id === 'antecedentes')?.nivel).toBe('cinza');
});
test('sem medicações → sugestão (cinza)', () => {
  expect(montarItensHoje({ perfil: completo, antecedentesQtd: 1, medicacoesAtivasQtd: 0 }).map((i) => i.id)).toContain('medicacoes');
});
test('tudo preenchido → item positivo único', () => {
  const itens = montarItensHoje({ perfil: completo, antecedentesQtd: 1, medicacoesAtivasQtd: 1 });
  expect(itens).toHaveLength(1);
  expect(itens[0]).toMatchObject({ id: 'tudo_em_dia', nivel: 'verde' });
});
test('ordena por gravidade: amarelo antes de cinza', () => {
  const itens = montarItensHoje({ perfil: { ...completo, alturaCm: null }, antecedentesQtd: 0, medicacoesAtivasQtd: 0 });
  expect(itens[0].nivel).toBe('amarelo');
});
```

- [ ] **Step 2: `montarItensHoje.ts`**

```ts
import type { PerfilSaude } from '@core/perfil/tipos';
import type { NivelAlertaUI } from '@ui/theme';

export interface ItemHoje { id: string; nivel: NivelAlertaUI; titulo: string; descricao: string; rota: string; }
const PESO: Record<NivelAlertaUI, number> = { vermelho: 0, laranja: 1, amarelo: 2, cinza: 3, verde: 4 };

const ESSENCIAIS: (keyof PerfilSaude)[] = ['dataNascimento', 'sexoNascimento', 'alturaCm', 'tabagismoStatus', 'temDiabetes', 'temHipertensao'];

/** Fase 0: só itens de completude. A Fase 1 acrescenta pendências e exames do Rastreando. */
export function montarItensHoje(e: { perfil: PerfilSaude | null; antecedentesQtd: number; medicacoesAtivasQtd: number }): ItemHoje[] {
  const itens: ItemHoje[] = [];
  const faltando = e.perfil ? ESSENCIAIS.filter((k) => e.perfil![k] == null) : ESSENCIAIS;
  if (faltando.length) itens.push({ id: 'perfil_incompleto', nivel: 'amarelo', titulo: 'Complete seu perfil de saúde', descricao: `${faltando.length} informação(ões) essencial(is) em falta.`, rota: '/(app)/minha-saude/perfil' });
  if (e.antecedentesQtd === 0) itens.push({ id: 'antecedentes', nivel: 'cinza', titulo: 'Registre seus antecedentes familiares', descricao: 'Eles ajudam a definir quando começar cada rastreamento.', rota: '/(app)/minha-saude/antecedentes' });
  if (e.medicacoesAtivasQtd === 0) itens.push({ id: 'medicacoes', nivel: 'cinza', titulo: 'Cadastre seus medicamentos', descricao: 'Se não usa nenhum, tudo bem — pule este item.', rota: '/(app)/minha-saude/medicamentos' });
  if (!itens.length) itens.push({ id: 'tudo_em_dia', nivel: 'verde', titulo: 'Seu perfil está completo', descricao: 'Nada pendente por hoje.', rota: '/(app)/minha-saude' });
  return itens.sort((a, b) => PESO[a.nivel] - PESO[b.nivel]);
}
```

- [ ] **Step 3: Rodar** — `npx jest src/modules/home` → passa.

- [ ] **Step 4: `CardModulo.tsx` e `ItemHoje.tsx`**

```tsx
// CardModulo.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, EmBreveBadge, NeroImage, Radius, Shadows, Spacing, Typography } from '@ui/index';
import type { NeroVariant } from '@ui/components/NeroImage';

interface Props { titulo: string; descricao: string; variant: NeroVariant; cor: string; emBreve?: boolean; onPress?: () => void; }

export function CardModulo({ titulo, descricao, variant, cor, emBreve, onPress }: Props) {
  return (
    <Pressable onPress={emBreve ? undefined : onPress} disabled={emBreve} style={({ pressed }) => [styles.card, { borderLeftColor: cor }, pressed && { opacity: 0.85 }, emBreve && { opacity: 0.7 }]}
      accessibilityRole="button" accessibilityState={{ disabled: !!emBreve }}>
      <View style={{ flex: 1, gap: Spacing.xs }}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.descricao}>{descricao}</Text>
        {emBreve ? <View style={{ marginTop: Spacing.xs }}><EmBreveBadge /></View> : null}
      </View>
      <NeroImage variant={variant} size={64} />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderLeftWidth: 5, padding: Spacing.lg, ...Shadows.card },
  titulo: { ...Typography.heading, color: Colors.textPrimary },
  descricao: { ...Typography.caption, color: Colors.textSecondary },
});
```
```tsx
// ItemHoje.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alerta, Colors, Radius, Spacing, Typography } from '@ui/theme';
import type { ItemHoje as Item } from './montarItensHoje';

export function ItemHoje({ item, onPress }: { item: Item; onPress: () => void }) {
  const cor = Alerta[item.nivel];
  return (
    <Pressable onPress={onPress} style={styles.linha}>
      <View style={[styles.ponto, { backgroundColor: cor.fg }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.titulo}>{item.titulo}</Text>
        <Text style={styles.descricao}>{item.descricao}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md },
  ponto: { width: 10, height: 10, borderRadius: Radius.pill },
  titulo: { ...Typography.subheading, color: Colors.textPrimary },
  descricao: { ...Typography.caption, color: Colors.textSecondary },
});
```

- [ ] **Step 5: Tabs — `app/(app)/_layout.tsx`**

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Colors } from '@ui/theme';

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: Colors.primary, tabBarInactiveTintColor: Colors.textMuted,
      tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border }, tabBarLabelStyle: { fontFamily: 'Poppins-SemiBold', fontSize: 11 } }}>
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="rastreando" options={{ title: 'Rastreando', tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="minha-saude" options={{ title: 'Minha Saúde', tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
```

- [ ] **Step 6: Tela-ponte `app/(app)/rastreando/index.tsx`**

```tsx
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Colors, NeroImage, Spacing, Typography } from '@ui/index';

export default function Rastreando() {
  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.centro}>
        <NeroImage variant="rastreando" size={180} />
        <Text style={styles.titulo}>Rastreando</Text>
        <Text style={styles.texto}>O módulo de rastreamento oncológico está sendo integrado ao NERO. Em breve, seus rastreamentos de mama, colo do útero, colorretal, pulmão e próstata aparecerão aqui, organizados pelo seu perfil.</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.md },
  titulo: { ...Typography.display, color: Colors.primary },
  texto: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
});
```

- [ ] **Step 7: Home definitiva — `app/(app)/index.tsx`**

```tsx
import { useRouter, type Href } from 'expo-router';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMedicacoes } from '@core/medicacoes/useMedicacoes';
import { usePerfil } from '@core/perfil/usePerfil';
import { CardModulo } from '@modules/home/CardModulo';
import { ItemHoje } from '@modules/home/ItemHoje';
import { montarItensHoje } from '@modules/home/montarItensHoje';
import { Colors, NeroImage, Spacing, Typography } from '@ui/index';

function saudacao(nome?: string) {
  const h = new Date().getHours();
  const periodo = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  return nome ? `${periodo}, ${nome.split(' ')[0]}` : periodo;
}

export default function Home() {
  const router = useRouter();
  const { perfil, antecedentes, carregando, recarregar } = usePerfil();
  const { ativas } = useMedicacoes();
  const itens = montarItensHoje({ perfil, antecedentesQtd: antecedentes.length, medicacoesAtivasQtd: ativas.length });

  return (
    <SafeAreaView style={styles.tela}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <View style={styles.cabecalho}>
          <View style={{ flex: 1 }}>
            <Text style={styles.marca}>NERO</Text>
            <Text style={styles.saudacao}>{saudacao(perfil?.nome)}</Text>
            <Text style={styles.pergunta}>Como está sua saúde hoje?</Text>
          </View>
          <NeroImage size={96} />
        </View>

        <Text style={styles.secao}>HOJE</Text>
        <View style={{ gap: Spacing.sm }}>
          {itens.map((i) => <ItemHoje key={i.id} item={i} onPress={() => router.push(i.rota as Href)} />)}
        </View>

        <Text style={[styles.secao, { marginTop: Spacing.xl }]}>MÓDULOS</Text>
        <View style={{ gap: Spacing.md }}>
          <CardModulo titulo="Saúde & Bem-estar" descricao="Peso, alimentação, atividade e sono" variant="bem_estar" cor="#16a34a" emBreve />
          <CardModulo titulo="Coração & Metabolismo" descricao="Pressão, glicemia, exames e risco cardiovascular" variant="cardio" cor="#dc2626" emBreve />
          <CardModulo titulo="Rastreando" descricao="Rastreamento oncológico organizado pelo seu perfil" variant="rastreando" cor={Colors.accent} onPress={() => router.push('/(app)/rastreando')} />
          <CardModulo titulo="Minha Saúde" descricao="Perfil, medicamentos, exames e relatórios" variant="minha_saude" cor={Colors.primary} onPress={() => router.push('/(app)/minha-saude')} />
        </View>

        <Text style={styles.rodape}>O NERO organiza suas informações e não substitui a avaliação do seu médico.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xl, paddingBottom: Spacing.xxl },
  cabecalho: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  marca: { ...Typography.label, color: Colors.accent },
  saudacao: { ...Typography.display, fontSize: 26, color: Colors.primary },
  pergunta: { ...Typography.body, color: Colors.textSecondary },
  secao: { ...Typography.label, color: Colors.textMuted, marginBottom: Spacing.sm, marginLeft: Spacing.xs },
  rodape: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xxl },
});
```

- [ ] **Step 8: Verificar no celular** — Home com saudação, bloco Hoje (itens navegam), 4 cards (2 "em breve" não reagem ao toque), abas funcionando; Rastreando abre a tela-ponte; Minha Saúde abre a lista. Puxar para atualizar recarrega. `npx tsc --noEmit` e `npx jest` limpos.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(home): Home do NERO com bloco Hoje, 4 módulos, abas e tela-ponte do Rastreando

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 12: Checklist final, documentação e encerramento da Fase 0

**Files:**
- Modify: `docs/nero/00-ROADMAP.md`, `docs/contexto-rastreio/ESTADO_ATUAL.md`, `README.md`
- Create: `docs/nero/checklists/fase-0.md`

- [ ] **Step 1: Checklist manual no celular** — criar `docs/nero/checklists/fase-0.md` e executar cada item, marcando:

```markdown
# Checklist manual — Fase 0 (executado em __/__/2026, aparelho: ______)

- [ ] Instalação limpa: onboarding aparece (3 slides), "Pular" e "Começar" levam ao login
- [ ] Cadastro com senha < 8 → mensagem clara; e-mail inválido → mensagem clara
- [ ] Cadastro válido → perfil inicial passo 1
- [ ] Perfil inicial: sexo feminino mostra passo do colo do útero; masculino não
- [ ] Data inválida (31/02) não avança
- [ ] Tabagismo "ex" pede data de cessação
- [ ] "Pular por agora" nos passos 4–6 funciona; passos 1–3 não têm pular
- [ ] Concluir → Home; fechar e reabrir → Home direto
- [ ] Home: saudação com primeiro nome; bloco Hoje; 2 cards "em breve" sem reação; Rastreando e Minha Saúde navegam
- [ ] Minha Saúde → Meu Perfil: alterar altura, salvar, voltar, reabrir → valor persistiu
- [ ] Antecedentes: adicionar (parentesco preenche grau automaticamente), editar, excluir
- [ ] Medicamentos: adicionar com horários "8, 20h30" → "08h / 20h30"; pausar; reativar
- [ ] Sair → login → entrar → dados intactos
- [ ] Modo avião ao salvar perfil → mensagem "Sem conexão…", app não trava
- [ ] Studio: nenhuma linha visível de outro usuário ao logar com segunda conta (criar 2ª conta e conferir que Home/Perfil não mostram dados da 1ª)
```

- [ ] **Step 2: Suite completa**

```bash
npx tsc --noEmit && npx jest --ci && supabase test db
```
Esperado: tudo verde. Anotar contagem de testes no roadmap.

- [ ] **Step 3: Atualizar `docs/nero/00-ROADMAP.md`** — marcar itens da Fase 0 concluídos, acrescentar linha no log de progresso com data, nº de testes e commit final.

- [ ] **Step 4: Atualizar `docs/contexto-rastreio/ESTADO_ATUAL.md`** — substituir seções "Stack Técnica", "Arquitetura", "Estrutura de Dados" pelo estado NERO (Supabase, `src/`, tabelas) e apontar para `docs/nero/`.

- [ ] **Step 5: `README.md`** — substituir o template do Expo por: o que é o NERO, como rodar (`npm install`, `supabase start`, `.env`, `npx expo start`), como testar (`npm test`, `supabase test db`), onde está a documentação.

- [ ] **Step 6: Commit e merge**

```bash
git add -A
git commit -m "docs: encerrar Fase 0 — checklist, roadmap, estado atual e README

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
git checkout desenvolvimento-2 && git merge --no-ff nero-fundacao
```
