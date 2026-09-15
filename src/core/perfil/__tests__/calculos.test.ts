import { anosDesde, calcularIdade, calcularIMC, calcularMacosAno } from '../calculos';

const hoje = new Date('2026-09-15T12:00:00Z');

describe('calcularIdade', () => {
  it('antes do aniversário no ano', () => expect(calcularIdade('1990-12-01', hoje)).toBe(35));
  it('no dia do aniversário', () => expect(calcularIdade('1990-09-15', hoje)).toBe(36));
  it('depois do aniversário', () => expect(calcularIdade('1990-01-10', hoje)).toBe(36));
});

describe('calcularMacosAno (§35)', () => {
  it('20 cigarros/dia por 30 anos = 30 maços-ano', () => expect(calcularMacosAno(20, 30)).toBe(30));
  it('10 cigarros/dia por 15 anos = 7,5', () => expect(calcularMacosAno(10, 15)).toBe(7.5));
  it('null se faltar dado', () => {
    expect(calcularMacosAno(null, 10)).toBeNull();
    expect(calcularMacosAno(20, null)).toBeNull();
  });
});

describe('calcularIMC', () => {
  it('67 kg / 1,65 m = 24,6', () => expect(calcularIMC(67, 165)).toBe(24.6));
  it('arredonda a uma casa', () => expect(calcularIMC(80, 180)).toBe(24.7));
});

describe('anosDesde', () => {
  it('conta anos completos', () => expect(anosDesde('2016-09-16', hoje)).toBe(9));
  it('null se data ausente', () => expect(anosDesde(null, hoje)).toBeNull());
});
