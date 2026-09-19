-- NERO · Bem-estar · C-021 (parte D2): lembretes de água.
-- Configuração da janela do dia e do intervalo. Começa desligada: diferente dos outros tipos de
-- lembrete, água exige a pessoa escolher quando quer ser avisada, então ninguém passa a receber
-- notificação sem ter pedido.
-- O interruptor por tipo continua em `preferencias_lembretes`; perfis antigos não têm a chave
-- `agua` nesse jsonb, e a ausência é lida como desligado.
alter table public.perfil_saude
  add column lembretes_agua jsonb not null
    default '{"ativo": false, "inicio": "08:00", "fim": "20:00", "intervaloMin": 120}'::jsonb;
