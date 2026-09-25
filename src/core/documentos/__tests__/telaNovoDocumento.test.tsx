/**
 * Regressão da espera do Nero no envio de documento (D-023): o upload não aborta no meio, então
 * cancelar depois que ele começou deixaria um arquivo no bucket que nenhum registro lista. A tela
 * precisa apagar esse órfão e não gravar o documento. Renderiza a tela com storage simulado,
 * cancela enquanto o envio está pendente e confere as duas coisas.
 */
import React from 'react';
import { act, create } from 'react-test-renderer';

let mockInseridos: unknown[] = [];
let mockApagados: string[] = [];
let resolverEnvio: ((v: { caminho: string; tamanho: number; mime: string }) => void) | null = null;
(globalThis as any).mockReact = React;

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ uri: 'file:///laudo.jpg', mime: 'image/jpeg', nome: 'laudo.jpg' }),
}));
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false, online: true, sair: jest.fn() }) }));
jest.mock('@core/documentos/repositorio', () => ({
  listarExamesParaVinculo: async () => [],
  inserir: async (_u: string, d: unknown) => { mockInseridos.push(d); },
}));
jest.mock('@core/documentos/storage', () => ({
  enviar: () => new Promise((r) => { resolverEnvio = r as typeof resolverEnvio; }),
  apagarArquivo: async (caminho: string) => { mockApagados.push(caminho); },
}));
jest.mock('@modules/minha-saude/componentes/escolherArquivo', () => ({ escolherArquivo: async () => null }));

const NovoDocumento = require('../../../../app/(app)/(tabs)/minha-saude/documentos/novo').default;

/** Texto visível de um nó: as strings soltas em toda a sua descendência. */
function textoDe(no: any): string {
  if (typeof no === 'string') return no;
  return (no.children ?? []).map(textoDe).join(' ');
}

/** Aciona o `onPress` do primeiro nó pressionável cujo rótulo ou texto bate. */
function apertar(arvore: any, rotulo: string) {
  const alvo = arvore.root.findAll((n: any) =>
    typeof n.props?.onPress === 'function' && (n.props.label === rotulo || textoDe(n).includes(rotulo)))[0];
  if (!alvo) throw new Error(`não achei "${rotulo}" na tela`);
  alvo.props.onPress();
}

beforeEach(() => { mockInseridos = []; mockApagados = []; resolverEnvio = null; });

it('cancelar durante o envio apaga o arquivo enviado e não grava o documento', async () => {
  let arvore: any;
  await act(async () => { arvore = create(<NovoDocumento />); });

  await act(async () => { apertar(arvore, 'Salvar documento'); });
  expect(resolverEnvio).not.toBeNull();

  await act(async () => { apertar(arvore, 'Cancelar'); });
  await act(async () => { resolverEnvio!({ caminho: 'u1/abc.jpg', tamanho: 10, mime: 'image/jpeg' }); });

  expect(mockApagados).toEqual(['u1/abc.jpg']);
  expect(mockInseridos).toEqual([]);
}, 10000);

it('sem cancelar, grava o documento e não apaga nada', async () => {
  let arvore: any;
  await act(async () => { arvore = create(<NovoDocumento />); });

  await act(async () => { apertar(arvore, 'Salvar documento'); });
  await act(async () => { resolverEnvio!({ caminho: 'u1/abc.jpg', tamanho: 10, mime: 'image/jpeg' }); });

  expect(mockApagados).toEqual([]);
  expect(mockInseridos).toHaveLength(1);
}, 10000);
