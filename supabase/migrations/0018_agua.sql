-- NERO · Bem-estar · C-021 (D-016, parte D): ingestão de água.
-- A meta é de ÁGUA BEBIDA, não de água total: o usuário não tem como estimar a água que vem dos
-- alimentos, e as diretrizes com número (EFSA 2010, IOM 2005) são de água total — incomparáveis com
-- copos. O parâmetro de 35 ml/kg/dia é regra de cálculo de nutrição clínica, não recomendação
-- populacional de diretriz; adotado por decisão do Murilo em 19/09/2026. Ver docs/nero/referencias/agua.md.

-- Registro de água entra em `medidas` (tipo 'agua', valores {"ml": 250}), como já acontece com o
-- sono. De quebra, o gatilho de dias_ativos já cobre essa tabela: beber água conta para a sequência.
alter table public.medidas drop constraint medidas_tipo_check;
alter table public.medidas add constraint medidas_tipo_check
  check (tipo in ('pa','glicemia','peso','cintura','quadril','composicao','sono','fc','agua'));

-- Meta diária de água, em ml.
alter table public.metas drop constraint metas_tipo_check;
alter table public.metas add constraint metas_tipo_check
  check (tipo in ('peso','cintura','atividade_min','atividade_dias','fortalecimento_dias','sono_min','pressao','agua_ml'));

-- Insuficiência cardíaca: junto com a doença renal, é a outra causa clássica de restrição hídrica,
-- em que beber mais trabalha contra a conduta. Sem esse campo o app não tem como saber.
alter table public.perfil_saude add column tem_insuficiencia_cardiaca boolean;

-- Dia em que a meta de água foi comemorada pela última vez. A comemoração é diária (decisão do
-- Murilo em 19/09/2026): repete todo dia em que a pessoa bate a meta, mas só uma vez por dia.
alter table public.perfil_saude add column agua_meta_comemorada_em date;
