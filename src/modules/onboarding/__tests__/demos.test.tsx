/** D-063: as três demonstrações do onboarding. */
import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, create } from 'react-test-renderer';
import { DemoLembrete } from '../demos/DemoLembrete';
import { DemoPressao } from '../demos/DemoPressao';
import { DemoRelatorio } from '../demos/DemoRelatorio';

jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(() => Promise.resolve(true));

const textos = (a: any): string[] => a.root.findAll((n: any) => typeof n.props?.children === 'string').map((n: any) => n.props.children);

it.each([['pressão', DemoPressao], ['relatório', DemoRelatorio], ['lembrete', DemoLembrete]])('%s: com Reduzir movimento vai ao quadro final e avisa na hora', async (_n, Demo: any) => {
  const fim = jest.fn();
  await act(async () => { create(<Demo onTerminou={fim} />); });
  expect(fim).toHaveBeenCalledTimes(1);
});

it('lembrete usa o texto real da notificação (D-044)', async () => {
  let a: any;
  await act(async () => { a = create(<DemoLembrete />); });
  expect(textos(a)).toEqual(expect.arrayContaining(['Hora de tomar seu remédio 💊', 'Losartana 50 mg', '08:00']));
});

it('pressão mostra só valores de exemplo dentro do normal', async () => {
  let a: any;
  await act(async () => { a = create(<DemoPressao />); });
  expect(textos(a)).toEqual(expect.arrayContaining(['Pressão de hoje', '128 por 78', 'no alvo', 'Média da semana: 126 por 80']));
});

it('relatório mostra o título e o QR para o médico', async () => {
  let a: any;
  await act(async () => { a = create(<DemoRelatorio />); });
  expect(textos(a)).toEqual(expect.arrayContaining(['Relatório para o médico', 'Mostre ao médico']));
});
