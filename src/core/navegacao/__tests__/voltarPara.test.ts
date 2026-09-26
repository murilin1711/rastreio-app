/**
 * "Voltar" de uma tela aberta em outra aba (pedido do Murilo, 25/09): quem sai da Home pelo atalho
 * "Relatório" e toca na seta volta para a Home, não para o que tinha ficado na pilha de Minha Saúde.
 */
import { abaDe, comVolta } from '../voltarPara';

test('aba de cada caminho, com ou sem grupos', () => {
  expect(abaDe('/(app)/(tabs)/minha-saude/relatorios')).toBe('minha-saude');
  expect(abaDe('/minha-saude/medicamentos')).toBe('minha-saude');
  expect(abaDe('/(app)/(tabs)/agenda/consultas')).toBe('agenda');
  expect(abaDe('/')).toBe('inicio');
  expect(abaDe('/(app)/(tabs)')).toBe('inicio');
  expect(abaDe('/rastreando/mama')).toBeNull();          // módulo: abre por cima das abas
  expect(abaDe('/(app)/coracao/pressao/registrar')).toBeNull();
});

test('da Home para outra aba: leva o caminho de volta', () => {
  expect(comVolta('/(app)/(tabs)/minha-saude/relatorios', '/')).toEqual({ pathname: '/(app)/(tabs)/minha-saude/relatorios', params: { voltarPara: '/' } });
});

test('mantém os parâmetros que já existiam, em texto ou em objeto', () => {
  expect(comVolta('/(app)/(tabs)/minha-saude/relatorios/previa?tipo=oncologico&dias=180', '/rastreando'))
    .toEqual({ pathname: '/(app)/(tabs)/minha-saude/relatorios/previa', params: { tipo: 'oncologico', dias: '180', voltarPara: '/rastreando' } });
  expect(comVolta({ pathname: '/(app)/(tabs)/minha-saude/relatorios/previa', params: { tipo: 'cardio' } }, '/coracao/glicemia/relatorio'))
    .toEqual({ pathname: '/(app)/(tabs)/minha-saude/relatorios/previa', params: { tipo: 'cardio', voltarPara: '/coracao/glicemia/relatorio' } });
});

test('dentro da mesma aba, ou indo para um módulo, não muda nada', () => {
  expect(comVolta('/(app)/(tabs)/minha-saude/medicamentos', '/minha-saude')).toBe('/(app)/(tabs)/minha-saude/medicamentos');
  expect(comVolta('/(app)/coracao/pressao/registrar', '/')).toBe('/(app)/coracao/pressao/registrar');
});
