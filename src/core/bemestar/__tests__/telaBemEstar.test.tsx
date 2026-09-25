/**
 * Regressão da tela Saúde & Bem-estar (D-016, parte B): as conquistas são gravadas UMA vez.
 * O hook avalia no foco e grava, o que re-renderiza a tela — a mesma forma do bug de recarga
 * infinita do Cardio. Também confere que quem já tem todas não dispara contagem no banco.
 */
import React from 'react';
import { act, create } from 'react-test-renderer';

let mockGravadas: string[][] = [];
let mockContagens = 0;
let mockObtidas: string[] = [];
(globalThis as any).mockReact = React;

jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => { (globalThis as any).mockReact.useEffect(() => { cb(); }, [cb]); },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false, online: true, sair: jest.fn() }) }));
jest.mock('@core/perfil/usePerfil', () => ({ usePerfil: () => ({ perfil: { perfilInicialCompleto: true, semMedicacoes: true, semAntecedentesFamiliares: true }, carregando: false }) }));
jest.mock('@core/bemestar/useHabitos', () => ({ useHabitos: () => ({ habitos: null, perdaNaoIntencional: null, parametros: null, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/bemestar/conquistas', () => ({
  listarConquistas: async () => mockObtidas,
  contarParaConquistas: async () => {
    mockContagens++;
    return { cadastroInicial: true, medicacoesResolvidas: true, antecedentesResolvidos: true, totalAtividades: 1, totalSono: 0, totalCheckins: 0 };
  },
  gravarConquistas: async (_u: string, chaves: string[]) => { mockGravadas.push(chaves); mockObtidas = [...mockObtidas, ...chaves]; },
}));

const BemEstar = require('../../../../app/(app)/bem-estar/index').default;

beforeEach(() => { mockGravadas = []; mockContagens = 0; mockObtidas = []; });

it('grava as conquistas novas uma única vez, e só as de Bem-estar', async () => {
  // "Perfil completo" não é daqui: aparecia ao voltar da Água para quem tinha completado o perfil
  // em outra tela (relato do Murilo, 25/09). Ela sai onde o perfil é completado.
  await act(async () => { create(<BemEstar />); });
  for (let i = 0; i < 5; i++) await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  expect(mockGravadas).toEqual([['primeira_atividade']]);
}, 10000);

it('quem já tem todas as conquistas não dispara contagem no banco', async () => {
  mockObtidas = ['primeira_atividade', 'primeira_noite_sono', 'primeiro_checkin'];
  await act(async () => { create(<BemEstar />); });
  for (let i = 0; i < 3; i++) await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  expect(mockContagens).toBe(0);
  expect(mockGravadas).toEqual([]);
}, 10000);
