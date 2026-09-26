/**
 * Onboarding em que o Nero fala (D-063): o fluxo das 7 telas, o nome indo para o cadastro, o "Pular",
 * e a pergunta dos avisos que não gasta a chance única do iOS.
 */
import React from 'react';
import { AccessibilityInfo, Keyboard, Text, TextInput } from 'react-native';
import { act, create } from 'react-test-renderer';

const mockMem: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: async (k: string, v: string) => { mockMem[k] = v; },
  getItem: async (k: string) => mockMem[k] ?? null,
  removeItem: async (k: string) => { delete mockMem[k]; },
}));
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }), useLocalSearchParams: () => ({}) }));
let mockEstado: 'concedida' | 'perguntar' | 'negada' = 'perguntar';
const mockPedir = jest.fn(async () => true);
jest.mock('@core/lembretes/permissao', () => ({ estadoPermissao: async () => mockEstado, pedirPermissaoNotificacoes: () => mockPedir() }));
const mockAdiar = jest.fn(async () => {});
jest.mock('@core/lembretes/useAvisos', () => ({ marcarAdiado: () => mockAdiar() }));
jest.mock('@ui/components/NeroAnimado', () => ({ NeroAnimado: () => null }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: () => null }));
jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(() => Promise.resolve(true));

import { ONBOARDING_KEY } from '@core/onboarding/chave';
import { CenaNero } from '@modules/onboarding/CenaNero';
const Onboarding = require('../../../../app/(auth)/onboarding').default;

const textoDe = (n: any): string => {
  if (typeof n === 'string') return n;
  if (!n || !n.children) return '';
  return n.children.map(textoDe).join('');
};
/** O elemento tocável cujo texto contém `rotulo`, o mais interno (o de menos texto). */
const botao = (a: any, rotulo: string) => {
  const achados = a.root.findAll((n: any) => typeof n.props?.onPress === 'function' && textoDe(n).includes(rotulo));
  if (!achados.length) throw new Error(`Sem botão "${rotulo}". Tela: ${textoDe(a.root)}`);
  return achados.sort((x: any, y: any) => textoDe(x).length - textoDe(y).length)[0];
};
const tocar = async (a: any, rotulo: string) => { await act(async () => { await botao(a, rotulo).props.onPress(); }); await act(async () => {}); };
const tela = (a: any) => a.root.findAll((n: any) => n.type === Text).map((n: any) => textoDe(n)).join(' | ');
const abrir = async () => { let a: any; await act(async () => { a = create(<Onboarding />); }); await act(async () => {}); return a; };
const digitar = async (a: any, texto: string) => { await act(async () => { a.root.findByType(TextInput).props.onChangeText(texto); }); };

beforeEach(() => { for (const k of Object.keys(mockMem)) delete mockMem[k]; mockReplace.mockClear(); mockPedir.mockClear(); mockAdiar.mockClear(); mockEstado = 'perguntar'; });

it('as 7 telas em ordem, até o cadastro, marcando o onboarding como visto', async () => {
  const a = await abrir();
  expect(tela(a)).toContain('Oi, eu sou o Nero!');
  await tocar(a, 'Oi, Nero!');
  expect(tela(a)).toContain('E você, como se chama?');
  await digitar(a, 'Maria');
  await tocar(a, 'Continuar');
  expect(tela(a)).toContain('Prazer, Maria! Vou te mostrar o que eu faço por você.');
  await tocar(a, 'Vamos lá');
  expect(tela(a)).toContain('Anote sua pressão e sua glicemia.');
  await tocar(a, 'Próximo');
  expect(tela(a)).toContain('Eu junto todas as suas informações num relatório.');
  await tocar(a, 'Próximo');
  expect(tela(a)).toContain('Posso te avisar?');
  await tocar(a, 'Agora não');
  expect(tela(a)).toContain('Pronto, Maria! Agora é só criar sua conta.');
  await tocar(a, 'Criar minha conta');
  expect(mockReplace).toHaveBeenCalledWith('/(auth)/cadastro');
  expect(mockMem[ONBOARDING_KEY]).toBe('true');
});

it('o nome é guardado sem espaços e vai para o cadastro', async () => {
  const a = await abrir();
  await tocar(a, 'Oi, Nero!');
  await digitar(a, '  Maria ');
  await tocar(a, 'Continuar');
  expect(mockMem['nero:nome-onboarding']).toBe('Maria');
});

it('voltar e trocar o nome: a fala usa o nome novo', async () => {
  const a = await abrir();
  await tocar(a, 'Oi, Nero!');
  await digitar(a, 'Maria');
  await tocar(a, 'Continuar');
  await tocar(a, 'Voltar');
  await digitar(a, 'Ana');
  await tocar(a, 'Continuar');
  expect(tela(a)).toContain('Prazer, Ana!');
  expect(mockMem['nero:nome-onboarding']).toBe('Ana');
});

it('"Prefiro não dizer": nada guardado e fala sem nome', async () => {
  const a = await abrir();
  await tocar(a, 'Oi, Nero!');
  await tocar(a, 'Prefiro não dizer');
  expect(mockMem['nero:nome-onboarding']).toBeUndefined();
  expect(tela(a)).toContain('Prazer! Vou te mostrar');
});

it('"Continuar" não avança com menos de 2 letras', async () => {
  const a = await abrir();
  await tocar(a, 'Oi, Nero!');
  await digitar(a, ' M ');
  await tocar(a, 'Continuar');
  expect(tela(a)).toContain('E você, como se chama?');
});

it('"Pular" vai ao cadastro e marca como visto', async () => {
  const a = await abrir();
  await tocar(a, 'Pular');
  expect(mockReplace).toHaveBeenCalledWith('/(auth)/cadastro');
  expect(mockMem[ONBOARDING_KEY]).toBe('true');
});

const irAteLembrete = async () => {
  const a = await abrir();
  await tocar(a, 'Oi, Nero!');
  await tocar(a, 'Prefiro não dizer');
  await tocar(a, 'Vamos lá');
  await tocar(a, 'Próximo');
  await tocar(a, 'Próximo');
  return a;
};

it('"Agora não": não gasta o aviso do iOS e cala a Home por 14 dias', async () => {
  const a = await irAteLembrete();
  expect(tela(a)).toContain('Posso te avisar?');
  await tocar(a, 'Agora não');
  expect(mockPedir).not.toHaveBeenCalled();
  expect(mockAdiar).toHaveBeenCalledTimes(1);
});

it('"Sim, pode me avisar" pede a permissão do sistema', async () => {
  const a = await irAteLembrete();
  await tocar(a, 'Sim, pode me avisar');
  expect(mockPedir).toHaveBeenCalledTimes(1);
  expect(tela(a)).toContain('Pronto! Agora é só criar sua conta.');
});

it('com a permissão já decidida, não pergunta de novo', async () => {
  mockEstado = 'concedida';
  const a = await irAteLembrete();
  expect(tela(a)).not.toContain('Posso te avisar?');
  expect(tela(a)).toContain('Eu lembro de marcar seu exame e de tomar água.');
  await tocar(a, 'Próximo');
  expect(tela(a)).toContain('Pronto! Agora é só criar sua conta.');
});

it('"Já tenho conta" vai ao login', async () => {
  mockEstado = 'negada';
  const a = await irAteLembrete();
  await tocar(a, 'Próximo');
  await tocar(a, 'Já tenho conta');
  expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
});

it('com o teclado aberto na tela do nome, o Nero encolhe (o botão não some em iPhone pequeno)', async () => {
  const ouvintes: Record<string, () => void> = {};
  const espiao = jest.spyOn(Keyboard, 'addListener').mockImplementation(((evento: string, cb: () => void) => { ouvintes[evento] = cb; return { remove: () => {} }; }) as never);
  const a = await abrir();
  await tocar(a, 'Oi, Nero!');
  const grande = a.root.findByType(CenaNero).props.tamanho;
  await act(async () => { ouvintes.keyboardWillShow?.(); ouvintes.keyboardDidShow?.(); });
  expect(a.root.findByType(CenaNero).props.tamanho).toBeLessThan(grande);
  await act(async () => { ouvintes.keyboardWillHide?.(); ouvintes.keyboardDidHide?.(); });
  expect(a.root.findByType(CenaNero).props.tamanho).toBe(grande);
  espiao.mockRestore();
});
