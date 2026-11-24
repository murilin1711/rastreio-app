/** Botão padrão: rótulo com pelo menos 17 pt (spec de navegação, regra 6) e sem corte em letra grande. */
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import { Button } from '../Button';

it('o rótulo tem pelo menos 17 pt em todas as variantes e não é cortado', () => {
  for (const variant of ['primary', 'outline', 'ghost', 'danger'] as const) {
    let a: any;
    act(() => { a = create(<Button label="Salvar" variant={variant} onPress={() => {}} />); });
    const texto = a.root.findByType(Text);
    expect(texto.props.children).toBe('Salvar');
    expect(StyleSheet.flatten(texto.props.style).fontSize).toBeGreaterThanOrEqual(17);
    expect(texto.props.numberOfLines).toBeUndefined();
    act(() => a.unmount());
  }
});
