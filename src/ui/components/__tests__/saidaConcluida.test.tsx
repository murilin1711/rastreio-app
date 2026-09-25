/**
 * Saída verde das pendências (D-024): o item resolvido não some na hora — fica na lista, marcado
 * como concluído, enquanto a animação roda, e só então é removido. Com Reduce Motion ligado sai
 * direto, sem animação nenhuma.
 */
import React from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import { MS_DESFAZER, MS_SAIDA_CONCLUIDA, SaidaConcluida, useSaidaConcluida } from '@ui/components/SaidaConcluida';

let mockReduzirMovimento = false;
jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(() => Promise.resolve(mockReduzirMovimento));

interface Item { id: string }

function Lista({ itens, ativo = true }: { itens: Item[]; ativo?: boolean }) {
  const saida = useSaidaConcluida(itens, (i) => i.id, ativo);
  return (
    <>
      {saida.lista.map(({ item, concluido }) => (
        <SaidaConcluida key={item.id} concluido={concluido} aoSair={() => saida.aoSair(item)}>
          <Text>{item.id}{concluido ? ' concluido' : ''}</Text>
        </SaidaConcluida>
      ))}
    </>
  );
}

/** Só os rótulos da lista: o tique de concluído também é um Text (Ionicons), e entra vazio aqui. */
const textos = (arvore: any) => arvore.root.findAllByType(Text)
  .map((n: any) => (Array.isArray(n.props.children) ? n.props.children.join('') : String(n.props.children ?? '')))
  .filter((t: string) => /^[ab]/.test(t));

beforeEach(() => { mockReduzirMovimento = false; jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); });

it('segura o item resolvido como concluído e o remove quando a animação termina', async () => {
  let arvore: any;
  await act(async () => { arvore = create(<Lista itens={[{ id: 'a' }, { id: 'b' }]} />); });
  expect(textos(arvore)).toEqual(['a', 'b']);

  await act(async () => { arvore.update(<Lista itens={[{ id: 'b' }]} />); });
  // Fica no lugar dele enquanto sai (D-046) — antes pulava para o fim da lista.
  expect(textos(arvore)).toEqual(['a concluido', 'b']);

  await act(async () => { jest.advanceTimersByTime(MS_SAIDA_CONCLUIDA + 50); });
  await act(async () => {});
  expect(textos(arvore)).toEqual(['b']);
});

it('fora de vista, congela; ao voltar, o item resolvido sai na frente da pessoa (D-046)', async () => {
  let arvore: any;
  await act(async () => { arvore = create(<Lista itens={[{ id: 'a' }, { id: 'b' }]} />); });
  // A pessoa foi para outra tela e resolveu "a" lá.
  await act(async () => { arvore.update(<Lista itens={[{ id: 'b' }]} ativo={false} />); });
  expect(textos(arvore)).toEqual(['a', 'b']); // congelada: nada muda escondido
  // Voltou: já no primeiro quadro, "a" aparece concluído — sem sumir e reaparecer.
  await act(async () => { arvore.update(<Lista itens={[{ id: 'b' }]} ativo />); });
  expect(textos(arvore)).toEqual(['a concluido', 'b']);
  await act(async () => { jest.advanceTimersByTime(MS_SAIDA_CONCLUIDA + 50); });
  await act(async () => {});
  expect(textos(arvore)).toEqual(['b']);
});

it('com Reduce Motion, sai sem esperar a animação', async () => {
  mockReduzirMovimento = true;
  let arvore: any;
  await act(async () => { arvore = create(<Lista itens={[{ id: 'a' }]} />); });
  await act(async () => { arvore.update(<Lista itens={[]} />); });
  await act(async () => {});
  expect(textos(arvore)).toEqual([]);
});

describe('com "Desfazer" (D-028)', () => {
  /** Tela mínima: um item concluído que pode ser desfeito enquanto o tempo corre. */
  function Item({ aoSair, aoDesfazer }: { aoSair: () => void; aoDesfazer: () => void }) {
    return <SaidaConcluida concluido aoSair={aoSair} aoDesfazer={aoDesfazer}><Text>a</Text></SaidaConcluida>;
  }
  const apertarDesfazer = (arvore: any) =>
    arvore.root.findAll((n: any) => typeof n.props?.onPress === 'function')[0].props.onPress();


  it('segura o item por 15 s antes de deixá-lo sair', async () => {
    const saiu = jest.fn();
    let arvore: any;
    await act(async () => { arvore = create(<Item aoSair={saiu} aoDesfazer={jest.fn()} />); });
    await act(async () => {});

    // No tempo da saída curta (1,2 s) ainda não saiu: com desfazer, a espera é outra.
    await act(async () => { jest.advanceTimersByTime(MS_SAIDA_CONCLUIDA); });
    expect(saiu).not.toHaveBeenCalled();

    await act(async () => { jest.advanceTimersByTime(MS_DESFAZER); });
    await act(async () => {});
    expect(saiu).toHaveBeenCalled();
  });

  it('desfazer interrompe a saída', async () => {
    const saiu = jest.fn(), desfez = jest.fn();
    let arvore: any;
    await act(async () => { arvore = create(<Item aoSair={saiu} aoDesfazer={desfez} />); });
    await act(async () => {});

    await act(async () => { jest.advanceTimersByTime(3000); });
    await act(async () => { apertarDesfazer(arvore); });

    // A volta é animada (D-028): o callback vem quando o cartão termina de recolher, não no toque.
    // Antes era instantâneo e o item "piscava" de volta.
    expect(desfez).not.toHaveBeenCalled();
    await act(async () => { jest.advanceTimersByTime(400); });
    expect(desfez).toHaveBeenCalled();

    // E o principal: desfazer cancela a saída, por mais que o tempo continue correndo.
    await act(async () => { jest.advanceTimersByTime(MS_DESFAZER); });
    expect(saiu).not.toHaveBeenCalled();
  });

  it('com Reduce Motion a espera continua: sem ela não haveria como voltar atrás', async () => {
    mockReduzirMovimento = true;
    const saiu = jest.fn();
    await act(async () => { create(<Item aoSair={saiu} aoDesfazer={jest.fn()} />); });
    await act(async () => {});
    expect(saiu).not.toHaveBeenCalled();
    await act(async () => { jest.advanceTimersByTime(MS_DESFAZER + 100); });
    await act(async () => {});
    expect(saiu).toHaveBeenCalled();
  });
});
