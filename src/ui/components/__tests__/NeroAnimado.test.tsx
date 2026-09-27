import React from 'react';
import { act, create } from 'react-test-renderer';
import { CLIPES, NeroAnimado, useClipeAtual, type NeroClipe, larguraDaCaixa } from '../NeroAnimado';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: (props: object) => <View {...props} /> };
});

function Sonda({ clipe, entrada, saida }: { clipe: NeroClipe; entrada?: NeroClipe; saida: NeroClipe[] }) {
  saida.push(useClipeAtual(clipe, entrada));
  return null;
}

describe('NeroAnimado (D-015)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('sem entrada, mostra o clipe em loop desde o início', () => {
    const saida: NeroClipe[] = [];
    act(() => { create(<Sonda clipe="repouso" saida={saida} />); });
    expect(saida.at(-1)).toBe('repouso');
  });

  it('com entrada, toca o clipe de entrada e depois volta ao loop quando a duração termina', () => {
    const saida: NeroClipe[] = [];
    act(() => { create(<Sonda clipe="repouso" entrada="acenar" saida={saida} />); });
    expect(saida.at(-1)).toBe('acenar');
    act(() => { jest.advanceTimersByTime(CLIPES.acenar.duracaoMs - 1); });
    expect(saida.at(-1)).toBe('acenar');
    act(() => { jest.advanceTimersByTime(1); });
    expect(saida.at(-1)).toBe('repouso');
  });

  it('mantém a mesma largura ao trocar de clipe (não mexe no layout)', () => {
    let arvore!: ReturnType<typeof create>;
    act(() => { arvore = create(<NeroAnimado entrada="acenar" size={100} />); });
    const largura = () => (arvore.root.findByProps({ accessibilityLabel: 'Nero, mascote do aplicativo' }).props.style as Array<{ width: number }>)[0].width;
    const antes = largura();
    act(() => { jest.advanceTimersByTime(CLIPES.acenar.duracaoMs); });
    expect(largura()).toBe(antes);
    // A caixa é a do aceno (252/360): o comemorar v2, mais largo, só alarga onde aparece (27/09).
    expect(antes).toBeCloseTo(100 * 252 / 360);
  });

  it('só onde o comemorar v2 aparece a caixa alarga; Home e Minha Saúde ficam como o Murilo calibrou', () => {
    expect(larguraDaCaixa(360, 'repouso')).toBeCloseTo(252);
    expect(larguraDaCaixa(360, 'repouso', 'acenar')).toBeCloseTo(252);
    expect(larguraDaCaixa(360, 'pensando')).toBeCloseTo(252);
    expect(larguraDaCaixa(360, 'comemorar')).toBeCloseTo(360 * 490 / 640);
    expect(larguraDaCaixa(360, 'repouso', 'comemorar')).toBeCloseTo(360 * 490 / 640);
  });

  it('todo clipe tem duração e proporção coerentes com o arquivo', () => {
    for (const c of Object.values(CLIPES)) {
      expect(c.duracaoMs).toBeGreaterThan(1000);
      expect(c.largura / c.altura).toBeGreaterThan(0.4);
      expect(c.largura / c.altura).toBeLessThan(1);
    }
  });
});
