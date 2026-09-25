/** D-045: o bloco de horários do remédio — ritmo, primeira dose, ajuste à mão, tirar e adicionar. */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

jest.mock('@ui/index', () => {
  const R = require('react');
  const { Text } = require('react-native');
  return {
    Colors: { textPrimary: '#000', textMuted: '#999' }, Spacing: { sm: 8, md: 12 }, Typography: { subheading: {} },
    // A roda vira um botão de teste: o teste chama onChange direto, como se a pessoa tivesse girado.
    CampoHorario: (p: { valor: string | null; accessibilityLabel?: string; rotulo?: string; onChange: (h: string) => void }) =>
      R.createElement(Text, { testID: `hora:${p.rotulo ?? p.accessibilityLabel}`, onPress: p.onChange }, p.valor ?? '—'),
    Opcoes: (p: { onChange: (v: string) => void; valor: string | null }) => R.createElement(Text, { testID: 'ritmo', onPress: p.onChange }, p.valor ?? '—'),
  };
});

const { HorariosRemedio } = require('../HorariosRemedio');

function montar(inicial: string[]) {
  const estado = { horarios: inicial };
  let a!: ReactTestRenderer;
  const render = () => <HorariosRemedio horarios={estado.horarios} onChange={(h: string[]) => { estado.horarios = h; a.update(render()); }} />;
  act(() => { a = create(render()); });
  const campo = (id: string) => a.root.findByProps({ testID: id });
  const porRotulo = (r: string) => a.root.findAll((n) => n.props.accessibilityLabel === r && typeof n.props.onPress === 'function')[0];
  return { estado, campo, porRotulo, ritmo: () => campo('ritmo').props.children };
}

it('escolher "2 vezes" preenche 12 em 12 h a partir das 08:00', () => {
  const t = montar([]);
  act(() => { t.campo('ritmo').props.onPress('2'); });
  expect(t.estado.horarios).toEqual(['08:00', '20:00']);
});

it('mudar a primeira dose recalcula todos', () => {
  const t = montar([]);
  act(() => { t.campo('ritmo').props.onPress('3'); });
  act(() => { t.campo('hora:Primeira dose').props.onPress('06:00'); });
  expect(t.estado.horarios).toEqual(['06:00', '14:00', '22:00']);
});

it('mexer num horário só muda aquele, e o ritmo passa a "Outro"', () => {
  const t = montar(['08:00', '20:00']);
  expect(t.ritmo()).toBe('2');
  act(() => { t.campo('hora:Horário 2').props.onPress('19:00'); });
  expect(t.estado.horarios).toEqual(['08:00', '19:00']);
  expect(t.ritmo()).toBe('outro');
});

it('tirar e adicionar horários', () => {
  const t = montar(['08:00', '20:00']);
  act(() => { t.campo('hora:Adicionar horário').props.onPress('13:00'); });
  expect(t.estado.horarios).toEqual(['08:00', '13:00', '20:00']);
  expect(t.ritmo()).toBe('outro'); // 08, 13 e 20 h não são igualmente espaçados
  act(() => { t.porRotulo('Tirar o horário 13:00').props.onPress(); });
  expect(t.estado.horarios).toEqual(['08:00', '20:00']);
  expect(t.ritmo()).toBe('2'); // voltou a ser 12 em 12 h
});

it('abrir um remédio já cadastrado reconhece o ritmo', () => {
  expect(montar(['06:00', '14:00', '22:00']).ritmo()).toBe('3');
  expect(montar(['08:00', '12:00']).ritmo()).toBe('outro');
});
