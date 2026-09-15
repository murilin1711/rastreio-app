# NERO

Plataforma de prevenção, rastreamento e acompanhamento de saúde para pacientes, em quatro módulos: **Saúde & Bem-estar**, **Coração & Metabolismo**, **Rastreando** (rastreamento oncológico) e **Minha Saúde**. Organiza informações e orienta; não substitui a avaliação médica.

- Especificação de produto: [`docs/nero/01-ESPECIFICACAO-NERO.md`](docs/nero/01-ESPECIFICACAO-NERO.md)
- Roadmap e estado: [`docs/nero/00-ROADMAP.md`](docs/nero/00-ROADMAP.md)
- Decisões (técnicas e clínicas): [`docs/nero/02-DECISOES.md`](docs/nero/02-DECISOES.md)
- Sistema de design: [`docs/nero/03-DESIGN.md`](docs/nero/03-DESIGN.md)

## Stack

Expo SDK 57 · React Native · TypeScript · Expo Router · Supabase (Auth, Postgres com RLS, Storage) · Jest · pgTAP.

## Estrutura

```
app/            rotas (Expo Router): (auth), perfil-inicial, (app) com abas
src/core/       supabase, sessão, perfil, medicações, regras (motor clínico — TS puro)
src/modules/    lógica e componentes por módulo (home, minha-saude, rastreando…)
src/ui/         design system (theme.ts + componentes)
supabase/       migrações SQL, testes pgTAP, config local
legado/         telas do Rastreando v1 (fora do roteador até a Fase 1)
docs/nero/      documentação viva do projeto
```

## Rodar localmente

Pré-requisitos: Node 20+, Docker Desktop, [Supabase CLI](https://supabase.com/docs/guides/cli), Expo Go no celular (mesma rede Wi-Fi).

```bash
npm install
supabase start                 # sobe Postgres/Auth/Storage locais (Docker)
supabase db reset              # aplica migrações
cp .env.example .env           # preencha com a anon key de `supabase status`
                               # use o IP da máquina no URL para o celular alcançar
npx expo start                 # escaneie o QR code no Expo Go
```

Após criar rotas novas em `app/`, rode `npm run rotas` para regenerar os tipos do Expo Router.

## Testes

```bash
npm test          # Jest: motor de regras, cálculos, mapeamentos, erros
npm run db:test   # pgTAP: isolamento RLS entre usuários
npm run typecheck # tsc --noEmit
```

## Banco

Migrações em `supabase/migrations/`. Toda tabela do paciente tem `user_id` com RLS `(select auth.uid()) = user_id`. Regras clínicas ficam em `regras_clinicas` (parâmetros, fonte, versão); a lógica fica em `src/core/regras`. Após alterar o schema: `npm run db:types`.
