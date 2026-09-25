/**
 * Regressão do piso da espera (D-023): o PDF fica pronto em menos de um segundo, e sem o piso o Nero
 * piscava e a folha de compartilhamento abria por cima da animação. A tela precisa segurar a espera
 * por 2 s, fechá-la e só então compartilhar. Relógio simulado para o teste não durar esse tempo.
 */
import React from 'react';
import { act, create } from 'react-test-renderer';

let mockCompartilhados: string[] = [];
let mockGerou = 0;

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ tipo: 'geral', dias: '90' }),
}));
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false, online: true, sair: jest.fn() }) }));
jest.mock('@core/relatorios/useRelatorio', () => ({
  useRelatorio: () => ({ titulo: 'Relatório', periodo: { rotulo: '90 dias' }, secoes: [], dados: {}, carregando: false, erro: null, html: () => '<html></html>' }),
}));
jest.mock('@core/relatorios/gerarPdf', () => ({
  gerarPdf: async () => { mockGerou++; return 'file:///relatorio.pdf'; },
  compartilharArquivo: async (uri: string) => { mockCompartilhados.push(uri); },
}));
jest.mock('@core/relatorios/compartilharQr', () => ({ criarCompartilhamento: jest.fn(), revogar: jest.fn() }));
jest.mock('@modules/minha-saude/componentes/SecaoRelatorioView', () => ({ SecaoRelatorioView: () => null }));

const Previa = require('../../../../app/(app)/(tabs)/minha-saude/relatorios/previa').default;
const { PISO_ESPERA_MS, LIMITE_FECHAMENTO_MS, EsperaNero } = require('@ui/index');

function textoDe(no: any): string {
  if (typeof no === 'string') return no;
  return (no.children ?? []).map(textoDe).join(' ');
}
/** O nó da espera, para ler `visivel` e disparar `onFechada` como o Modal faria. */
let arvoreAtual: any;
const espera = () => arvoreAtual.root.findByType(EsperaNero);

function apertar(arvore: any, rotulo: string) {
  const alvo = arvore.root.findAll((n: any) =>
    typeof n.props?.onPress === 'function' && (n.props.label === rotulo || textoDe(n).includes(rotulo)))[0];
  if (!alvo) throw new Error(`não achei "${rotulo}" na tela`);
  alvo.props.onPress();
}
/** Avança o relógio simulado e deixa as promessas pendentes correrem. */
async function avancar(ms: number) {
  await act(async () => { jest.advanceTimersByTime(ms); });
  await act(async () => {});
}

beforeEach(() => { mockCompartilhados = []; mockGerou = 0; jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); });

it('segura a espera pelo piso e só compartilha depois que ela sai da tela', async () => {
  let arvore: any;
  await act(async () => { arvore = create(<Previa />); });
  arvoreAtual = arvore;

  await act(async () => { apertar(arvore, 'Gerar PDF e compartilhar'); });
  await act(async () => {});

  // PDF pronto quase de imediato, mas a espera continua no ar e nada foi compartilhado ainda.
  expect(mockGerou).toBe(1);
  expect(mockCompartilhados).toEqual([]);
  expect(espera().props.visivel).toBe(true);

  await avancar(PISO_ESPERA_MS - 100);
  expect(mockCompartilhados).toEqual([]);

  // Cumprido o piso, a espera sai da tela — mas o compartilhamento NÃO pode partir só porque o
  // tempo passou: no iOS, apresentar a folha enquanto o modal ainda faz o dismiss faz o sistema
  // descartá-la em silêncio. Ele espera o `onDismiss` do próprio Modal.
  await avancar(300);
  expect(espera().props.visivel).toBe(false);
  expect(mockCompartilhados).toEqual([]);

  // O modal avisa que saiu de fato → só então a folha abre.
  await act(async () => { espera().props.onFechada(); });
  await act(async () => {});
  expect(mockCompartilhados).toEqual(['file:///relatorio.pdf']);
}, 10000);

it('se o aviso de fechamento nunca vier, compartilha mesmo assim depois do limite', async () => {
  let arvore: any;
  await act(async () => { arvore = create(<Previa />); });
  arvoreAtual = arvore;
  await act(async () => { apertar(arvore, 'Gerar PDF e compartilhar'); });
  await act(async () => {});
  await avancar(PISO_ESPERA_MS + 100);
  expect(mockCompartilhados).toEqual([]);

  // Android não dispara `onDismiss`; o limite de segurança garante que o PDF não fique preso.
  await avancar(LIMITE_FECHAMENTO_MS + 50);
  expect(mockCompartilhados).toEqual(['file:///relatorio.pdf']);
}, 10000);
