/** Círculo "Anotar" (spec §6.1): redondo, ≥ 60 pt, cor primária, logo acima da barra de abas; abre a folha com a origem. */
import React from 'react';
import { StyleSheet } from 'react-native';
import { act, create } from 'react-test-renderer';
import { Colors } from '@ui/theme';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));

const { BotaoAnotar } = require('../BotaoAnotar');

it('é um botão "Anotar" de pelo menos 60 pt que abre a folha com a origem', () => {
  let a: any;
  act(() => { a = create(<BotaoAnotar origem="/historico" />); });
  const b = a.root.find((n: any) => n.props.accessibilityLabel === 'Anotar' && typeof n.props.onPress === 'function');
  const s = StyleSheet.flatten(b.props.style);
  expect(s.width).toBeGreaterThanOrEqual(60);
  expect(s.height).toBe(s.width);
  expect(s.borderRadius).toBe((s.width as number) / 2);
  expect(s.backgroundColor).toBe(Colors.primary);
  expect(s.bottom).toBe(58 + 12 + 34);
  expect(s.position).toBe('absolute');
  expect(b.props.accessibilityRole).toBe('button');
  b.props.onPress();
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/(app)/anotar', params: { origem: '/historico' } });
});
