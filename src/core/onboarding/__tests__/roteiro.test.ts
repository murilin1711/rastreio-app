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

test('tela 5: frase que encolhe, exemplos que chamam os cartões e a frase da consulta', () => {
  const r = passo('relatorio');
  expect(r.falas[0]).toMatchObject({ texto: 'Eu junto todas as suas informações num relatório.', encolher: true });
  expect(r.falas[1].marcos?.map((m) => m.cartao)).toEqual(['historico', 'exames', 'medicacoes']);
  expect(r.falas[2]).toMatchObject({ texto: 'Na consulta, é só mostrar pro seu médico.', substituir: true });
});

test('tela 6: quatro notificações, cada uma na sua fala', () => {
  const l = passo('lembrete');
  expect(l.falas.flatMap((f) => (f.marcos ?? []).map((m) => m.cartao))).toEqual(['remedio', 'consulta', 'exame', 'agua']);
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
