/** useRelatorio: painel da página 1 para a prévia e para TODO PDF gerado no app (D-067); data de geração dos dados. */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { dadosNeroTeste } from './fixtures';
import { useRelatorio, type ParametrosRelatorio } from '../useRelatorio';

jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } } }) }));
jest.mock('@core/supabase/client', () => ({ supabase: { from: jest.fn() } }));
jest.mock('../carregar', () => ({
  ...jest.requireActual('../carregar'),
  carregarDadosNero: async () => require('./fixtures').dadosNeroTeste(),
}));

let rel: ReturnType<typeof useRelatorio>;
function Sonda(p: ParametrosRelatorio) { rel = useRelatorio(p); return null; }
let arvore: ReactTestRenderer;
afterEach(() => act(() => arvore.unmount()));
async function montar(p: ParametrosRelatorio) {
  await act(async () => { arvore = create(<Sonda {...p} />); });
  await act(async () => {});
}

test('devolve o painel do tipo e a data de geração dos dados', async () => {
  await montar({ tipo: 'geral', dias: 90 });
  expect(rel.geradoEm).toBe(dadosNeroTeste().geradoEm);
  expect(rel.painel?.atencao[0]).toContain('FIT positivo: colonoscopia indicada');
  expect(rel.painel?.cartoes.length).toBeGreaterThan(0);
});

test('o HTML do PDF leva o painel (página 1), com e sem QR, e a hora de geração dos dados', async () => {
  await montar({ tipo: 'geral', dias: 90 });
  for (const h of [rel.html(), rel.html('<svg id="qr"></svg>', '25/11/2026')]) {
    expect(h).toContain('class="painel"');
    expect(h).toContain('Para atenção nesta consulta');
    expect(h).toContain('Gerado em 18/09/2026 10:30');
    expect(h).not.toContain('class="tela"');
  }
  expect(rel.html('<svg id="qr"></svg>', '25/11/2026')).toContain('<svg id="qr"></svg>');
});

test('cardio com "apenas" filtra também o painel', async () => {
  await montar({ tipo: 'cardio', dias: 90, apenas: ['glicemia'] });
  expect(rel.painel?.cartoes.map((c) => c.tipo)).toEqual(['glicemia']);
});

test('antes dos dados, sem painel e sem HTML', async () => {
  act(() => { arvore = create(<Sonda tipo="geral" dias={90} />); });
  expect(rel.painel).toBeNull();
  expect(rel.geradoEm).toBe('');
  expect(rel.html()).toBe('');
  await act(async () => {});
});
