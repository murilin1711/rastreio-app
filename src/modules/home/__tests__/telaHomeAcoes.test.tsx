/**
 * Topo do Início (spec de navegação §6.3, D-065; ordem trocada a pedido do Murilo em 24/11/2026):
 * "Para fazer hoje" no lugar de "Pendências", depois "O que você quer fazer?" com até cinco ações e "Meus cuidados" com os três módulos em cartões largos.
 */
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import { apertar, textoDe } from '../../../testes/arvore';

(globalThis as any).mockReact = React;
const mockPush = jest.fn();
let mockPerfil: Record<string, unknown> = { nome: 'M', semMedicacoes: true, semAntecedentesFamiliares: true, temDiabetes: true };

jest.mock('expo-router', () => ({
  useIsFocused: () => true,
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (cb: () => void) => { (globalThis as any).mockReact.useEffect(() => { cb(); }, [cb]); },
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false }) }));
jest.mock('@core/perfil/usePerfil', () => ({ usePerfil: () => ({ perfil: mockPerfil, antecedentes: [], carregando: false, recarregar: jest.fn(), salvar: jest.fn() }) }));
jest.mock('@core/medicacoes/useMedicacoes', () => ({ useMedicacoes: () => ({ ativas: [], recarregar: jest.fn() }) }));
jest.mock('@core/medicacoes/useDosesHoje', () => ({ useDosesHoje: () => ({ doses: [], carregando: false, erro: null, recarregar: async () => {} }) }));
jest.mock('@core/rastreando/useRastreando', () => ({ useRastreando: () => ({ avaliacoes: {}, pendencias: [], sintomas: [], carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/cardio/useResumoCardio', () => ({ useResumoCardio: () => ({ resumo: undefined, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/lembretes/useConsultas', () => ({ useConsultas: () => ({ proxima: null, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/bemestar/useHabitos', () => ({ useHabitos: () => ({ habitos: null, perdaNaoIntencional: null, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/bemestar/useSequencia', () => ({ useSequencia: () => ({ sequencia: 0, marco: null, dispensarMarco: jest.fn() }) }));
jest.mock('@core/lembretes/useAvisos', () => ({ useAvisos: () => ({ precisa: false, ativar: jest.fn(), adiar: jest.fn(), avaliar: jest.fn() }) }));
jest.mock('@core/cardio/lembretesCardio', () => ({ sincronizarLembretesMedicacao: async () => {} }));
jest.mock('@core/lembretes/preferencias', () => ({ renovarAvisosDiarios: async () => {} }));
jest.mock('@core/bemestar/useConquistas', () => ({ useConquistas: () => ({ proxima: null, dispensar: jest.fn(), avaliar: async () => 0 }) }));

const Home = require('../../../../app/(app)/(tabs)/index').default;

const CINCO = ['Anotar minha pressão', 'Meus remédios', 'Anotar minha glicemia', 'Levar ao médico', 'Minhas consultas'];
const CUIDADOS = ['Pressão, coração e diabetes', 'Exames de prevenção', 'Hábitos e bem-estar'];

const montadas: any[] = [];
async function montar() {
  let a: any;
  await act(async () => { a = create(<Home />); });
  montadas.push(a);
  return a;
}
afterEach(() => { act(() => { montadas.splice(0).forEach((a) => a.unmount()); }); });
/** Conteúdo de cada `Text` da tela (o `Text` de fora; os de dentro repetem o mesmo texto). */
const textos = (a: any): string[] => a.root.findAllByType(Text).map(textoDe);
const botao = (a: any, rotulo: string) => a.root.findAll((n: any) => n.props.accessibilityLabel === rotulo && typeof n.props.onPress === 'function');

beforeEach(() => {
  mockPush.mockClear();
  mockPerfil = { nome: 'M', semMedicacoes: true, semAntecedentesFamiliares: true, temDiabetes: true };
});

it('abre com "O que você quer fazer?" e as cinco ações', async () => {
  const a = await montar();
  const t = textos(a);
  expect(t).toContain('O que você quer fazer?');
  for (const r of CINCO) expect(botao(a, r)).toHaveLength(1);
  // Pedido do Murilo (24/11/2026): "Para fazer hoje" vem primeiro; as ações logo depois, antes de "Meus cuidados".
  expect(t.indexOf('Para fazer hoje')).toBeLessThan(t.indexOf('O que você quer fazer?'));
  expect(t.indexOf('Minhas consultas')).toBeLessThan(t.indexOf('Meus cuidados'));
});

it('com diabetes, mostra "Anotar minha glicemia"; sem, "Meus exames"', async () => {
  let a = await montar();
  expect(botao(a, 'Anotar minha glicemia')).toHaveLength(1);
  expect(botao(a, 'Meus exames')).toHaveLength(0);
  mockPerfil = { ...mockPerfil, temDiabetes: null };
  a = await montar();
  expect(botao(a, 'Anotar minha glicemia')).toHaveLength(0);
  expect(botao(a, 'Meus exames')).toHaveLength(1);
});

it('"Para fazer hoje" substitui "Pendências"; "Meus cuidados" tem os três módulos novos', async () => {
  const a = await montar();
  const t = textos(a);
  expect(t).toContain('Para fazer hoje');
  expect(t).not.toContain('Pendências');
  expect(t).toContain('Meus cuidados');
  expect(t.indexOf('Para fazer hoje')).toBeLessThan(t.indexOf('Meus cuidados'));
  const ordem = CUIDADOS.map((c) => t.indexOf(c));
  expect(ordem.every((i) => i > t.indexOf('Meus cuidados'))).toBe(true);
  expect([...ordem].sort((x, y) => x - y)).toEqual(ordem);
  expect(t).toContain('Pressão, MRPA, glicemia, exames e risco do coração');
  expect(t).toContain('Mamografia, papanicolau, intestino e outros exames de rotina');
  expect(t).toContain('Peso, sono, atividades, água, alimentação e metas');
  for (const c of CUIDADOS) {
    const [card] = botao(a, c);
    // O VoiceOver lê o nome e, em seguida, o que tem dentro.
    expect(card.props.accessibilityHint).toBeTruthy();
    expect(t).toContain(card.props.accessibilityHint);
    expect(StyleSheet.flatten(card.props.style({ pressed: false }))).toMatchObject({ width: '100%' });
    expect(StyleSheet.flatten(card.props.style({ pressed: false })).flex).toBeUndefined();
  }
});

it('cada cartão de "Meus cuidados" abre o seu módulo', async () => {
  const a = await montar();
  apertar(a, 'Pressão, coração e diabetes');
  apertar(a, 'Exames de prevenção');
  apertar(a, 'Hábitos e bem-estar');
  expect(mockPush.mock.calls.map((c) => c[0])).toEqual(['/(app)/coracao', '/(app)/rastreando', '/(app)/bem-estar']);
});

it('saíram "Atalhos", "Módulos", "Minha Saúde" da grade e "Como está sua saúde hoje?"', async () => {
  const a = await montar();
  const t = textos(a);
  for (const velho of ['Atalhos', 'Módulos', 'Minha Saúde', 'Como está sua saúde hoje?', 'Rastreamentos', 'Coração & Metabolismo', 'Saúde & Bem-estar']) {
    expect(t).not.toContain(velho);
  }
  expect(botao(a, 'Minha Saúde')).toHaveLength(0);
  expect(botao(a, 'Relatório para o médico')).toHaveLength(0);
});

it('tocar em "Anotar minha pressão" abre o registro de pressão', async () => {
  const a = await montar();
  await act(async () => { botao(a, 'Anotar minha pressão')[0].props.onPress(); });
  expect(mockPush).toHaveBeenCalledWith('/(app)/coracao/pressao/registrar');
});

it('o círculo "Anotar" está na tela e abre a folha com origem "/"', async () => {
  const a = await montar();
  const [circulo] = botao(a, 'Anotar');
  expect(circulo).toBeDefined();
  await act(async () => { circulo.props.onPress(); });
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/(app)/anotar', params: { origem: '/' } });
});
