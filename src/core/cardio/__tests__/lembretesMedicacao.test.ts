/**
 * Cadeia dos lembretes de medicação (§21), de ponta a ponta: o que a pessoa digita no campo de
 * horários até o que fica agendado. Cada peça já tinha teste próprio (o parser em
 * `medicacoes/__tests__/horarios.test.ts`), mas a junção não — e é nela que mora a dúvida de
 * "será que está agendando mesmo?".
 */
import { parsearHorarios } from '@core/medicacoes/horarios';

const AGORA = new Date('2026-09-24T09:00:00');

let mockAgendadas: { title: string; body: string; rota: string; tipo: string; hour?: number; minute?: number; date?: Date }[] = [];
let mockCanceladas: string[] = [];
let mockLinhas: { titulo: string; agendado_para: string; mensagem: string }[] = [];
let mockPermissao = true;
let mockIosRecusa = false;

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily' },
  scheduleNotificationAsync: async ({ content, trigger }: any) => {
    if (mockIosRecusa) throw new Error('limite de notificações');
    mockAgendadas.push({ title: content.title, body: content.body, rota: content.data?.rota, tipo: trigger.type, hour: trigger.hour, minute: trigger.minute, date: trigger.date });
    return `notif-${mockAgendadas.length}`;
  },
  cancelScheduledNotificationAsync: async (id: string) => { mockCanceladas.push(id); },
}));
jest.mock('@core/lembretes/configurar', () => ({ CANAL_LEMBRETES: 'lembretes' }));
jest.mock('@core/lembretes/permissao', () => ({ notificacoesPermitidas: async () => mockPermissao }));
jest.mock('@core/supabase/client', () => ({
  supabase: {
    from: () => ({
      insert: async (linha: any) => { mockLinhas.push(linha); return { error: null }; },
      select: () => ({ eq: () => ({ eq: () => ({ like: async () => ({ data: [], error: null }) }) }) }),
      update: () => ({ eq: () => ({ eq: () => ({ like: async () => ({ error: null }) }) }) }),
    }),
  },
}));

const { agendarLembretesMedicacao } = require('../lembretesCardio');

beforeEach(() => {
  mockAgendadas = []; mockCanceladas = []; mockLinhas = []; mockPermissao = true; mockIosRecusa = false;
  jest.useFakeTimers().setSystemTime(AGORA);
});
afterEach(() => { jest.useRealTimers(); });

it('do que a pessoa digita até o que fica agendado', async () => {
  // O que ela escreve no campo:
  const { horarios, invalidos } = parsearHorarios('8, 20');
  expect(invalidos).toEqual([]);
  expect(horarios).toEqual(['08:00', '20:00']);

  await agendarLembretesMedicacao('u1', { id: 'm1', nome: 'Losartana', horarios });

  // D-048: um aviso diário por horário (o iOS guarda no máximo 64 agendados por app).
  expect(mockAgendadas).toHaveLength(2);
  expect(mockAgendadas.map((a) => [a.tipo, a.hour, a.minute])).toEqual([['daily', 8, 0], ['daily', 20, 0]]);
  // D-044: ação no título, remédio embaixo; o toque abre Meus medicamentos.
  expect(mockAgendadas[0].title).toBe('Hora de tomar seu remédio 💊');
  expect(mockAgendadas[0].body).toBe('Losartana');
  expect(mockAgendadas[0].rota).toBe('/(app)/(tabs)/minha-saude/medicamentos');

  // A lista do app continua mostrando os próximos 7 dias: 14 menos o de hoje às 8h, que já passou
  // (são 9h no relógio do teste). Cada linha leva o id do aviso diário, para cancelar depois.
  expect(mockLinhas).toHaveLength(13);
  expect(mockLinhas[0].titulo).toBe('medicacao:m1:08:00');
  expect(mockLinhas.every((l) => /notif:notif-[12]$/.test(l.mensagem))).toBe(true);
});

it('horário que já passou hoje não vira lembrete para trás', async () => {
  await agendarLembretesMedicacao('u1', { id: 'm1', nome: 'X', horarios: ['06:00'] });
  expect(mockAgendadas).toHaveLength(1);              // o diário das 6h começa amanhã
  expect(mockLinhas).toHaveLength(6);                 // sete dias menos hoje
  expect(mockLinhas.every((l) => new Date(l.agendado_para).getTime() > AGORA.getTime())).toBe(true);
});

it('sem permissão do sistema, grava o lembrete mas não toca nada', async () => {
  mockPermissao = false;
  await agendarLembretesMedicacao('u1', { id: 'm1', nome: 'X', horarios: ['20:00'] });
  expect(mockAgendadas).toHaveLength(0);
  expect(mockLinhas).toHaveLength(7);
  expect(mockLinhas[0].mensagem).toContain('silenciado');
});

it('iOS recusa o agendamento: a linha fica silenciada, não finge que vai tocar', async () => {
  mockIosRecusa = true;
  const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await agendarLembretesMedicacao('u1', { id: 'm1', nome: 'X', horarios: ['20:00'] });
  expect(mockLinhas).toHaveLength(7);
  expect(mockLinhas.every((l) => l.mensagem.endsWith(' silenciado') && !l.mensagem.includes('notif:'))).toBe(true);
  expect(aviso).toHaveBeenCalled();
  aviso.mockRestore();
});

it('o aviso se repete todo dia: não acaba depois de sete dias sem abrir o app', async () => {
  await agendarLembretesMedicacao('u1', { id: 'm1', nome: 'X', horarios: ['20:00'] });
  expect(mockAgendadas).toHaveLength(1);
  expect(mockAgendadas[0].tipo).toBe('daily');
  expect(mockAgendadas[0].date).toBeUndefined();
});
