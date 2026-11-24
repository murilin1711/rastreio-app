import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { act, create } from 'react-test-renderer';

jest.mock('@expo/vector-icons', () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
const { BotaoAcao } = require('../BotaoAcao');

function renderiza(el: React.ReactElement) {
  let a: any;
  act(() => { a = create(el); });
  return a;
}

const achaBotao = (a: any) => a.root.find((n: any) => n.props.accessibilityRole === 'button');

it('mostra o rótulo, anuncia o mesmo texto e chama onPress', () => {
  const onPress = jest.fn();
  const a = renderiza(<BotaoAcao icone="pulse-outline" rotulo="Anotar minha pressão" onPress={onPress} />);
  const botao = achaBotao(a);
  expect(botao.props.accessibilityLabel).toBe('Anotar minha pressão');
  expect(a.root.findByType(Text).props.children).toBe('Anotar minha pressão');
  botao.props.onPress();
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('o rótulo tem pelo menos 17 pt e não é cortado em letra grande', () => {
  const a = renderiza(<BotaoAcao icone="pulse-outline" rotulo="Anotar minha glicemia" onPress={() => {}} />);
  const texto = a.root.findByType(Text);
  expect(StyleSheet.flatten(texto.props.style).fontSize).toBeGreaterThanOrEqual(17);
  expect(texto.props.numberOfLines).toBeUndefined();
});

it('largo ocupa a linha inteira (width 100%, sem flex); normal divide a linha (flex 1)', () => {
  const largo = StyleSheet.flatten(achaBotao(renderiza(<BotaoAcao icone="pulse-outline" rotulo="Anotar" onPress={() => {}} largo />)).props.style);
  const normal = StyleSheet.flatten(achaBotao(renderiza(<BotaoAcao icone="pulse-outline" rotulo="Anotar" onPress={() => {}} />)).props.style);
  expect(largo.width).toBe('100%');
  expect(largo.flex).toBeUndefined();
  expect(normal.flex).toBe(1);
});
