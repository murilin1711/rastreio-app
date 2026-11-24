import React, { useState } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { UnidadeDose } from '@core/medicacoes/tipos';
import { SeletorQuantidade } from '../SeletorQuantidade';

/** Seletor controlado, como a tela usa. */
function Sonda({ inicial, unidade }: { inicial: number; unidade: UnidadeDose }) {
  const [valor, setValor] = useState(inicial);
  return <SeletorQuantidade valor={valor} unidade={unidade} onChange={setValor} />;
}

let arvore: ReactTestRenderer;
afterEach(() => act(() => arvore.unmount()));

const botao = (rotulo: string) => arvore.root.find((n) => n.props.accessibilityLabel === rotulo && typeof n.props.onPress === 'function');
const tocar = (rotulo: string) => act(() => { botao(rotulo).props.onPress(); });
/** O texto exato do nó do valor (não basta conter: '0,5' também contém '0' e '5'). */
const mostrado = () => arvore.root.findByProps({ testID: 'quantidade' }).props.children;

it('comprimido: desce de meio em meio e não chega a zero', () => {
  act(() => { arvore = create(<Sonda inicial={1} unidade="comprimido" />); });
  tocar('Diminuir');
  expect(mostrado()).toBe('0,5');
  tocar('Diminuir');
  expect(mostrado()).toBe('0,5');
});

it('gota: o mínimo é 1 e sobe de 1 em 1', () => {
  act(() => { arvore = create(<Sonda inicial={1} unidade="gota" />); });
  tocar('Diminuir');
  expect(mostrado()).toBe('1');
  tocar('Aumentar');
  expect(mostrado()).toBe('2');
});

it('botões com rótulo de acessibilidade e número no formato brasileiro', () => {
  act(() => { arvore = create(<Sonda inicial={1.5} unidade="ml" />); });
  expect(botao('Diminuir')).toBeTruthy();
  expect(botao('Aumentar')).toBeTruthy();
  expect(mostrado()).toBe('1,5');
});
