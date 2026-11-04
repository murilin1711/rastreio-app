/** Bloco "Fontes" das telas clínicas (diretriz 1.4.1): cada fonte abre o original; o pé leva ao acervo. */
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import * as WebBrowser from 'expo-web-browser';
import { FontesDaTela } from '@modules/fontes/FontesDaTela';
import { REFERENCIAS } from '@core/referencias/catalogo';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(() => Promise.resolve()) }));

it('mostra as fontes do PREVENT com link e abre o documento ao tocar', async () => {
  let arvore!: ReturnType<typeof create>;
  await act(async () => { arvore = create(<FontesDaTela tema="risco" />); });
  const textos = arvore.root.findAllByType(Text).map((t) => t.props.children).flat().join(' ');
  expect(textos).toContain(REFERENCIAS.dislipidemias2025.titulo);
  expect(textos).toContain(REFERENCIAS.prevent2024.titulo);

  const botoes = arvore.root.findAllByType(TouchableOpacity);
  await act(async () => { botoes[0].props.onPress(); });
  expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(REFERENCIAS.dislipidemias2025.url);

  await act(async () => { botoes[botoes.length - 1].props.onPress(); });
  expect(mockPush).toHaveBeenCalledWith('/(app)/fontes');
});
