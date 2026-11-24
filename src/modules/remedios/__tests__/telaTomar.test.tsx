/**
 * Tela "Tomou?" (spec §6.3): aberta pelo lembrete, pela Home ou pela lista de hoje. Marca a dose com a
 * quantidade escolhida, corrige uma marca já feita e não trava esperando a fila dos lembretes (R-T5-b).
 */
import React from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { apertar, textoDe } from '../../../testes/arvore';

(globalThis as any).mockReact = React;

const remedio = (extra: Record<string, unknown>) => ({
  id: 'm1', nome: 'Losartana', dose: '50 mg', horarios: [{ hora: '08:00', quantidade: 1 }], unidade: 'comprimido',
  doseVariavel: false, sePrecisar: false, horariosDesde: null, desde: null, ate: null, prescritor: null, ativa: true,
  lembrar: true, observacao: null, ...extra,
});

let mockParams: Record<string, string> = {};
let mockLista: any[] = [];
let mockTomadas: any[] = [];
const mockBack = jest.fn();
const mockRegistrar = jest.fn(async (..._a: any[]) => {});
const mockSubstituir = jest.fn(async (..._a: any[]) => {});
const mockCancelarSegundo = jest.fn(async (..._a: any[]) => {});

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));
jest.mock('@core/navegacao/useVoltar', () => ({ useVoltar: () => mockBack, useAbrir: () => jest.fn() }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false }) }));
let mockIds = 0;
jest.mock('@core/medicacoes/repositorio', () => ({
  novoIdTomada: () => `id-${++mockIds}`,
  listarMedicacoes: async () => mockLista,
  listarTomadas: async () => mockTomadas,
  registrarTomada: (...a: any[]) => mockRegistrar(...a),
  substituirTomadas: (...a: any[]) => mockSubstituir(...a),
}));
jest.mock('@core/cardio/lembretesCardio', () => ({ cancelarSegundoLembrete: (...a: any[]) => mockCancelarSegundo(...a) }));

const Tomar = require('../../../../app/(app)/remedios/tomar').default;
const { MS_SAIDA_CONCLUIDA } = require('@ui/index');

let arvore: ReactTestRenderer;
const tela = () => textoDe(arvore.toJSON());
const tocar = (rotulo: string) => act(async () => { apertar(arvore, rotulo); });
const tocarRotulo = (rotulo: string) =>
  act(async () => { arvore.root.find((n) => n.props.accessibilityLabel === rotulo && typeof n.props.onPress === 'function').props.onPress(); });
const abrir = async () => { await act(async () => { arvore = create(<Tomar />); }); };

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-11-23T08:20:00') });
  mockParams = { med: 'm1', hora: '08:00', data: '2026-11-23' };
  mockLista = [remedio({}), remedio({ id: 'm3', nome: 'Dipirona', dose: '500 mg', horarios: [], sePrecisar: true })];
  mockTomadas = [];
  mockBack.mockClear();
  mockRegistrar.mockReset().mockImplementation(async () => {});
  mockSubstituir.mockReset().mockImplementation(async () => {});
  mockCancelarSegundo.mockReset().mockImplementation(async () => {});
});
afterEach(() => {
  act(() => arvore?.unmount());
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('mostra remédio, horário e quantidade prevista', async () => {
  await abrir();
  expect(tela()).toContain('Losartana 50 mg');
  expect(tela()).toContain('Dose das 8h · 1 comprimido');
  expect(tela()).toContain('Quantos comprimidos?');
  expect(tela()).toContain('✓ Tomei');
  expect(tela()).toContain('Não tomei');
});

it('dose que muda conforme o dia: o subtítulo não mostra quantidade', async () => {
  mockLista = [remedio({ doseVariavel: true })];
  await abrir();
  expect(tela()).toContain('Dose das 8h');
  expect(tela()).not.toContain('Dose das 8h ·');
});

it('"✓ Tomei" grava com a quantidade mostrada, cancela o segundo lembrete e mostra "Marcado ✓"', async () => {
  await abrir();
  await tocarRotulo('Aumentar');
  await tocarRotulo('Aumentar');
  await tocar('✓ Tomei');
  expect(mockRegistrar).toHaveBeenCalledWith('u1', {
    medicacaoId: 'm1', dataPrevista: '2026-11-23', horaPrevista: '08:00', quantidadePrevista: 1, tomou: true, quantidade: 2,
  }, expect.any(String));
  expect(mockCancelarSegundo).toHaveBeenCalledWith('m1', '2026-11-23', '08:00');
  expect(tela()).toContain('Marcado ✓');
  expect(mockBack).not.toHaveBeenCalled();
  await act(async () => { jest.advanceTimersByTime(MS_SAIDA_CONCLUIDA); });
  expect(mockBack).toHaveBeenCalledTimes(1);
});

it('mostra "Marcado ✓" sem esperar a fila dos lembretes (R-T5-b)', async () => {
  mockCancelarSegundo.mockImplementation(() => new Promise(() => {}));
  await abrir();
  await tocar('✓ Tomei');
  expect(tela()).toContain('Marcado ✓');
  await act(async () => { jest.advanceTimersByTime(MS_SAIDA_CONCLUIDA); });
  expect(mockBack).toHaveBeenCalledTimes(1);
});

it('falha ao cancelar o segundo lembrete não vira erro na tela', async () => {
  const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockCancelarSegundo.mockImplementation(async () => { throw new Error('fila'); });
  await abrir();
  await tocar('✓ Tomei');
  expect(tela()).toContain('Marcado ✓');
  expect(alerta).not.toHaveBeenCalled();
});

it('"Não tomei" grava tomou=false sem quantidade', async () => {
  await abrir();
  await tocar('Não tomei');
  expect(mockRegistrar).toHaveBeenCalledWith('u1', {
    medicacaoId: 'm1', dataPrevista: '2026-11-23', horaPrevista: '08:00', quantidadePrevista: 1, tomou: false, quantidade: null,
  }, expect.any(String));
  expect(mockCancelarSegundo).toHaveBeenCalledWith('m1', '2026-11-23', '08:00');
  expect(tela()).toContain('Marcado ✓');
});

it('toque duplo em "✓ Tomei" grava uma vez só', async () => {
  let terminar!: () => void;
  mockRegistrar.mockImplementation(() => new Promise<void>((r) => { terminar = r; }));
  await abrir();
  await act(async () => {
    apertar(arvore, '✓ Tomei');
    apertar(arvore, '✓ Tomei');
  });
  expect(mockRegistrar).toHaveBeenCalledTimes(1);
  await act(async () => { terminar(); });
  expect(tela()).toContain('Marcado ✓');
  expect(mockRegistrar).toHaveBeenCalledTimes(1);
});

it('sem internet: avisa e não volta', async () => {
  const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockRegistrar.mockImplementation(async () => { throw new Error('Network request failed'); });
  await abrir();
  await tocar('✓ Tomei');
  expect(alerta).toHaveBeenCalledWith('Não foi possível marcar', expect.any(String));
  expect(tela()).not.toContain('Marcado ✓');
  expect(mockCancelarSegundo).not.toHaveBeenCalled();
  await act(async () => { jest.advanceTimersByTime(MS_SAIDA_CONCLUIDA * 2); });
  expect(mockBack).not.toHaveBeenCalled();
  // Os botões voltam a funcionar para tentar de novo.
  mockRegistrar.mockImplementation(async () => {});
  await tocar('✓ Tomei');
  expect(mockRegistrar).toHaveBeenCalledTimes(2);
});

it('repetir a MESMA ação depois de uma falha usa o mesmo id (M3: a marca não dobra)', async () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockRegistrar.mockImplementationOnce(async () => { throw new Error('Network request failed'); });
  await abrir();
  await tocar('✓ Tomei');
  await tocar('✓ Tomei');
  expect(mockRegistrar).toHaveBeenCalledTimes(2);
  const [primeira, segunda] = mockRegistrar.mock.calls.map((c) => c[2]);
  expect(typeof primeira).toBe('string');
  expect(segunda).toBe(primeira);
});

it('depois de uma falha, outra ação (ou outra quantidade) ganha id novo', async () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockRegistrar.mockImplementation(async () => { throw new Error('Network request failed'); });
  await abrir();
  await tocar('✓ Tomei');
  await tocar('Não tomei');
  await tocarRotulo('Aumentar');
  await tocar('✓ Tomei');
  const ids = mockRegistrar.mock.calls.map((c) => c[2]);
  expect(new Set(ids).size).toBe(3);
});

describe('dose já marcada', () => {
  beforeEach(() => {
    mockTomadas = [{
      id: 't1', medicacaoId: 'm1', dataPrevista: '2026-11-23', horaPrevista: '08:00', quantidadePrevista: 1,
      tomou: true, quantidade: 1, marcadoEm: new Date('2026-11-23T08:10:00').toISOString(),
    }];
  });

  it('avisa a hora e oferece Corrigir e Tomei de novo', async () => {
    await abrir();
    expect(tela()).toContain('Você já marcou essa dose às 8h10');
    expect(tela()).toContain('Corrigir');
    expect(tela()).toContain('Tomei de novo');
    expect(tela()).not.toContain('✓ Tomei');
  });

  it('"Tomei de novo" grava uma segunda tomada', async () => {
    await abrir();
    await tocar('Tomei de novo');
    expect(mockRegistrar).toHaveBeenCalledWith('u1', {
      medicacaoId: 'm1', dataPrevista: '2026-11-23', horaPrevista: '08:00', quantidadePrevista: 1, tomou: true, quantidade: 1,
    }, expect.any(String));
    expect(mockSubstituir).not.toHaveBeenCalled();
    expect(tela()).toContain('Marcado ✓');
  });

  it('"Corrigir" volta aos botões e grava substituindo a marca', async () => {
    await abrir();
    await tocar('Corrigir');
    expect(tela()).toContain('✓ Tomei');
    expect(tela()).toContain('Não tomei');
    await tocar('Não tomei');
    expect(mockSubstituir).toHaveBeenCalledWith(
      'u1',
      { medicacaoId: 'm1', dataPrevista: '2026-11-23', horaPrevista: '08:00' },
      { medicacaoId: 'm1', dataPrevista: '2026-11-23', horaPrevista: '08:00', quantidadePrevista: 1, tomou: false, quantidade: null },
      expect.any(String),
    );
    expect(mockRegistrar).not.toHaveBeenCalled();
    expect(tela()).toContain('Marcado ✓');
  });

  it('a quantidade prevista vem da marca, não do cadastro atual', async () => {
    mockLista = [remedio({ horarios: [{ hora: '08:00', quantidade: 2 }] })];
    await abrir();
    expect(tela()).toContain('Dose das 8h · 1 comprimido');
  });
});

it('fora do prazo: só a explicação, sem botões', async () => {
  mockParams = { med: 'm1', hora: '08:00', data: '2026-11-21' };
  await abrir();
  expect(tela()).toContain('Essa dose já passou do prazo para marcar.');
  expect(tela()).not.toContain('✓ Tomei');
  expect(tela()).not.toContain('Não tomei');
});

it('dose de ontem ainda pode ser marcada', async () => {
  mockParams = { med: 'm1', hora: '08:00', data: '2026-11-22' };
  await abrir();
  expect(tela()).toContain('✓ Tomei');
  await tocar('✓ Tomei');
  expect(mockRegistrar).toHaveBeenCalledWith('u1', expect.objectContaining({ dataPrevista: '2026-11-22', horaPrevista: '08:00' }), expect.any(String));
});

it('sem data: a dose é de hoje', async () => {
  mockParams = { med: 'm1', hora: '08:00' };
  await abrir();
  await tocar('✓ Tomei');
  expect(mockRegistrar).toHaveBeenCalledWith('u1', expect.objectContaining({ dataPrevista: '2026-11-23' }), expect.any(String));
});

it('remédio que não está mais na lista', async () => {
  mockLista = [];
  await abrir();
  expect(tela()).toContain('Esse remédio não está mais na sua lista.');
  expect(tela()).not.toContain('✓ Tomei');
});

it('"se precisar": sem horário, grava sem data prevista', async () => {
  mockParams = { med: 'm3' };
  await abrir();
  expect(tela()).toContain('Dipirona 500 mg');
  expect(tela()).toContain('Se precisar');
  expect(tela()).not.toContain('Não tomei'); // sem dose prevista, não há o que deixar de tomar
  await tocar('✓ Tomei');
  expect(mockRegistrar).toHaveBeenCalledWith('u1', {
    medicacaoId: 'm3', dataPrevista: null, horaPrevista: null, quantidadePrevista: null, tomou: true, quantidade: 1,
  }, expect.any(String));
  expect(mockCancelarSegundo).not.toHaveBeenCalled();
  expect(tela()).toContain('Marcado ✓');
});

describe('R-T6-a', () => {
  const marca = (extra: Record<string, unknown>) => ({
    id: 't1', medicacaoId: 'm1', dataPrevista: '2026-11-23', horaPrevista: '08:00', quantidadePrevista: 1,
    tomou: true, quantidade: 1, marcadoEm: new Date('2026-11-23T08:10:00').toISOString(), ...extra,
  });

  it('última marca "não tomei": o aviso diz isso e o botão é "✓ Tomei" (sem "Tomei de novo")', async () => {
    mockTomadas = [marca({ tomou: false, quantidade: null, marcadoEm: new Date('2026-11-23T08:00:00').toISOString() })];
    await abrir();
    expect(tela()).toContain('Você marcou que não tomou essa dose às 8h');
    expect(tela()).not.toContain('Você já marcou');
    expect(tela()).not.toContain('Tomei de novo');
    expect(tela()).toContain('Corrigir');
    await tocar('✓ Tomei');
    expect(mockRegistrar).toHaveBeenCalledWith('u1', {
      medicacaoId: 'm1', dataPrevista: '2026-11-23', horaPrevista: '08:00', quantidadePrevista: 1, tomou: true, quantidade: 1,
    }, expect.any(String));
    expect(mockSubstituir).not.toHaveBeenCalled();
  });

  it('horário que saiu do cadastro e sem marca: avisa e não oferece gravar', async () => {
    mockParams = { med: 'm1', hora: '09:00', data: '2026-11-23' };
    await abrir();
    expect(tela()).toContain('O horário desse remédio mudou');
    expect(tela()).not.toContain('✓ Tomei');
    expect(tela()).not.toContain('Não tomei');
  });

  it('horário que saiu do cadastro mas tem marca: ainda dá para corrigir', async () => {
    mockParams = { med: 'm1', hora: '07:00', data: '2026-11-23' };
    mockTomadas = [marca({ horaPrevista: '07:00' })];
    await abrir();
    expect(tela()).toContain('Você já marcou essa dose às 8h10');
    expect(tela()).not.toContain('O horário desse remédio mudou');
  });

  it('o "carregando" aparece só no botão tocado', async () => {
    mockRegistrar.mockImplementation(() => new Promise<void>(() => {}));
    await abrir();
    await tocar('Não tomei');
    const botao = (rotulo: string) => arvore.root.find((n) => n.props.label === rotulo && typeof n.props.onPress === 'function');
    expect(botao('Não tomei').props.loading).toBe(true);
    expect(botao('✓ Tomei').props.loading).toBe(false);
    expect(botao('✓ Tomei').props.disabled).toBe(true);
  });

  it('"Marcado" é anunciado ao leitor de tela (iOS também)', async () => {
    const anunciar = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
    await abrir();
    await tocar('✓ Tomei');
    expect(anunciar).toHaveBeenCalledWith('Marcado');
  });
});
