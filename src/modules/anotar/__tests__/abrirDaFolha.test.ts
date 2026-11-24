import { abrirDaFolha } from '../abrirDaFolha';

it('registro de módulo empilha sobre a folha, sem fechar', () => {
  expect(abrirDaFolha('/(app)/coracao/pressao/registrar', '/historico')).toEqual({ fecharAntes: false, href: '/(app)/coracao/pressao/registrar' });
});

it('documento, aberto de outra aba, fecha a folha e leva a volta', () => {
  expect(abrirDaFolha('/(app)/(tabs)/minha-saude/documentos/novo', '/historico')).toEqual({
    fecharAntes: true,
    href: { pathname: '/(app)/(tabs)/minha-saude/documentos/novo', params: { voltarPara: '/historico' } },
  });
});

it('documento, aberto da própria aba Minha Saúde, fecha a folha sem voltarPara', () => {
  expect(abrirDaFolha('/(app)/(tabs)/minha-saude/documentos/novo', '/minha-saude')).toEqual({ fecharAntes: true, href: '/(app)/(tabs)/minha-saude/documentos/novo' });
});

it('rota de módulo nova (ex.: /(app)/remedios/hoje) também empilha', () => {
  expect(abrirDaFolha('/(app)/remedios/hoje', '/')).toEqual({ fecharAntes: false, href: '/(app)/remedios/hoje' });
});
