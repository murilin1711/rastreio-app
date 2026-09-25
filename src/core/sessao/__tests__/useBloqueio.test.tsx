/**
 * Quando a biometria é pedida (D-032). A regra tem duas metades fáceis de errar: quem não ligou o
 * bloqueio nunca pode ser interrompido, e quem ligou não pode ser interrompido a cada troca rápida
 * de app — pedir demais faz a pessoa desligar o recurso.
 */
import React from 'react';
import { AppState, Text } from 'react-native';
import { act, create } from 'react-test-renderer';

let mockLigado = false;
let mockPedidos = 0;
let mockAprova = true;
let mockErroSistema = false;
let mockSenhaCerta = 'correta';
let mockOuvinte: ((estado: string) => void) | null = null;

jest.mock('expo-secure-store', () => ({
  getItemAsync: async () => (mockLigado ? '1' : null),
  setItemAsync: async () => {},
  deleteItemAsync: async () => {},
}));
jest.mock('expo-local-authentication', () => ({
  AuthenticationType: { FACIAL_RECOGNITION: 2, FINGERPRINT: 1 },
  hasHardwareAsync: async () => true,
  isEnrolledAsync: async () => true,
  supportedAuthenticationTypesAsync: async () => [2],
  authenticateAsync: async () => {
    mockPedidos++;
    if (mockErroSistema) throw new Error('sistema biométrico indisponível');
    return { success: mockAprova };
  },
}));
// O caminho interno do AppState varia entre versões; espionar o módulo público é estável.
jest.mock('@core/supabase/client', () => ({
  supabase: { auth: { signInWithPassword: async ({ password }: any) => ({ error: password === mockSenhaCerta ? null : { message: 'Invalid' } }) } },
}));
jest.spyOn(AppState, 'addEventListener').mockImplementation((_e: any, cb: any) => {
  mockOuvinte = cb;
  return { remove: () => {} } as any;
});

const { useBloqueio } = require('../useBloqueio');
const { MS_TOLERANCIA } = require('../bloqueio');

let ultimo: any = null;
function Tela() {
  const b = useBloqueio();
  ultimo = b;
  return <Text>{b.travado ? (b.exigeSenha ? 'pede senha' : 'travado') : 'livre'}</Text>;
}
const estado = (a: any) => a.root.findByType(Text).props.children;

beforeEach(() => { mockLigado = false; mockPedidos = 0; mockAprova = true; mockErroSistema = false; mockOuvinte = null; ultimo = null; jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); });

it('quem não ligou o bloqueio nunca é interrompido', async () => {
  let a: any;
  await act(async () => { a = create(<Tela />); });
  await act(async () => {});
  expect(estado(a)).toBe('livre');
  expect(mockPedidos).toBe(0);
});

it('quem ligou é travado ao abrir, e liberado quando a biometria passa', async () => {
  mockLigado = true;
  let a: any;
  await act(async () => { a = create(<Tela />); });
  await act(async () => {});
  expect(mockPedidos).toBe(1);
  expect(estado(a)).toBe('livre');
});

it('biometria recusada mantém o app coberto', async () => {
  mockLigado = true; mockAprova = false;
  let a: any;
  await act(async () => { a = create(<Tela />); });
  await act(async () => {});
  expect(estado(a)).toBe('travado');
});

it('trocar de app por instantes não pede de novo', async () => {
  mockLigado = true;
  let a: any;
  await act(async () => { a = create(<Tela />); });
  await act(async () => {});
  expect(mockPedidos).toBe(1);

  await act(async () => { mockOuvinte!('background'); });
  await act(async () => { jest.advanceTimersByTime(30_000); mockOuvinte!('active'); });
  await act(async () => {});
  expect(mockPedidos).toBe(1);          // meio minuto fora: segue liberado
  expect(estado(a)).toBe('livre');
});

it('voltar depois da tolerância pede de novo', async () => {
  mockLigado = true;
  let a: any;
  await act(async () => { a = create(<Tela />); });
  await act(async () => {});

  await act(async () => { mockOuvinte!('background'); });
  await act(async () => { jest.advanceTimersByTime(MS_TOLERANCIA + 1000); mockOuvinte!('active'); });
  await act(async () => {});
  expect(mockPedidos).toBe(2);
});

/**
 * O iPhone não manda só `background` e `active`: ele passa por `inactive` nas duas pontas —
 * `active → inactive → background` ao sair, e `background → inactive → active` ao voltar. Os
 * testes acima omitiam esse degrau, e por isso passavam enquanto o app real não travava nunca:
 * o `inactive` da **volta** era lido como "saiu agora" e zerava a conta do tempo (D-037).
 */
describe('com a sequência de estados que o iOS realmente emite', () => {
  const sair = async () => {
    await act(async () => { mockOuvinte!('inactive'); });
    await act(async () => { mockOuvinte!('background'); });
  };
  const voltar = async () => {
    await act(async () => { mockOuvinte!('inactive'); });
    await act(async () => { mockOuvinte!('active'); });
    await act(async () => {});
  };

  it('voltar depois da tolerância pede de novo', async () => {
    mockLigado = true;
    let a: any;
    await act(async () => { a = create(<Tela />); });
    await act(async () => {});
    expect(mockPedidos).toBe(1);

    await sair();
    await act(async () => { jest.advanceTimersByTime(MS_TOLERANCIA + 1000); });
    await voltar();
    expect(mockPedidos).toBe(2);
  });

  it('voltar antes da tolerância continua não pedindo', async () => {
    mockLigado = true;
    let a: any;
    await act(async () => { a = create(<Tela />); });
    await act(async () => {});

    await sair();
    await act(async () => { jest.advanceTimersByTime(30_000); });
    await voltar();
    expect(mockPedidos).toBe(1);
    expect(estado(a)).toBe('livre');
  });

  it('abrir a central de controle e voltar (inactive sem background) não pede', async () => {
    mockLigado = true;
    let a: any;
    await act(async () => { a = create(<Tela />); });
    await act(async () => {});

    await act(async () => { mockOuvinte!('inactive'); });
    await act(async () => { jest.advanceTimersByTime(MS_TOLERANCIA + 1000); mockOuvinte!('active'); });
    await act(async () => {});
    expect(mockPedidos).toBe(1);
  });
});

describe('quando o sistema biométrico falha (D-032, revisto em 24/09)', () => {
  it('não libera sozinho: passa a pedir a senha da conta', async () => {
    mockLigado = true; mockErroSistema = true;
    let a: any;
    await act(async () => { a = create(<Tela />); });
    await act(async () => {});
    expect(estado(a)).toBe('pede senha');
  });

  it('a senha certa libera', async () => {
    mockLigado = true; mockErroSistema = true;
    let a: any;
    await act(async () => { a = create(<Tela />); });
    await act(async () => {});
    await act(async () => { await ultimo.desbloquearComSenha('x@y.z', 'correta'); });
    expect(estado(a)).toBe('livre');
  });

  it('a senha errada mantém travado e avisa quem chamou', async () => {
    mockLigado = true; mockErroSistema = true;
    let a: any;
    await act(async () => { a = create(<Tela />); });
    await act(async () => {});
    let ok: boolean | undefined;
    await act(async () => { ok = await ultimo.desbloquearComSenha('x@y.z', 'chute'); });
    expect(ok).toBe(false);
    expect(estado(a)).toBe('pede senha');
  });
});
