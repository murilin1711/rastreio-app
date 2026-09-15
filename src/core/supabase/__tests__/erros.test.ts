import { ErroNero, traduzirErro } from '../erros';

describe('traduzirErro', () => {
  it('traduz credenciais inválidas', () => {
    const e = traduzirErro({ code: 'invalid_credentials', message: 'Invalid login credentials' });
    expect(e).toBeInstanceOf(ErroNero);
    expect(e.mensagemUsuario).toBe('E-mail ou senha incorretos.');
  });

  it('traduz e-mail já cadastrado', () => {
    expect(traduzirErro({ code: 'user_already_exists', message: '' }).mensagemUsuario).toBe('Este e-mail já está cadastrado.');
  });

  it('traduz violação de RLS (42501)', () => {
    expect(traduzirErro({ code: '42501', message: '' }).mensagemUsuario).toBe('Você não tem permissão para esta ação.');
  });

  it('traduz falha de rede', () => {
    expect(traduzirErro(new TypeError('Network request failed')).mensagemUsuario)
      .toBe('Sem conexão com a internet. Verifique sua rede e tente novamente.');
  });

  it('usa mensagem genérica para o resto', () => {
    expect(traduzirErro({ code: 'xyz', message: 'weird' }).mensagemUsuario).toBe('Não foi possível concluir. Tente novamente.');
  });

  it('devolve o próprio ErroNero se já for um', () => {
    const original = new ErroNero('Teste', null);
    expect(traduzirErro(original)).toBe(original);
  });
});
