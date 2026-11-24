/** ListItem: o leitor de tela anuncia o título e o subtítulo (I1 da onda final). */
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import { ListItem } from '../ListItem';

function rotulo(el: React.ReactElement): string {
  let a: any;
  act(() => { a = create(el); });
  const r = a.root.findByType(TouchableOpacity).props.accessibilityLabel;
  act(() => a.unmount());
  return r;
}

it('com subtítulo, o rótulo junta título e subtítulo', () => {
  expect(rotulo(<ListItem icon="document-text-outline" title="Relatório" subtitle="Últimos 30 dias" onPress={() => {}} />))
    .toBe('Relatório, Últimos 30 dias');
});

it('sem subtítulo, o rótulo é só o título', () => {
  expect(rotulo(<ListItem icon="document-text-outline" title="Relatório" onPress={() => {}} />)).toBe('Relatório');
});
