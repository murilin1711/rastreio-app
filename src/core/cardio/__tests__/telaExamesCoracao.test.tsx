/** A tela antiga de exames do Coração virou redirecionamento para a lista única de Minha Saúde (D-065); a rota fica por causa de links antigos. */
import React from 'react';
import { act, create } from 'react-test-renderer';

let mockHref: unknown = null;
jest.mock('expo-router', () => ({ Redirect: (p: any) => { mockHref = p.href; return null; } }));

const ExamesCoracao = require('../../../../app/(app)/coracao/exames/index').default;

it('a tela antiga de exames do coração leva à lista única de Minha Saúde, com volta ao módulo', () => {
  act(() => { create(<ExamesCoracao />); });
  expect(mockHref).toEqual({ pathname: '/(app)/(tabs)/minha-saude/exames', params: { voltarPara: '/coracao' } });
});
