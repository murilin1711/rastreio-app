/** D-063: roteiro aprovado pelo Murilo em 26/09. */
import { falaComNome, ROTEIRO } from '../roteiro';

test('sete telas na ordem aprovada', () => {
  expect(ROTEIRO.map((p) => p.id)).toEqual(['oi', 'nome', 'prazer', 'pressao', 'relatorio', 'lembrete', 'final']);
});

test('fala com e sem nome', () => {
  expect(falaComNome('Prazer{, nome}! Vou te mostrar o que eu faço por você.', 'Maria')).toBe('Prazer, Maria! Vou te mostrar o que eu faço por você.');
  expect(falaComNome('Prazer{, nome}! Vou te mostrar o que eu faço por você.', null)).toBe('Prazer! Vou te mostrar o que eu faço por você.');
  expect(falaComNome('Pronto{, nome}! Agora é só criar sua conta.', '   ')).toBe('Pronto! Agora é só criar sua conta.');
  expect(falaComNome('Pronto{, nome}! Agora é só criar sua conta.', '  Ana ')).toBe('Pronto, Ana! Agora é só criar sua conta.');
});

test('fala do relatório é a aprovada pelo Murilo', () => {
  expect(ROTEIRO.find((p) => p.id === 'relatorio')!.fala).toBe('Eu junto todas as suas informações num relatório. Na consulta, é só mostrar pro seu médico.');
});
