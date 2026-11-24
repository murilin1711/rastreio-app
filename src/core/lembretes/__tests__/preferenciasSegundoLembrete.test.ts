/**
 * Preferência "Medicamentos" desligada também cala o segundo lembrete (spec §6.2). Ele não tem linha
 * em `lembretes`, então o silenciar pelas linhas não o alcança: sai pelo identificador da notificação.
 */
import { PREFERENCIAS_PADRAO } from '@core/perfil/tipos';

const mockCancelarTodos = jest.fn(async () => {});
let mockFiltros: string[] = [];

jest.mock('expo-notifications', () => ({ cancelScheduledNotificationAsync: async () => {} }));
jest.mock('@core/cardio/lembretesCardio', () => ({
  cancelarTodosSegundosLembretes: () => mockCancelarTodos(),
  agendarLembretesGlicemia: async () => {}, agendarLembretesMrpa: async () => {}, sincronizarLembretesMedicacao: async () => {},
}));
jest.mock('@core/cardio/sessoesMrpa', () => ({ sessaoAtiva: async () => null }));
jest.mock('@core/bemestar/lembretesAgua', () => ({ agendarLembretesAgua: async () => {} }));
jest.mock('@core/bemestar/lembretesCheckin', () => ({ agendarLembretesCheckin: async () => {} }));
jest.mock('@core/medicacoes/repositorio', () => ({ listarMedicacoes: async () => [] }));
jest.mock('@core/perfil/repositorio', () => ({ obterPerfil: async () => ({}), salvarPerfil: async () => {} }));
jest.mock('@core/rastreando/contexto', () => ({ montarContexto: async () => ({ exames: [] }) }));
jest.mock('@core/rastreando/lembretes', () => ({ agendarLembretes: async () => {} }));
jest.mock('@core/lembretes/consultas', () => ({ agendarLembretesConsulta: async () => {}, listarConsultasFuturas: async () => [] }));
jest.mock('@core/lembretes/permissao', () => ({ lerPreferencias: async () => ({}) }));
jest.mock('@core/supabase/client', () => {
  const consulta: any = {
    eq: () => consulta,
    like: (_c: string, v: string) => { mockFiltros.push(v); return consulta; },
    then: (ok: any) => Promise.resolve({ data: [], error: null }).then(ok),
  };
  return { supabase: { from: () => ({ select: () => consulta }) } };
});

const { aplicarPreferencias } = require('../preferencias');

beforeEach(() => { mockCancelarTodos.mockClear(); mockFiltros = []; });

it('desligar "Medicamentos" cancela todos os segundos lembretes', async () => {
  await aplicarPreferencias('u1', PREFERENCIAS_PADRAO, { ...PREFERENCIAS_PADRAO, medicacao: false });
  expect(mockCancelarTodos).toHaveBeenCalledTimes(1);
  expect(mockFiltros).toEqual(['medicacao:%']); // e as linhas do lembrete principal continuam sendo silenciadas
});

it('desligar outro tipo não mexe nos segundos lembretes', async () => {
  await aplicarPreferencias('u1', PREFERENCIAS_PADRAO, { ...PREFERENCIAS_PADRAO, glicemia: false });
  expect(mockCancelarTodos).not.toHaveBeenCalled();
});

it('se o cancelamento falha, as linhas são silenciadas mesmo assim', async () => {
  mockCancelarTodos.mockImplementationOnce(async () => { throw new Error('x'); });
  await aplicarPreferencias('u1', PREFERENCIAS_PADRAO, { ...PREFERENCIAS_PADRAO, medicacao: false });
  expect(mockFiltros).toEqual(['medicacao:%']);
});
