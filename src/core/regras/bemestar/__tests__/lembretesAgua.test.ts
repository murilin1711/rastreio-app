import { CONFIG_AGUA_PADRAO, horariosAgua, validarConfigAgua } from '../lembretesAgua';

test('das 8h às 20h de 2 em 2 horas', () => {
  expect(horariosAgua('08:00', '20:00', 120)).toEqual(['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']);
});
test('intervalo que não cabe inteiro para antes do fim', () => {
  expect(horariosAgua('09:00', '14:00', 180)).toEqual(['09:00', '12:00']);
});
test('meia em meia hora respeita os minutos', () => {
  expect(horariosAgua('07:30', '09:00', 30)).toEqual(['07:30', '08:00', '08:30', '09:00']);
});
test('fim antes do início não gera horário nenhum', () => {
  expect(horariosAgua('20:00', '08:00', 120)).toEqual([]);
});
test('início igual ao fim dá um único horário', () => {
  expect(horariosAgua('08:00', '08:00', 120)).toEqual(['08:00']);
});
test('intervalo mínimo de uma hora: valores menores são recusados', () => {
  expect(validarConfigAgua({ ...CONFIG_AGUA_PADRAO, intervaloMin: 15 })).toBe('O intervalo mínimo entre lembretes é de 1 hora.');
  expect(validarConfigAgua({ ...CONFIG_AGUA_PADRAO, intervaloMin: 60 })).toBeNull();
});
test('janela invertida é recusada', () => {
  expect(validarConfigAgua({ ...CONFIG_AGUA_PADRAO, inicio: '20:00', fim: '08:00' })).toBe('O horário final precisa vir depois do inicial.');
});
test('configuração padrão é válida e começa desligada', () => {
  expect(validarConfigAgua(CONFIG_AGUA_PADRAO)).toBeNull();
  expect(CONFIG_AGUA_PADRAO.ativo).toBe(false);
});
