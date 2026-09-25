/**
 * Regressão (25/09/2026): no build 2 do TestFlight o app fechava ao tocar em "Não uso medicamentos"
 * nas Pendências (RCTFatal: erro de JavaScript em produção). Monta a Home de verdade, com as fontes de
 * dados simuladas, e percorre o gesto inteiro: toque, confirmação, gravação e os 15 s do desfazer.
 */
import React from 'react';
import { Alert, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

(globalThis as any).mockReact = React;
const mockSalvar = jest.fn(async (_d: object) => {});

jest.mock('expo-router', () => ({
  useIsFocused: () => true,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useFocusEffect: () => {},
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false, online: true, sair: jest.fn() }) }));
jest.mock('@core/perfil/usePerfil', () => ({
  usePerfil: () => {
    const R = (globalThis as any).mockReact;
    const [perfil, setPerfil] = R.useState({
      nome: 'Murilo', dataNascimento: '1990-01-01', sexoNascimento: 'masculino', alturaCm: 180,
      tabagismoStatus: 'nunca', temDiabetes: false, temHipertensao: false,
      semMedicacoes: false, semAntecedentesFamiliares: true,
    });
    const salvar = async (d: object) => { await mockSalvar(d); setPerfil((p: object) => ({ ...p, ...d })); };
    return { perfil, antecedentes: [], carregando: false, recarregar: jest.fn(), salvar };
  },
}));
jest.mock('@core/medicacoes/useMedicacoes', () => ({ useMedicacoes: () => ({ ativas: [], recarregar: jest.fn() }) }));
jest.mock('@core/rastreando/useRastreando', () => ({ useRastreando: () => ({ avaliacoes: {}, pendencias: [], sintomas: [], carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/cardio/useResumoCardio', () => ({ useResumoCardio: () => ({ resumo: undefined, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/lembretes/useConsultas', () => ({ useConsultas: () => ({ proxima: null, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/bemestar/useHabitos', () => ({ useHabitos: () => ({ habitos: null, perdaNaoIntencional: null, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/bemestar/useSequencia', () => ({ useSequencia: () => ({ sequencia: 0, marco: null, dispensarMarco: jest.fn() }) }));
jest.mock('@core/lembretes/useAvisos', () => ({ useAvisos: () => ({ precisa: false, ativar: jest.fn(), adiar: jest.fn() }) }));
jest.mock('@core/cardio/lembretesCardio', () => ({ sincronizarLembretesMedicacao: async () => {} }));
jest.mock('@core/lembretes/preferencias', () => ({ renovarAvisosDiarios: async () => {} }));

const Home = require('../../../../app/(app)/(tabs)/index').default;

function acharTexto(arvore: ReactTestRenderer, texto: string) {
  return arvore.root.findAll((n) => n.type === Text && n.props.children === texto)[0];
}

/** O Pressable mais próximo acima de um texto: é quem recebe o toque. */
function tocar(arvore: ReactTestRenderer, texto: string) {
  let n: any = acharTexto(arvore, texto);
  while (n && typeof n.props.onPress !== 'function') n = n.parent;
  n.props.onPress();
}

/**
 * No aparelho o onLayout dispara; no Jest não. Dispara em todos, com uma altura qualquer.
 *
 * Como no React Native, o evento é esvaziado assim que o handler retorna: quem o lê depois (numa
 * função de atualização de estado, que o React roda só na renderização seguinte) encontra
 * `nativeEvent` nulo. Foi exatamente o crash do build 2.
 */
function medirTudo(arvore: ReactTestRenderer) {
  for (const n of arvore.root.findAll((x) => typeof x.props.onLayout === 'function')) {
    const e: { nativeEvent: object | null } = { nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 64 } } };
    n.props.onLayout(e);
    e.nativeEvent = null;
  }
}

it('"Não uso medicamentos" percorre confirmação, gravação e desfazer sem erro', async () => {
  jest.useFakeTimers();
  const alerta = jest.spyOn(Alert, 'alert');
  let arvore!: ReactTestRenderer;
  await act(async () => { arvore = create(<Home />); });

  await act(async () => { tocar(arvore, 'Não uso medicamentos'); });
  const botoes = alerta.mock.calls[0][2] as { text: string; onPress?: () => void }[];
  await act(async () => { botoes.find((b) => b.text === 'Confirmar')!.onPress!(); });
  expect(mockSalvar).toHaveBeenCalledWith({ semMedicacoes: true });

  await act(async () => { medirTudo(arvore); });
  for (let i = 0; i < 20; i++) await act(async () => { jest.advanceTimersByTime(1000); medirTudo(arvore); });
  expect(acharTexto(arvore, 'Não uso medicamentos')).toBeUndefined();
  jest.useRealTimers();
}, 20000);
