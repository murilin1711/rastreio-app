/** Quanto tomar em cada horário, no cadastro do remédio: uma linha por horário com o seletor. */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { HorarioDose } from '@core/medicacoes/tipos';
import { textoDe } from '../../../testes/arvore';
import { DosesPorHorario } from '../DosesPorHorario';

const horarios: HorarioDose[] = [{ hora: '08:00', quantidade: 1 }, { hora: '20:00', quantidade: 1 }];

let arvore: ReactTestRenderer;
afterEach(() => act(() => arvore.unmount()));

/** O botão pelo rótulo acessível completo ("Aumentar a dose das 20h"). */
const botao = (rotulo: string) =>
  arvore.root.find((n) => n.props.accessibilityLabel === rotulo && typeof n.props.onPress === 'function');

it('uma linha por horário, com a hora curta e um seletor', () => {
  act(() => { arvore = create(<DosesPorHorario horarios={horarios} unidade="comprimido" onChange={jest.fn()} />); });
  const texto = textoDe(arvore.toJSON());
  expect(texto).toContain('8h');
  expect(texto).toContain('20h');
  const valores = arvore.root.findAll((n) => typeof n.type === 'string' && n.props.testID === 'quantidade');
  expect(valores.map((n) => n.props.children)).toEqual(['1', '1']);
});

it('aumentar a das 20h muda só ela', () => {
  const onChange = jest.fn();
  act(() => { arvore = create(<DosesPorHorario horarios={horarios} unidade="gota" onChange={onChange} />); });
  act(() => { botao('Aumentar a dose das 20h').props.onPress(); });
  expect(onChange).toHaveBeenCalledWith([{ hora: '08:00', quantidade: 1 }, { hora: '20:00', quantidade: 2 }]);
});

it('comprimido: diminuir a das 8h vai para meio', () => {
  const onChange = jest.fn();
  act(() => { arvore = create(<DosesPorHorario horarios={horarios} unidade="comprimido" onChange={onChange} />); });
  act(() => { botao('Diminuir a dose das 8h').props.onPress(); });
  expect(onChange).toHaveBeenCalledWith([{ hora: '08:00', quantidade: 0.5 }, { hora: '20:00', quantidade: 1 }]);
});

it('sem horário, não mostra nada', () => {
  act(() => { arvore = create(<DosesPorHorario horarios={[]} unidade="comprimido" onChange={jest.fn()} />); });
  expect(arvore.toJSON()).toBeNull();
});
