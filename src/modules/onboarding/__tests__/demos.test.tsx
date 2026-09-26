/** D-063: as três demonstrações do onboarding (versão ajustada pelo Murilo em 26/09). */
import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, create } from 'react-test-renderer';
import { DemoLembrete } from '../demos/DemoLembrete';
import { DemoPressao } from '../demos/DemoPressao';
import { DemoRelatorio } from '../demos/DemoRelatorio';

jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(() => Promise.resolve(true));
const textos = (a: any): string[] => a.root.findAll((n: any) => typeof n.props?.children === 'string').map((n: any) => n.props.children);

it('pressão: cartões de pressão e glicemia, sem o verde "no alvo"', async () => {
  const fim = jest.fn(); let a: any;
  await act(async () => { a = create(<DemoPressao onTerminou={fim} />); });
  expect(textos(a)).toEqual(expect.arrayContaining(['Pressão de hoje', '128 por 78', 'Glicemia em jejum', '95 mg/dL', 'Média da semana: 126 por 80']));
  expect(textos(a)).not.toContain('no alvo');
  expect(fim).toHaveBeenCalledTimes(1);
});

it('relatório: cada cartão só aparece quando a sua palavra foi dita', async () => {
  let a: any;
  await act(async () => { a = create(<DemoRelatorio visiveis={['historico']} juntar={false} />); });
  expect(textos(a)).toContain('Histórico');
  expect(textos(a)).not.toContain('Exames');
  await act(async () => { a.update(<DemoRelatorio visiveis={['historico', 'exames', 'medicacoes']} juntar={false} />); });
  expect(textos(a)).toEqual(expect.arrayContaining(['Histórico', 'Exames', 'Medicações']));
});

it('relatório: juntar mostra o relatório e o QR e avisa no fim', async () => {
  const fim = jest.fn(); let a: any;
  await act(async () => { a = create(<DemoRelatorio visiveis={['historico', 'exames', 'medicacoes']} juntar onTerminou={fim} />); });
  expect(textos(a)).toEqual(expect.arrayContaining(['Relatório para o médico', 'Mostre ao médico']));
  expect(fim).toHaveBeenCalledTimes(1);
});

it('lembrete: as quatro notificações com os textos reais (notificacoes.md)', async () => {
  let a: any;
  await act(async () => { a = create(<DemoLembrete visiveis={['remedio', 'consulta', 'exame', 'agua']} />); });
  expect(textos(a)).toEqual(expect.arrayContaining([
    'Hora de tomar seu remédio 💊', 'Losartana 50 mg',
    'Sua consulta é amanhã 📅', 'Cardiologia às 14:30. Toque para preparar o relatório.',
    'Seu exame está chegando 🔎', 'Mamografia · daqui a 30 dias',
    'Hora de beber água 💧', 'Sua meta de hoje: 2 L.',
  ]));
});

it('lembrete: só mostra as notificações já ditas', async () => {
  let a: any;
  await act(async () => { a = create(<DemoLembrete visiveis={['remedio']} />); });
  expect(textos(a)).toContain('Hora de tomar seu remédio 💊');
  expect(textos(a)).not.toContain('Sua consulta é amanhã 📅');
});
