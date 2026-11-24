import React, { useState } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { UnidadeDose } from '@core/medicacoes/tipos';
import { textoDe } from '../../../testes/arvore';
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
const mostrado = () => textoDe(arvore.toJSON());

it('comprimido: desce de meio em meio e não chega a zero', () => {
  act(() => { arvore = create(<Sonda inicial={1} unidade="comprimido" />); });
  tocar('Diminuir');
  expect(mostrado()).toContain('0,5');
  tocar('Diminuir');
  expect(mostrado()).toContain('0,5');
  expect(mostrado()).not.toMatch(/(^|\s)0(\s|$)/);
});

it('gota: o mínimo é 1 e sobe de 1 em 1', () => {
  act(() => { arvore = create(<Sonda inicial={1} unidade="gota" />); });
  tocar('Diminuir');
  expect(mostrado()).toContain('1');
  tocar('Aumentar');
  expect(mostrado()).toContain('2');
});

it('botões com rótulo de acessibilidade e número no formato brasileiro', () => {
  act(() => { arvore = create(<Sonda inicial={1.5} unidade="ml" />); });
  expect(botao('Diminuir')).toBeTruthy();
  expect(botao('Aumentar')).toBeTruthy();
  expect(mostrado()).toContain('1,5');
});
