import { ESPERA_REENVIO_S, TAMANHO_CODIGO, codigoCompleto, ehEmailNaoConfirmado, normalizarCodigo, segundosParaReenviar } from '../codigo';

describe('normalizarCodigo', () => {
  test('mantém só dígitos: o idoso pode colar o código com espaços ou texto junto', () => {
    expect(normalizarCodigo('123 456')).toBe('123456');
    expect(normalizarCodigo('Código: 123456')).toBe('123456');
    expect(normalizarCodigo('12-34-56')).toBe('123456');
  });
  test('corta o excesso no tamanho do código', () => {
    expect(normalizarCodigo('1234567890')).toBe('123456');
    expect(normalizarCodigo('123456').length).toBe(TAMANHO_CODIGO);
  });
  test('texto sem dígito nenhum vira vazio', () => {
    expect(normalizarCodigo('abc')).toBe('');
    expect(normalizarCodigo('')).toBe('');
  });
});

describe('codigoCompleto', () => {
  test('só é completo com os seis dígitos', () => {
    expect(codigoCompleto('123456')).toBe(true);
    expect(codigoCompleto('12345')).toBe(false);
    expect(codigoCompleto('')).toBe(false);
  });
});

describe('segundosParaReenviar', () => {
  const AGORA = 1_000_000;
  test('sem envio anterior, pode reenviar na hora', () => {
    expect(segundosParaReenviar(null, AGORA)).toBe(0);
  });
  test('logo após enviar, falta a espera inteira', () => {
    expect(segundosParaReenviar(AGORA, AGORA)).toBe(ESPERA_REENVIO_S);
  });
  test('conta para baixo enquanto a espera corre', () => {
    expect(segundosParaReenviar(AGORA - 20_000, AGORA)).toBe(ESPERA_REENVIO_S - 20);
  });
  test('passada a espera, volta a zero e não fica negativo', () => {
    expect(segundosParaReenviar(AGORA - 60_000, AGORA)).toBe(0);
    expect(segundosParaReenviar(AGORA - 999_000, AGORA)).toBe(0);
  });
  test('arredonda para cima: 0,4 s restante ainda é 1 s na tela, nunca 0 com botão travado', () => {
    expect(segundosParaReenviar(AGORA - 59_600, AGORA)).toBe(1);
  });
});

describe('ehEmailNaoConfirmado', () => {
  test('reconhece o erro de e-mail não confirmado pelo código da API', () => {
    expect(ehEmailNaoConfirmado({ code: 'email_not_confirmed' })).toBe(true);
  });
  test('reconhece também pela mensagem, caso a API não mande o código', () => {
    expect(ehEmailNaoConfirmado({ message: 'Email not confirmed' })).toBe(true);
  });
  test('não confunde com senha errada, que não deve mandar ninguém para a tela do código', () => {
    expect(ehEmailNaoConfirmado({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe(false);
    expect(ehEmailNaoConfirmado(null)).toBe(false);
  });
});
