import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import { apertar } from '../../../testes/arvore';
import type { AcaoModulo } from '../ListaAcoes';

jest.mock('@expo/vector-icons', () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
const { ListaAcoes } = require('../ListaAcoes');

function renderiza(el: React.ReactElement) {
  let a: any;
  act(() => { a = create(el); });
  return a;
}

const ACOES: AcaoModulo[] = [
  { chave: 'pressao', icone: 'pulse-outline', titulo: 'Minha pressão', subtitulo: 'anotar e ver como está', rota: '/(app)/coracao/pressao' },
  { chave: 'sinais', icone: 'alert-circle-outline', titulo: 'Quando procurar o pronto-socorro', rota: '/(app)/coracao/sinais' },
];

const textos = (a: any) => a.root.findAllByType(Text).map((t: any) => t.props.children);

it('abre com "O que você quer fazer?" e lista as ações na ordem', () => {
  const a = renderiza(<ListaAcoes acoes={ACOES} onAbrir={() => {}} />);
  const t = textos(a);
  expect(t[0]).toBe('O que você quer fazer?');
  expect(t.indexOf('Minha pressão')).toBeGreaterThan(0);
  expect(t.indexOf('Quando procurar o pronto-socorro')).toBeGreaterThan(t.indexOf('Minha pressão'));
});

it('tocar numa ação chama onAbrir com a rota dela', () => {
  const onAbrir = jest.fn();
  const a = renderiza(<ListaAcoes acoes={ACOES} onAbrir={onAbrir} />);
  apertar(a, 'Minha pressão');
  expect(onAbrir).toHaveBeenCalledWith('/(app)/coracao/pressao');
  expect(onAbrir).toHaveBeenCalledTimes(1);
});

it('o título do item tem 17 pt e accessibilityLabel igual ao título', () => {
  const a = renderiza(<ListaAcoes acoes={ACOES} onAbrir={() => {}} />);
  const titulo = a.root.findAllByType(Text).find((t: any) => t.props.children === 'Minha pressão');
  expect(StyleSheet.flatten(titulo!.props.style).fontSize).toBe(17);
  const item = a.root.find((n: any) => n.props.accessibilityLabel === 'Minha pressão');
  expect(item.props.accessibilityRole).toBe('button');
});
