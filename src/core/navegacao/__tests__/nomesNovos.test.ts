/** Nomes novos da navegação (spec §6.4, D-065): os nomes antigos não aparecem mais nas telas nem nos textos que chegam a elas. */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const RAIZ = join(__dirname, '../../../..');
const EXTRAS = ['src/core/regras/cardio/checkup.ts', 'src/core/referencias/catalogo.ts'];

function telas(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return telas(caminho);
    return caminho.endsWith('.tsx') ? [caminho] : [];
  });
}

/** Arquivos (relativos à raiz do projeto) que ainda contêm o trecho. Com `pasta = 'app'`, entram também os extras. */
function arquivosCom(trecho: string, pasta = 'app'): string[] {
  const arquivos = [...telas(join(RAIZ, pasta)), ...(pasta === 'app' ? EXTRAS.map((e) => join(RAIZ, e)) : [])];
  return arquivos.filter((a) => readFileSync(a, 'utf8').includes(trecho)).map((a) => relative(RAIZ, a));
}

it.each(['Coração & Metabolismo', 'Saúde & Bem-estar', 'Relatório de Saúde & Hábitos', 'sectionLabel="Rastreamentos"'])('"%s" não aparece mais nas telas', (antigo) => {
  expect(arquivosCom(antigo)).toEqual([]);
});

it('o módulo do coração não diz mais "Sinais de alerta"', () => {
  expect(arquivosCom('Sinais de alerta', 'app/(app)/coracao')).toEqual([]);
});

it.each(['Minha Pressão', 'Minha Glicemia'])('"%s" vira minúscula, como o item da lista', (antigo) => {
  expect(arquivosCom(antigo)).toEqual([]);
});

/** Formulário diz o mesmo verbo do botão que leva a ele (Ruling T6-a). */
it.each([
  ['app/(app)/coracao/pressao/registrar.tsx', 'Anotar minha pressão'],
  ['app/(app)/coracao/glicemia/registrar.tsx', 'Anotar minha glicemia'],
  ['app/(app)/bem-estar/corpo/registrar.tsx', 'Anotar peso e medidas'],
  ['app/(app)/bem-estar/sono/registrar.tsx', 'Anotar noite de sono'],
  ['app/(app)/bem-estar/atividade/registrar.tsx', 'Anotar atividade'],
  ['app/(app)/bem-estar/alimentacao/registrar.tsx', 'Anotar refeição'],
])('%s tem o título "%s"', (arquivo, titulo) => {
  const fonte = readFileSync(join(RAIZ, arquivo), 'utf8');
  expect(fonte).toContain(`title="${titulo}"`);
  expect(fonte).not.toMatch(/title="Registrar /);
});
