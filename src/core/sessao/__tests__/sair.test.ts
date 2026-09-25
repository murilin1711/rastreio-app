/**
 * Avisos agendados vivem no aparelho, não na conta. Sem cancelar ao sair, o próximo a usar o celular
 * (ou ninguém, depois de excluir a conta) continuaria recebendo "Hora de tomar seu remédio" — e, com os
 * avisos diários da D-048, para sempre.
 */
const mockOrdem: string[] = [];

jest.mock('expo-notifications', () => ({
  cancelAllScheduledNotificationsAsync: async () => { mockOrdem.push('cancelar'); },
}));
jest.mock('@core/supabase/client', () => ({
  supabase: { auth: { signOut: async (opts: unknown) => { mockOrdem.push(`sair:${JSON.stringify(opts ?? null)}`); return { error: null }; } } },
}));

const { sairDoAparelho } = require('../sair');

beforeEach(() => { mockOrdem.length = 0; });

it('cancela os avisos do aparelho antes de encerrar a sessão', async () => {
  await sairDoAparelho();
  expect(mockOrdem).toEqual(['cancelar', 'sair:null']);
});

it('repassa o escopo local usado na exclusão de conta', async () => {
  await sairDoAparelho({ scope: 'local' });
  expect(mockOrdem).toEqual(['cancelar', 'sair:{"scope":"local"}']);
});
