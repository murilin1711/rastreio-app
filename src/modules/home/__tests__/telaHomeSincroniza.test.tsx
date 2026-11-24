/**
 * Spec de 23/11, §6.2: quem já usa o app tem os avisos de remédio no texto antigo, que abriam Meus
 * medicamentos. Na primeira abertura depois da atualização, a Home reagenda tudo
 * (`sincronizarLembretesMedicacao` cancela pelo prefixo e agenda de novo, com o texto e a rota novos —
 * ver `cardio/__tests__/lembretesMedicacao.test.ts`). Aqui: a Home chama uma vez, só com os remédios
 * que têm lembrete ligado e horário.
 */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

const comHorario = (id: string, lembrar: boolean, horas: string[]) => ({
  id, nome: id, dose: null, horarios: horas.map((hora) => ({ hora, quantidade: 1 })), unidade: 'comprimido',
  doseVariavel: false, sePrecisar: !horas.length, horariosDesde: null, desde: null, ate: null, prescritor: null,
  ativa: true, lembrar, observacao: null,
});
const mockAtivas = [comHorario('m1', true, ['08:00']), comHorario('m2', false, ['20:00']), comHorario('m3', true, [])];
const mockSincronizar = jest.fn(async (..._a: unknown[]) => {});

jest.mock('expo-router', () => ({ useIsFocused: () => true,
  useRouter: () => ({ push: jest.fn() }), useFocusEffect: () => {} }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false }) }));
jest.mock('@core/perfil/usePerfil', () => ({
  usePerfil: () => ({
    perfil: { nome: 'Murilo', semMedicacoes: false, semAntecedentesFamiliares: true },
    antecedentes: [], carregando: false, recarregar: jest.fn(), salvar: jest.fn(),
  }),
}));
jest.mock('@core/medicacoes/useMedicacoes', () => ({ useMedicacoes: () => ({ ativas: mockAtivas, recarregar: jest.fn() }) }));
jest.mock('@core/medicacoes/useDosesHoje', () => ({ useDosesHoje: () => ({ doses: [], carregando: false, erro: null, recarregar: async () => {} }) }));
jest.mock('@core/rastreando/useRastreando', () => ({ useRastreando: () => ({ avaliacoes: {}, pendencias: [], sintomas: [], carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/cardio/useResumoCardio', () => ({ useResumoCardio: () => ({ resumo: undefined, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/lembretes/useConsultas', () => ({ useConsultas: () => ({ proxima: null, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/bemestar/useHabitos', () => ({ useHabitos: () => ({ habitos: null, perdaNaoIntencional: null, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/bemestar/useSequencia', () => ({ useSequencia: () => ({ sequencia: 0, marco: null, dispensarMarco: jest.fn() }) }));
jest.mock('@core/lembretes/useAvisos', () => ({ useAvisos: () => ({ precisa: false, ativar: jest.fn(), adiar: jest.fn() }) }));
jest.mock('@core/cardio/lembretesCardio', () => ({ sincronizarLembretesMedicacao: (...a: unknown[]) => mockSincronizar(...a) }));
jest.mock('@core/lembretes/preferencias', () => ({ renovarAvisosDiarios: async () => {} }));
jest.mock('@core/bemestar/useConquistas', () => ({ useConquistas: () => ({ proxima: null, dispensar: jest.fn(), avaliar: async () => 0 }) }));

const Home = require('../../../../app/(app)/(tabs)/index').default;

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('ao abrir, reagenda os lembretes de remédio uma vez, só dos que têm lembrete e horário', async () => {
  let a!: ReactTestRenderer;
  await act(async () => { a = create(<Home />); });
  await act(async () => { a.update(<Home />); });
  expect(mockSincronizar).toHaveBeenCalledTimes(1);
  expect(mockSincronizar).toHaveBeenCalledWith('u1', [mockAtivas[0]]);
  act(() => { a.unmount(); });
});
