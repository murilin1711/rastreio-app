/**
 * Cadeia dos lembretes de medicação (§21), de ponta a ponta: o que a pessoa digita no campo de
 * horários até o que fica agendado. Cada peça já tinha teste próprio (o parser em
 * `medicacoes/__tests__/horarios.test.ts`), mas a junção não — e é nela que mora a dúvida de
 * "será que está agendando mesmo?".
 */
import { parsearHorarios } from '@core/medicacoes/horarios';
import type { Medicacao } from '@core/medicacoes/tipos';

/** Remédio no modelo do app: cada hora com 1 comprimido. */
const remedio = (id: string, nome: string, horarios: string[]): Medicacao => ({
  id, nome, dose: null, horarios: horarios.map((hora) => ({ hora, quantidade: 1 })), unidade: 'comprimido',
  doseVariavel: false, sePrecisar: false, horariosDesde: null, desde: null, ate: null, prescritor: null,
  ativa: true, lembrar: true, observacao: null,
});

const AGORA = new Date('2026-09-24T09:00:00');

let mockAgendadas: { title: string; body: string; rota: string; tipo: string; hour?: number; minute?: number; date?: Date }[] = [];
let mockCanceladas: string[] = [];
let mockLinhas: { titulo: string; agendado_para: string; mensagem: string }[] = [];
let mockPermissao = true;
let mockIosRecusa = false;
let mockPendentes: { id: string; mensagem: string }[] = [];

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
      select: () => ({ eq: () => ({ eq: () => ({ like: async () => ({ data: mockPendentes, error: null }) }) }) }),
      update: () => ({ eq: () => ({ eq: () => ({ like: async () => ({ error: null }) }) }) }),
    }),
  },
}));

const { agendarLembretesMedicacao } = require('../lembretesCardio');

beforeEach(() => {
  mockAgendadas = []; mockCanceladas = []; mockLinhas = []; mockPermissao = true; mockIosRecusa = false; mockPendentes = [];
  jest.useFakeTimers().setSystemTime(AGORA);
});
afterEach(() => { jest.useRealTimers(); });

it('do que a pessoa digita até o que fica agendado', async () => {
  // O que ela escreve no campo:
  const { horarios, invalidos } = parsearHorarios('8, 20');
  expect(invalidos).toEqual([]);
  expect(horarios).toEqual(['08:00', '20:00']);

  await agendarLembretesMedicacao('u1', remedio('m1', 'Losartana', horarios));

  // D-048: um aviso diário por horário (o iOS guarda no máximo 64 agendados por app).
  expect(mockAgendadas).toHaveLength(2);
  expect(mockAgendadas.map((a) => [a.tipo, a.hour, a.minute])).toEqual([['daily', 8, 0], ['daily', 20, 0]]);
  // Spec de 23/11 (D-066): remédio e quantidade no título; o toque abre a tela "Tomou?" daquela dose.
  expect(mockAgendadas[0].title).toBe('Hora do remédio: Losartana · 1 comprimido 💊');
  expect(mockAgendadas[0].body).toBe('Toque aqui para marcar');
  expect(mockAgendadas[0].rota).toBe('/(app)/remedios/tomar?med=m1&hora=08:00');
  expect(mockAgendadas[1].rota).toBe('/(app)/remedios/tomar?med=m1&hora=20:00');

  // A lista do app continua mostrando os próximos 7 dias: 14 menos o de hoje às 8h, que já passou
  // (são 9h no relógio do teste). Cada linha leva o id do aviso diário, para cancelar depois.
  expect(mockLinhas).toHaveLength(13);
  expect(mockLinhas[0].titulo).toBe('medicacao:m1:08:00');
  expect(mockLinhas[0].mensagem).toMatch(/^Hora do remédio: Losartana · 1 comprimido · Toque aqui para marcar notif:/);
  expect(mockLinhas.every((l) => /notif:notif-[12]$/.test(l.mensagem))).toBe(true);
});

it('horário que já passou hoje não vira lembrete para trás', async () => {
  await agendarLembretesMedicacao('u1', remedio('m1', 'X', ['06:00']));
  expect(mockAgendadas).toHaveLength(1);              // o diário das 6h começa amanhã
  expect(mockLinhas).toHaveLength(6);                 // sete dias menos hoje
  expect(mockLinhas.every((l) => new Date(l.agendado_para).getTime() > AGORA.getTime())).toBe(true);
});

it('sem permissão do sistema, grava o lembrete mas não toca nada', async () => {
  mockPermissao = false;
  await agendarLembretesMedicacao('u1', remedio('m1', 'X', ['20:00']));
  expect(mockAgendadas).toHaveLength(0);
  expect(mockLinhas).toHaveLength(7);
  expect(mockLinhas[0].mensagem).toContain('silenciado');
});

it('iOS recusa o agendamento: a linha fica silenciada, não finge que vai tocar', async () => {
  mockIosRecusa = true;
  const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await agendarLembretesMedicacao('u1', remedio('m1', 'X', ['20:00']));
  expect(mockLinhas).toHaveLength(7);
  expect(mockLinhas.every((l) => l.mensagem.endsWith(' silenciado') && !l.mensagem.includes('notif:'))).toBe(true);
  expect(aviso).toHaveBeenCalled();
  aviso.mockRestore();
});

it('o aviso se repete todo dia: não acaba depois de sete dias sem abrir o app', async () => {
  await agendarLembretesMedicacao('u1', remedio('m1', 'X', ['20:00']));
  expect(mockAgendadas).toHaveLength(1);
  expect(mockAgendadas[0].tipo).toBe('daily');
  expect(mockAgendadas[0].date).toBeUndefined();
});

it('quantidade de cada horário no título; "dose muda conforme o dia" fica sem quantidade', async () => {
  const m = remedio('m1', 'Losartana', ['08:00', '20:00']);
  m.dose = '50 mg';
  m.horarios = [{ hora: '08:00', quantidade: 0.5 }, { hora: '20:00', quantidade: 2 }];
  await agendarLembretesMedicacao('u1', m);
  expect(mockAgendadas.map((a) => a.title)).toEqual(['Hora do remédio: Losartana 50 mg · meio comprimido 💊', 'Hora do remédio: Losartana 50 mg · 2 comprimidos 💊']);

  mockAgendadas = [];
  await agendarLembretesMedicacao('u1', { ...remedio('m2', 'X', ['08:00']), doseVariavel: true });
  expect(mockAgendadas[0].title).toBe('Hora do remédio: X 💊');
});

it('spec §6.2: ao abrir o app depois da atualização, o aviso antigo sai e entra o novo, com a rota da dose', async () => {
  // Quem já usa o app tem o aviso diário no texto antigo; a Home chama `sincronizarLembretesMedicacao` ao abrir.
  mockPendentes = [{ id: 'l1', mensagem: 'Hora de tomar seu remédio · Losartana notif:velho-1' }];
  const { sincronizarLembretesMedicacao } = require('../lembretesCardio');
  await sincronizarLembretesMedicacao('u1', [remedio('m1', 'Losartana', ['20:00'])]);
  expect(mockCanceladas).toEqual(['velho-1']);
  expect(mockAgendadas).toHaveLength(1);
  expect(mockAgendadas[0].title).toBe('Hora do remédio: Losartana · 1 comprimido 💊');
  expect(mockAgendadas[0].rota).toBe('/(app)/remedios/tomar?med=m1&hora=20:00');
});
