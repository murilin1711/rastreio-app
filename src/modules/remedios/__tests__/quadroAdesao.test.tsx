/**
 * "Seus remédios nesta semana" no check-in (spec §6.6): quadro só de leitura, só fatos — bolinhas por dose,
 * "12 de 14 · …", "usou 3 vezes". Falha na carga mostra o erro e "Tentar de novo", nunca um quadro vazio.
 */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { DoseClassificada, EstadoDose, ResumoAdesao } from '@core/medicacoes/adesao';
import { apertar, textoDe } from '../../../testes/arvore';
import { QuadroAdesao } from '../QuadroAdesao';

const dose = (estado: EstadoDose, hora = '08:00'): DoseClassificada => ({
  medicacaoId: 'm1', data: '2026-11-16', hora, quantidadePrevista: 1, estado, comAtraso: false, tomadas: [],
});
const losartana: ResumoAdesao = {
  medicacaoId: 'm1', nome: 'Losartana', dose: '50 mg', unidade: 'comprimido', sePrecisar: false, previstas: 14, tomou: 12,
  naoTomou: 1, errado: 0, semRegistro: 1, comAtraso: 0, percentual: 86, usosSePrecisar: 0,
  doses: [...Array.from({ length: 12 }, () => dose('tomou')), dose('nao_tomou'), dose('sem_registro'), dose('pendente', '20:00')],
};
const dipirona: ResumoAdesao = {
  medicacaoId: 'm2', nome: 'Dipirona', dose: '500 mg', unidade: 'comprimido', sePrecisar: true, previstas: 0, tomou: 0,
  naoTomou: 0, errado: 0, semRegistro: 0, comAtraso: 0, percentual: null, usosSePrecisar: 3, doses: [],
};

let arvore: ReactTestRenderer;
const tela = () => textoDe(arvore.toJSON());
afterEach(() => act(() => arvore?.unmount()));

it('título, nome com dose, bolinhas das doses fechadas e o resumo; "se precisar" com os usos', async () => {
  await act(async () => { arvore = create(<QuadroAdesao resumos={[losartana, dipirona]} />); });
  expect(tela()).toContain('Seus remédios nesta semana');
  expect(tela()).toContain('Losartana 50 mg');
  expect(tela()).toContain('●●●●●●●●●●●●○–'); // a pendente não entra
  expect(tela()).toContain('12 de 14 · 1 não tomada · 1 sem registro');
  expect(tela()).toContain('Dipirona (se precisar)');
  expect(tela()).toContain('usou 3 vezes');
});

it('rótulo de acessibilidade da linha é o nome e o resumo (os símbolos não são lidos)', async () => {
  await act(async () => { arvore = create(<QuadroAdesao resumos={[losartana, dipirona]} />); });
  const rotulos = arvore.root.findAll((n) => n.props.accessible === true && typeof n.props.accessibilityLabel === 'string' && typeof n.type === 'string')
    .map((n) => n.props.accessibilityLabel);
  expect(rotulos).toEqual(['Losartana 50 mg: 12 de 14 · 1 não tomada · 1 sem registro', 'Dipirona (se precisar): usou 3 vezes']);
});

it('remédio sem dose cadastrada mostra só o nome', async () => {
  await act(async () => { arvore = create(<QuadroAdesao resumos={[{ ...losartana, dose: null }]} />); });
  expect(tela()).toContain('Losartana');
  expect(tela()).not.toContain('Losartana 50 mg');
  expect(tela()).not.toContain('null');
});

it('remédio com horário sem dose fechada na semana fica de fora (só pendentes)', async () => {
  const novo: ResumoAdesao = { ...losartana, medicacaoId: 'm3', nome: 'Metformina', previstas: 0, tomou: 0, naoTomou: 0, semRegistro: 0, doses: [dose('pendente')] };
  await act(async () => { arvore = create(<QuadroAdesao resumos={[novo, dipirona]} />); });
  expect(tela()).not.toContain('Metformina');
  expect(tela()).toContain('Dipirona (se precisar)');
  await act(async () => { arvore.update(<QuadroAdesao resumos={[novo]} />); });
  expect(arvore.toJSON()).toBeNull();
});

it('lista vazia não mostra nada', async () => {
  await act(async () => { arvore = create(<QuadroAdesao resumos={[]} />); });
  expect(arvore.toJSON()).toBeNull();
});

it('falha na carga: mostra o erro e "Tentar de novo"', async () => {
  const aoTentar = jest.fn();
  await act(async () => { arvore = create(<QuadroAdesao resumos={[]} erro="Sem conexão com a internet." aoTentarDeNovo={aoTentar} />); });
  expect(tela()).toContain('Seus remédios nesta semana');
  expect(tela()).toContain('Sem conexão com a internet.');
  await act(async () => { apertar(arvore, 'Tentar de novo'); });
  expect(aoTentar).toHaveBeenCalledTimes(1);
});

it('carregando: título e indicador reservam o lugar, sem linhas', async () => {
  await act(async () => { arvore = create(<QuadroAdesao resumos={[]} carregando />); });
  expect(tela()).toContain('Seus remédios nesta semana');
  expect(arvore.root.findAll((n) => n.props.accessibilityLabel === 'Carregando seus remédios')).not.toHaveLength(0);
  expect(arvore.toJSON()).not.toBeNull();
});

it('título é cabeçalho também no erro e no carregando', async () => {
  const titulos = () => arvore.root.findAll((n) => n.props.accessibilityRole === 'header' && typeof n.type === 'string').map((n) => textoDe(n));
  await act(async () => { arvore = create(<QuadroAdesao resumos={[]} erro="Sem conexão com a internet." aoTentarDeNovo={() => {}} />); });
  expect(titulos()).toEqual(['Seus remédios nesta semana']);
  await act(async () => { arvore.update(<QuadroAdesao resumos={[]} carregando />); });
  expect(titulos()).toEqual(['Seus remédios nesta semana']);
});
