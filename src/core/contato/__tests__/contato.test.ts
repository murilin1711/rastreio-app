/** Canal de contato (D-057): o e-mail já sai com assunto e versão, e sem pedir dado de saúde. */
import { urlEmailContato } from '../contato';

test('mailto com endereço, assunto e a versão do app e do sistema', () => {
  const url = urlEmailContato({ versaoApp: '1.0.0', build: '3', sistema: 'iOS 26.5' });
  expect(url.startsWith('mailto:nerosaude@gmail.com?subject=')).toBe(true);
  const corpo = decodeURIComponent(url.split('body=')[1]);
  expect(corpo).toContain('NERO 1.0.0 (3)');
  expect(corpo).toContain('iOS 26.5');
  expect(corpo).toMatch(/evite/i); // lembra de não mandar resultado de exame por e-mail
});

test('sem número de build, não mostra parênteses vazios', () => {
  expect(decodeURIComponent(urlEmailContato({ versaoApp: '1.0.0', build: null, sistema: 'Android 15' }))).toContain('NERO 1.0.0 ·');
});
