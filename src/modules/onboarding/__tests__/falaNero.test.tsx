/** D-063: a fala do Nero, palavra por palavra. */
import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, create } from 'react-test-renderer';
import { FalaNero } from '../FalaNero';

let mockReduzir = false;
jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(() => Promise.resolve(mockReduzir));
beforeEach(() => { mockReduzir = false; jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); });

it('termina sozinha no ritmo e avisa uma vez', async () => {
  const fim = jest.fn();
  await act(async () => { create(<FalaNero fala="Eu te lembro do remédio" onTerminou={fim} completar={0} />); });
  expect(fim).not.toHaveBeenCalled();
  await act(async () => { jest.advanceTimersByTime(3000); });
  expect(fim).toHaveBeenCalledTimes(1);
});

it('incrementar `completar` (toque na tela) mostra a frase inteira na hora, sem avisar duas vezes', async () => {
  const fim = jest.fn();
  let a: any;
  await act(async () => { a = create(<FalaNero fala="Uma frase de cinco palavras" onTerminou={fim} completar={0} />); });
  await act(async () => { a.update(<FalaNero fala="Uma frase de cinco palavras" onTerminou={fim} completar={1} />); });
  expect(fim).toHaveBeenCalledTimes(1);
  await act(async () => { jest.advanceTimersByTime(3000); });
  expect(fim).toHaveBeenCalledTimes(1);
});

it('reduzir movimento: termina de imediato', async () => {
  mockReduzir = true;
  const fim = jest.fn();
  await act(async () => { create(<FalaNero fala="Oi" onTerminou={fim} completar={0} />); });
  expect(fim).toHaveBeenCalledTimes(1);
});

it('leitor de tela recebe a frase inteira', async () => {
  let a: any;
  await act(async () => { a = create(<FalaNero linhaPequena="Oi, eu sou o Nero!" fala="Vou te ajudar." onTerminou={() => {}} completar={0} />); });
  expect(a.root.findByProps({ accessibilityRole: 'text' }).props.accessibilityLabel).toBe('Oi, eu sou o Nero! Vou te ajudar.');
});

it('fala nova recomeça a animação e avisa de novo', async () => {
  const fim = jest.fn();
  let a: any;
  await act(async () => { a = create(<FalaNero fala="Primeira fala" onTerminou={fim} completar={0} />); });
  await act(async () => { jest.advanceTimersByTime(3000); });
  await act(async () => { a.update(<FalaNero fala="Segunda fala aqui" onTerminou={fim} completar={0} />); });
  await act(async () => { jest.advanceTimersByTime(3000); });
  expect(fim).toHaveBeenCalledTimes(2);
});

it('um toque dado antes de a fala existir não a completa ao montar (pergunta dos avisos)', async () => {
  const fim = jest.fn();
  await act(async () => { create(<FalaNero fala="Posso te avisar?" onTerminou={fim} completar={3} />); });
  expect(fim).not.toHaveBeenCalled();
});

it('se a tela zera o contador depois de a fala aparecer, o próximo toque ainda completa', async () => {
  const fim = jest.fn();
  let a: any;
  await act(async () => { a = create(<FalaNero fala="Anote sua pressão e sua glicemia" onTerminou={fim} completar={2} />); });
  await act(async () => { a.update(<FalaNero fala="Anote sua pressão e sua glicemia" onTerminou={fim} completar={0} />); });
  await act(async () => { a.update(<FalaNero fala="Anote sua pressão e sua glicemia" onTerminou={fim} completar={1} />); });
  expect(fim).toHaveBeenCalledTimes(1);
});
