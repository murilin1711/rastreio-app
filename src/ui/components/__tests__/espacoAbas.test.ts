import React from 'react';
import { act, create } from 'react-test-renderer';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 34, top: 0, left: 0, right: 0 }),
}));
import { TAMANHO_BOTAO_ANOTAR, useEspacoAbas } from '../espacoAbas';

function renderiza(el: React.ReactElement) {
  let a: any;
  act(() => { a = create(el); });
  return a;
}

function lerEspaco(): number {
  let valor = -1;
  function Sonda() { valor = useEspacoAbas(); return null; }
  renderiza(React.createElement(Sonda));
  return valor;
}

it('o fim da rolagem deixa lugar para a barra e para o círculo', () => {
  expect(lerEspaco()).toBe(58 + 12 + 64 + 24 + 34); // 192
});

it('o círculo tem pelo menos 60 pt', () => {
  expect(TAMANHO_BOTAO_ANOTAR).toBeGreaterThanOrEqual(60);
});
