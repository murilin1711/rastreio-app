/** Painel (página 1 do relatório, D-067) na prévia do app: 1 coluna, sem selos de cor (Ruling S0). */
import React from 'react';
import { SvgXml } from 'react-native-svg';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { LEGENDA_DOSES } from '@core/relatorios/adesaoRelatorio';
import { montarPainel } from '@core/relatorios/painel';
import { PERIODO_TESTE, dadosNeroTeste } from '@core/relatorios/__tests__/fixtures';
import { StatusBadge } from '@ui/index';
import { textoDe } from '../../../../testes/arvore';
import { PainelRelatorioView } from '../PainelRelatorioView';

const painel = montarPainel(dadosNeroTeste(), { tipo: 'geral', periodo: PERIODO_TESTE });

let arvore: ReactTestRenderer;
afterEach(() => act(() => arvore.unmount()));
const montar = (p = painel) => { act(() => { arvore = create(<PainelRelatorioView painel={p} />); }); return textoDe(arvore.toJSON()); };

test('mostra atenção, cartões, adesão com contagem e prevenção com a situação do app', () => {
  const t = montar();
  for (const s of ['Para atenção nesta consulta', 'FIT positivo: colonoscopia indicada', 'Pressão arterial (MRPA)', 'mmHg',
    'Remédios: últimas 2 semanas', '10 de 14', 'usou 2 vezes', LEGENDA_DOSES, 'Prevenção', 'Em dia']) expect(t).toContain(s);
});

test('sem selo de cor em lugar nenhum (Ruling S0)', () => {
  montar();
  expect(arvore.root.findAllByType(StatusBadge)).toHaveLength(0);
});

test('doses por símbolo, com rótulo acessível (a cor nunca sozinha)', () => {
  montar();
  const doses = arvore.root.findAll((n) => typeof n.type === 'string' && typeof n.props.accessibilityLabel === 'string' && /\d+ (tomou|não tomou|errada|sem registro)/.test(n.props.accessibilityLabel));
  expect(doses.length).toBeGreaterThan(0);
  expect(textoDe(arvore.toJSON())).toMatch(/[●○◆–]/);
});

test('sem itens de atenção, sem a caixa', () => {
  expect(montar({ ...painel, atencao: [] })).not.toContain('Para atenção');
});

test('blocos vazios não aparecem', () => {
  const t = montar({ ...painel, atencao: [], cartoes: [], seriePressao: null, adesao: null, prevencao: null });
  for (const s of ['Para atenção', 'Remédios', 'Prevenção', 'Pressão sistólica']) expect(t).not.toContain(s);
});

test('gráfico da sistólica na largura medida, com a referência', () => {
  expect(painel.seriePressao).not.toBeNull();
  montar();
  expect(arvore.root.findAllByType(SvgXml)).toHaveLength(0);
  const caixa = arvore.root.find((n) => typeof n.props.onLayout === 'function');
  act(() => { caixa.props.onLayout({ nativeEvent: { layout: { width: 300, height: 0, x: 0, y: 0 } } }); });
  const svg = arvore.root.findByType(SvgXml);
  expect(svg.props.xml).toContain('viewBox="0 0 300 140"');
  expect(svg.props.xml).toContain(`data-ref="${painel.referenciaSistolica}"`);
  expect(textoDe(arvore.toJSON())).toContain(`referência domiciliar de ${painel.referenciaSistolica} mmHg`);
});

test('remédio interrompido na janela aparece com "(interrompido em dd/mm)" (I3)', () => {
  const d = dadosNeroTeste();
  d.medicacoes = d.medicacoes.map((m) => (m.id === 'm3' ? { ...m, ate: '2026-09-10', horariosDesde: '2026-01-01' } : m));
  expect(montar(montarPainel(d, { tipo: 'geral', periodo: PERIODO_TESTE }))).toContain('Sinvastatina 20 mg (interrompido em 10/09)');
});
