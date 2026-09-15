import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const raiz = join(__dirname, '..');
const proibidos = ["'react", "'react-native", "'expo", "'@expo", "'@supabase", "'@ui", "'@core/supabase", "'@modules", "'app/"];

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === '__tests__' ? [] : arquivos(p);
    return p.endsWith('.ts') ? [p] : [];
  });
}

test('src/core/regras não importa UI, Expo nem Supabase (regra de ouro da spec)', () => {
  const lista = arquivos(raiz);
  expect(lista.length).toBeGreaterThan(0);
  for (const arq of lista) {
    const imports = readFileSync(arq, 'utf8').match(/from\s+(['"])([^'"]+)\1/g) ?? [];
    for (const imp of imports) {
      for (const p of proibidos) expect(`${arq}: ${imp}`).not.toContain(p);
    }
  }
});
