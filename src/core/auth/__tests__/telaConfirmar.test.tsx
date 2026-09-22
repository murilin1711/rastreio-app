/**
 * Regressão da tela de confirmação por código (D-019).
 *
 * O público é majoritariamente idoso, então o que se garante aqui é o comportamento que protege a
 * pessoa: código colado com sujeira funciona, código errado não derruba nem avança, e o botão de
 * reenviar não fica travado para sempre nem pede código em rajada.
 */
import React from 'react';
import { act, create } from 'react-test-renderer';

let mockVerificacoes: { email: string; token: string; type: string }[] = [];
let mockReenvios: number = 0;
let mockErroVerificar: string | null = null;
let mockSubstituiu: string[] = [];
(globalThis as any).mockReact = React;

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: (r: string) => { mockSubstituiu.push(r); }, push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ email: 'maria@exemplo.com' }),
}));
jest.mock('@core/supabase/client', () => ({
  supabase: {
    auth: {
      verifyOtp: async (p: { email: string; token: string; type: string }) => {
        mockVerificacoes.push(p);
        return mockErroVerificar ? { data: { session: null }, error: { message: mockErroVerificar } } : { data: { session: { user: { id: 'u1' } } }, error: null };
      },
      resend: async () => { mockReenvios++; return { error: null }; },
    },
  },
}));
jest.mock('@core/supabase/erros', () => ({ traduzirErro: (e: { message: string }) => ({ mensagemUsuario: e.message }) }));

const Confirmar = require('../../../../app/(auth)/confirmar').default;

// Acha o campo de código e o botão pelo texto/props, sem depender da árvore exata.
const campo = (t: any) => t.root.findAll((n: any) => n.props?.testID === 'campo-codigo')[0];
const botaoReenviar = (t: any) => t.root.findAll((n: any) => n.props?.testID === 'botao-reenviar')[0];

beforeEach(() => {
  mockVerificacoes = []; mockReenvios = 0; mockErroVerificar = null; mockSubstituiu = [];
});

it('verifica sozinho quando os seis dígitos estão preenchidos, e entra no app', async () => {
  let t: any; await act(async () => { t = create(<Confirmar />); });
  await act(async () => { campo(t).props.onChangeText('123456'); });
  expect(mockVerificacoes).toEqual([{ email: 'maria@exemplo.com', token: '123456', type: 'signup' }]);
  expect(mockSubstituiu).toEqual(['/']);
});

it('aceita o código colado com espaços ou texto junto', async () => {
  let t: any; await act(async () => { t = create(<Confirmar />); });
  await act(async () => { campo(t).props.onChangeText('Código: 123 456'); });
  expect(mockVerificacoes[0].token).toBe('123456');
});

it('não verifica antes dos seis dígitos', async () => {
  let t: any; await act(async () => { t = create(<Confirmar />); });
  await act(async () => { campo(t).props.onChangeText('12345'); });
  expect(mockVerificacoes).toHaveLength(0);
});

it('código errado mostra recado e deixa a pessoa tentar de novo, sem sair da tela', async () => {
  mockErroVerificar = 'Token has expired or is invalid';
  let t: any; await act(async () => { t = create(<Confirmar />); });
  await act(async () => { campo(t).props.onChangeText('000000'); });
  expect(mockSubstituiu).toEqual([]);
  expect(JSON.stringify(t.toJSON())).toContain('não conferiu');
  // e o campo volta a aceitar outro código
  mockErroVerificar = null;
  await act(async () => { campo(t).props.onChangeText('123456'); });
  expect(mockSubstituiu).toEqual(['/']);
});

it('não verifica o mesmo código duas vezes seguidas', async () => {
  let t: any; await act(async () => { t = create(<Confirmar />); });
  await act(async () => { campo(t).props.onChangeText('123456'); });
  await act(async () => { campo(t).props.onChangeText('123456'); });
  expect(mockVerificacoes).toHaveLength(1);
});

it('o botão de reenviar começa travado e destrava depois da espera', async () => {
  jest.useFakeTimers();
  let t: any; await act(async () => { t = create(<Confirmar />); });
  expect(botaoReenviar(t).props.disabled).toBe(true);
  await act(async () => { jest.advanceTimersByTime(61_000); });
  expect(botaoReenviar(t).props.disabled).toBe(false);
  await act(async () => { botaoReenviar(t).props.onPress(); });
  expect(mockReenvios).toBe(1);
  jest.useRealTimers();
});
