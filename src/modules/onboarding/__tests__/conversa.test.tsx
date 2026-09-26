/** D-063: as falas de uma tela em sequência (encolher, substituir, marcos). */
import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, create } from 'react-test-renderer';
import { Conversa } from '../Conversa';
import { FalaNero } from '../FalaNero';

jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(() => Promise.resolve(true));

const falas = [
  { texto: 'Eu junto todas as suas informações num relatório.', encolher: true },
  { texto: 'Seu histórico, seus exames e suas medicações.', marcos: [{ palavra: 'histórico', cartao: 'historico' }, { palavra: 'medicações', cartao: 'medicacoes' }] },
  { texto: 'Na consulta, é só mostrar pro seu médico.', substituir: true },
];

const montar = async () => {
  const marcos: string[] = []; const fim = jest.fn(); let a: any;
  await act(async () => { a = create(<Conversa falas={falas} nome={null} completar={0} onMarco={(c) => marcos.push(c)} onTerminou={fim} />); });
  for (let i = 0; i < 6; i++) await act(async () => {});
  return { a, marcos, fim };
};

it('toca todas as falas em sequência, dispara os marcos e avisa no fim', async () => {
  const { marcos, fim } = await montar();
  expect(marcos).toEqual(['historico', 'medicacoes']);
  expect(fim).toHaveBeenCalledTimes(1);
});

it('a primeira encolhe; a terceira substitui a segunda', async () => {
  const { a } = await montar();
  const visiveis = a.root.findAllByType(FalaNero).filter((f: any) => !f.props.oculta);
  expect(visiveis.map((f: any) => f.props.fala)).toEqual(['Eu junto todas as suas informações num relatório.', 'Na consulta, é só mostrar pro seu médico.']);
  expect(visiveis[0].props.encolhida).toBe(true);
});
