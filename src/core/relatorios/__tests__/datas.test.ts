import { dataLocal, somarDias } from '../datas';

test('dataLocal usa o dia local, mesmo depois das 21h', () => expect(dataLocal(new Date(2026, 8, 18, 23, 30))).toBe('2026-09-18'));
test('somarDias atravessa mês', () => { expect(somarDias('2026-09-18', -27)).toBe('2026-08-22'); expect(somarDias('2026-08-31', 1)).toBe('2026-09-01'); });
