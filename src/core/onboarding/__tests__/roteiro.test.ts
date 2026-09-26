/** D-063: roteiro aprovado pelo Murilo em 26/09 (ajustado no mesmo dia, depois de ver no simulador). */
import { falaComNome, indiceDoMarco, ROTEIRO } from '../roteiro';

const passo = (id: string) => ROTEIRO.find((p) => p.id === id)!;

test('sete telas na ordem aprovada', () => {
  expect(ROTEIRO.map((p) => p.id)).toEqual(['oi', 'nome', 'prazer', 'pressao', 'relatorio', 'lembrete', 'final']);
});

test('padrão 1 nas conversas, padrão 2 nas demonstrações', () => {
  expect(ROTEIRO.map((p) => p.padrao)).toEqual([1, 1, 1, 2, 2, 2, 1]);
});

test('tela 1: só o Nero primeiro; "Oi, eu sou o Nero!" encolhe antes da segunda fala', () => {
  const oi = passo('oi');
  expect(oi.atrasoInicialMs).toBeGreaterThan(0);
  expect(oi.falas.map((f) => f.texto)).toEqual(['Oi, eu sou o Nero!', 'Vou te ajudar a organizar a sua saúde.']);
  expect(oi.falas[0].encolher).toBe(true);
});

test('tela 2: o pensando pausa 3 s entre os ciclos', () => {
  expect(passo('nome').pausaClipeMs).toBe(3000);
});

test('tela 5: frase que encolhe, uma informação por fala (devagar) e a frase da consulta', () => {
  const r = passo('relatorio');
  expect(r.lento).toBe(true);
  expect(r.falas.map((f) => f.texto)).toEqual(['Eu junto todas as suas informações.', 'Seu histórico.', 'Seus exames.', 'Suas medicações.', 'Na consulta, é só mostrar pro seu médico.']);
  expect(r.falas[0].encolher).toBe(true);
  expect(r.falas.slice(2).every((f) => f.substituir)).toBe(true);
  expect(r.falas.flatMap((f) => (f.marcos ?? []).map((m) => m.cartao))).toEqual(['historico', 'exames', 'medicacoes']);
});

test('tela 6: quatro notificações, cada uma na sua fala, devagar', () => {
  const l = passo('lembrete');
  expect(l.lento).toBe(true);
  expect(l.falas.flatMap((f) => (f.marcos ?? []).map((m) => m.cartao))).toEqual(['remedio', 'consulta', 'exame', 'agua']);
});

test('final: "E te ajudo com muito mais!" antes do convite para a conta', () => {
  expect(passo('final').falas.map((f) => f.texto)).toEqual(['E te ajudo com muito mais!', 'Pronto{, nome}! Agora é só criar sua conta.']);
  expect(passo('final').falas[0].encolher).toBe(true);
});

test('fala com e sem nome', () => {
  expect(falaComNome('Prazer{, nome}! Vou te mostrar o que eu faço por você.', 'Maria')).toBe('Prazer, Maria! Vou te mostrar o que eu faço por você.');
  expect(falaComNome('Prazer{, nome}! Vou te mostrar o que eu faço por você.', null)).toBe('Prazer! Vou te mostrar o que eu faço por você.');
  expect(falaComNome('Pronto{, nome}! Agora é só criar sua conta.', '   ')).toBe('Pronto! Agora é só criar sua conta.');
});

test('marco acha a palavra ignorando pontuação e maiúsculas', () => {
  expect(indiceDoMarco('Seu histórico, seus exames e suas medicações.', 'histórico')).toBe(1);
  expect(indiceDoMarco('Seu histórico, seus exames e suas medicações.', 'medicações')).toBe(6);
  expect(indiceDoMarco('Eu lembro de marcar seu exame e de tomar água.', 'água')).toBe(9);
});
