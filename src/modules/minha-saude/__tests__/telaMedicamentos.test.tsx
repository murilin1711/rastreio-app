/**
 * "Meus remédios" (spec §6.1): frase fixa no topo, cadastro com quantidade por horário, unidade,
 * "dose muda conforme o dia" e "se precisar", explicação mostrada uma vez e as doses de hoje em cada remédio.
 */
import React from 'react';
import { Alert, Switch } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { apertar, textoDe } from '../../../testes/arvore';

(globalThis as any).mockReact = React;

const remedio = (extra: Record<string, unknown>) => ({
  id: 'm1', nome: 'Losartana', dose: '50 mg', horarios: [{ hora: '08:00', quantidade: 1 }, { hora: '20:00', quantidade: 1 }],
  unidade: 'comprimido', doseVariavel: false, sePrecisar: false, horariosDesde: null, desde: null, ate: null, prescritor: null,
  ativa: true, lembrar: true, observacao: null, ...extra,
});
const dose = (extra: Record<string, unknown>) => ({
  medicacaoId: 'm1', data: '2026-11-23', hora: '08:00', quantidadePrevista: 1, estado: 'tomou', comAtraso: false, tomadas: [], ...extra,
});

let mockLista: any[] = [];
const mockSalvar = jest.fn(async (_m: any) => {});
// Funções estáveis: a tela as põe nas dependências de efeitos (uma nova a cada render recarregaria sem fim).
const mockRecarregar = jest.fn(async () => {});
const mockAlternar = jest.fn(async () => {});
const mockDoses = { doses: [] as any[], dosesOntem: [] as any[], carregando: false, erro: null as string | null, recarregar: jest.fn(async () => {}) };
const mockAbrir = jest.fn();
const mockFoco: (() => void)[] = [];

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  usePathname: () => '/minha-saude/medicamentos',
  useFocusEffect: (cb: () => void) => { (globalThis as any).mockReact.useEffect(() => { mockFoco.push(cb); cb(); }, [cb]); },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
jest.mock('@core/navegacao/useVoltar', () => ({ useVoltar: () => jest.fn(), useAbrir: () => mockAbrir }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, online: true, carregando: false }) }));
jest.mock('@core/medicacoes/useMedicacoes', () => ({
  useMedicacoes: () => ({ medicacoes: mockLista, carregando: false, salvar: mockSalvar, alternarAtiva: mockAlternar, recarregar: mockRecarregar }),
}));
jest.mock('@core/medicacoes/useDosesHoje', () => ({ useDosesHoje: () => mockDoses }));
const mockPerfil = { perfil: { semMedicacoes: false }, salvar: jest.fn(async () => {}) };
jest.mock('@core/perfil/usePerfil', () => ({ usePerfil: () => mockPerfil }));
const mockConquistas = { avaliar: jest.fn(), proxima: null, dispensar: jest.fn() };
jest.mock('@core/bemestar/useConquistas', () => ({ useConquistas: () => mockConquistas }));
const mockAvisos = { pedir: jest.fn(), modal: null };
jest.mock('@core/lembretes/usePedidoDeAvisos', () => ({ usePedidoDeAvisos: () => mockAvisos }));

const Medicamentos = require('../../../../app/(app)/(tabs)/minha-saude/medicamentos').default;
const FRASE = 'Sempre que tomar, marque no NERO. É assim que você e seu médico acompanham o tratamento.';

let arvore: ReactTestRenderer;
const tela = () => textoDe(arvore.toJSON());
const tocar = (rotulo: string) => act(async () => { apertar(arvore, rotulo); });
const abrir = async () => { await act(async () => { arvore = create(<Medicamentos />); }); };
const campo = (placeholder: string) => arvore.root.find((n) => n.props.placeholder === placeholder && typeof n.props.onChangeText === 'function');
const escrever = (placeholder: string, v: string) => act(async () => { campo(placeholder).props.onChangeText(v); });
/** O switch cujo título (texto ao lado) contém `titulo`. */
const chave = (titulo: string) => {
  const linhas = arvore.root.findAll((n) => typeof n.type === 'string' && textoDe(n).includes(titulo) && n.findAll((f) => f.type === Switch).length === 1);
  return linhas[linhas.length - 1].findByType(Switch);
};
const ligar = (titulo: string, v = true) => act(async () => { chave(titulo).props.onValueChange(v); });
const gravado = () => mockSalvar.mock.calls[mockSalvar.mock.calls.length - 1][0];

let alerta: jest.SpyInstance;
beforeEach(() => {
  mockLista = [];
  mockSalvar.mockClear();
  mockAbrir.mockClear();
  mockDoses.doses = [];
  mockDoses.erro = null;
  mockDoses.recarregar = jest.fn(async () => {});
  mockFoco.length = 0;
  alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => {
  act(() => arvore.unmount());
  alerta.mockRestore();
});

it('título "Meus remédios" e a frase fixa no topo', async () => {
  await abrir();
  expect(tela()).toContain('Meus remédios');
  expect(tela()).not.toContain('Meus medicamentos');
  expect(tela()).toContain(FRASE);
});

it('primeiro remédio com horário: grava quantidades e unidade e explica a marcação uma vez', async () => {
  await abrir();
  await tocar('Adicionar medicamento');
  await escrever('Nome, por exemplo Losartana', 'Losartana');
  await tocar('2 vezes');
  expect(tela()).toContain('8h');
  expect(tela()).toContain('20h');
  for (const u of ['Comprimido', 'Gota', 'Unidade (insulina)', 'mL', 'Jato ou inalação']) expect(tela()).toContain(u);
  // A das 20h sobe meio comprimido (1,5); trocar depois para gota não mexe nas quantidades.
  const aumentar = arvore.root.findAll((n) => n.props.accessibilityLabel === 'Aumentar' && typeof n.props.onPress === 'function');
  await act(async () => { aumentar[1].props.onPress(); });
  await tocar('Gota');
  await ligar('A dose muda conforme o dia');
  await tocar('Salvar');
  expect(gravado()).toMatchObject({
    nome: 'Losartana', horarios: [{ hora: '08:00', quantidade: 1 }, { hora: '20:00', quantidade: 1.5 }],
    unidade: 'gota', doseVariavel: true, sePrecisar: false,
  });
  expect(alerta).toHaveBeenCalledWith('Marque cada dose', FRASE);
  expect(mockDoses.recarregar).toHaveBeenCalled();
});

it('já havia remédio com horário: não explica de novo', async () => {
  mockLista = [remedio({ ativa: false })];
  await abrir();
  await tocar('Adicionar medicamento');
  await escrever('Nome, por exemplo Losartana', 'Metformina');
  await tocar('1 vez');
  await tocar('Salvar');
  expect(gravado()).toMatchObject({ nome: 'Metformina', sePrecisar: false });
  expect(alerta).not.toHaveBeenCalled();
});

it('"Tomo só quando preciso": esconde horários e grava sem horário e sem lembrete', async () => {
  await abrir();
  await tocar('Adicionar medicamento');
  await escrever('Nome, por exemplo Losartana', 'Dipirona');
  await tocar('2 vezes');
  await ligar('Lembrar nos horários');
  await ligar('Tomo só quando preciso');
  expect(tela()).toContain('Sem horário fixo e sem lembrete.');
  expect(tela()).not.toContain('2 vezes');
  expect(tela()).not.toContain('Lembrar nos horários');
  expect(tela()).not.toContain('A dose muda conforme o dia');
  await tocar('Salvar');
  expect(gravado()).toMatchObject({ nome: 'Dipirona', horarios: [], sePrecisar: true, lembrar: false });
  expect(alerta).not.toHaveBeenCalled();
});

it('sem horário escolhido, vira "se precisar"', async () => {
  await abrir();
  await tocar('Adicionar medicamento');
  await escrever('Nome, por exemplo Losartana', 'Dipirona');
  await tocar('Salvar');
  expect(gravado()).toMatchObject({ horarios: [], sePrecisar: true, lembrar: false });
});

it('cartão: "Se precisar" e as doses de hoje, cada uma abre "Tomou?"', async () => {
  mockLista = [remedio({}), remedio({ id: 'm2', nome: 'Dipirona', dose: null, horarios: [], sePrecisar: true, lembrar: false })];
  mockDoses.doses = [dose({}), dose({ hora: '20:00', estado: 'pendente' })];
  await abrir();
  expect(tela()).toContain('Se precisar');
  expect(tela()).toContain('8h · ✓ Tomou');
  expect(tela()).toContain('20h · Marcar');
  await tocar('8h · ✓ Tomou');
  expect(mockAbrir).toHaveBeenCalledWith('/(app)/remedios/tomar?med=m1&hora=08:00&data=2026-11-23');
});

it('editar remédio guarda a quantidade de cada horário', async () => {
  mockLista = [remedio({ horarios: [{ hora: '08:00', quantidade: 1.5 }], unidade: 'comprimido' })];
  await abrir();
  await act(async () => { arvore.root.find((n) => n.props.accessibilityLabel === 'Editar' && typeof n.props.onPress === 'function').props.onPress(); });
  expect(tela()).toContain('1 comprimido e meio');
  await tocar('Salvar');
  expect(gravado()).toMatchObject({ id: 'm1', horarios: [{ hora: '08:00', quantidade: 1.5 }], lembrar: true });
});

it('volta para a tela: recarrega as doses de hoje', async () => {
  await abrir();
  const antes = mockDoses.recarregar.mock.calls.length;
  await act(async () => { mockFoco[mockFoco.length - 1](); });
  expect(mockDoses.recarregar.mock.calls.length).toBeGreaterThan(antes);
});

it('erro nas doses de hoje aparece com "Tentar de novo"', async () => {
  mockLista = [remedio({})];
  mockDoses.erro = 'Sem conexão.';
  await abrir();
  expect(tela()).toContain('Sem conexão.');
  await tocar('Tentar de novo');
  expect(mockDoses.recarregar).toHaveBeenCalled();
});
