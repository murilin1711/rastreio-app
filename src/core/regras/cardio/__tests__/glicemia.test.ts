import { avaliarGlicemia, metasPara, modelosPlano, resumoGlicemia } from '../glicemia';
import { extrairParametrosGlicemia } from '../parametrosGlicemia';
import type { MedidaGlicemia, PerfilGlicemia } from '../tiposGlicemia';
import { regrasGlicemiaTeste } from './fixturesGlicemia';

const p = extrairParametrosGlicemia(regrasGlicemiaTeste());
const dm: PerfilGlicemia = { temDiabetes: true, tipoDiabetes: 'dm2', usaInsulina: 'nao', perfilMetaGlicemica: 'adulto', metasGlicemia: null };
const semDm: PerfilGlicemia = { ...dm, temDiabetes: false };
const metasAdulto = metasPara(dm, p);
const av = (mgdl: number, momento: MedidaGlicemia['momento'] = 'jejum', sintomas: MedidaGlicemia['contexto']['sintomas'] = [], perfil = dm, metas = metasAdulto) =>
  avaliarGlicemia({ mgdl, momento, sintomas }, perfil, metas, p);

describe('metas (SBD 2026, Tabela 1)', () => {
  test('sem diabetes → sem metas', () => expect(metasPara(semDm, p)).toBeNull());
  test('com diabetes, sem metas do médico → coluna Adultos', () => {
    expect(metasAdulto).toMatchObject({ origem: 'diretriz', perfil: 'adulto', jejumMin: 80, jejumMax: 130, posMax: 180, deitarMin: 90, deitarMax: 150, regraId: 'g-meta-adulto' });
  });
  test('idoso muito comprometido → sem meta pós-prandial', () => {
    expect(metasPara({ ...dm, perfilMetaGlicemica: 'idoso_muito_comprometido' }, p)).toMatchObject({ posMax: null, jejumMin: 100, deitarMax: 200 });
  });
  test('metas do médico prevalecem', () => {
    const m = metasPara({ ...dm, metasGlicemia: { definidasPor: 'medico', jejumMin: 90, jejumMax: 140, posMax: 200, deitarMin: 100, deitarMax: 160 } }, p);
    expect(m).toMatchObject({ origem: 'medico', perfil: 'medico', jejumMax: 140, regraId: null });
  });
});

describe('camadas (C-012)', () => {
  test.each([
    [69, 'hipo_n1', 'amarelo'], [54, 'hipo_n1', 'amarelo'], [53, 'hipo_n2', 'laranja'], [251, 'hiper', 'laranja'],
  ])('%i → %s (%s)', (v, camada, nivel) => expect(av(v)).toMatchObject({ camada, nivel }));
  test('hipoglicemia com confusão ou ajuda → vermelho (nível 3)', () => {
    expect(av(60, 'jejum', ['confusao'])).toMatchObject({ camada: 'hipo_n3', nivel: 'vermelho', regraId: 'g-hipo3' });
    expect(av(45, 'jejum', ['precisou_de_ajuda']).nivel).toBe('vermelho');
  });
  test('> 250 com sintoma de cetoacidose → vermelho', () => {
    expect(av(251, 'aleatoria', ['vomito'])).toMatchObject({ camada: 'hiper_sintoma', nivel: 'vermelho' });
    expect(av(240, 'aleatoria', ['vomito']).nivel).toBeNull();
  });
  test('250 em jejum é só fora da meta, sem cor', () => expect(av(250)).toMatchObject({ camada: 'fora_da_meta', nivel: null, foraDaMeta: 'acima' }));
  test('meta jejum/pré: 110 dentro; 140 acima; 75 abaixo (não é hipo)', () => {
    expect(av(110)).toMatchObject({ camada: 'na_meta', foraDaMeta: null });
    expect(av(140, 'antes_almoco')).toMatchObject({ camada: 'fora_da_meta', foraDaMeta: 'acima' });
    expect(av(75)).toMatchObject({ camada: 'fora_da_meta', foraDaMeta: 'abaixo', nivel: null });
  });
  test('meta 2 h pós: 170 dentro; 190 acima; sem meta pós no muito comprometido', () => {
    expect(av(170, 'pos_almoco_2h').camada).toBe('na_meta');
    expect(av(190, 'pos_almoco_2h').foraDaMeta).toBe('acima');
    const perfilMc = { ...dm, perfilMetaGlicemica: 'idoso_muito_comprometido' as const };
    expect(av(230, 'pos_almoco_2h', [], perfilMc, metasPara(perfilMc, p)).foraDaMeta).toBeNull();
  });
  test('ao deitar usa a faixa própria', () => {
    expect(av(160, 'antes_dormir').foraDaMeta).toBe('acima');
    expect(av(120, 'antes_dormir').camada).toBe('na_meta');
  });
  test('momento sem meta (aleatória, 1 h pós) → sem comparação', () => {
    expect(av(150, 'aleatoria')).toMatchObject({ camada: 'na_meta', foraDaMeta: null });
    expect(av(200, 'pos_cafe_1h').foraDaMeta).toBeNull();
  });
});

describe('sem diabetes no perfil (SBD 2026, Diagnóstico)', () => {
  const s = (v: number, m: MedidaGlicemia['momento'] = 'jejum', sint: MedidaGlicemia['contexto']['sintomas'] = []) => av(v, m, sint, semDm, null);
  test('jejum 126 → convite sem cor', () => expect(s(126)).toMatchObject({ camada: 'sem_diabetes_convite', nivel: null, regraId: 'g-sem-dm' }));
  test('casual 200 → convite; 199 → normal', () => {
    expect(s(200, 'aleatoria').camada).toBe('sem_diabetes_convite');
    expect(s(199, 'aleatoria').camada).toBe('sem_diabetes_normal');
  });
  test('jejum 110 → contexto (faixa de pré-diabetes)', () => expect(s(110).camada).toBe('sem_diabetes_contexto'));
  test('jejum 92 → normal', () => expect(s(92).camada).toBe('sem_diabetes_normal'));
  test('hipoglicemia vale para todos', () => expect(s(53).nivel).toBe('laranja'));
});

describe('modelos de plano (SBD 2026, Monitorização R5/R9/R10/R8)', () => {
  test('DM1 → antes das refeições e ao deitar', () => {
    const m = modelosPlano('dm1', 'intensiva');
    expect(m[0].id).toBe('dm1_sem_sensor');
    expect(m[0].momentos).toEqual(['antes_cafe', 'antes_almoco', 'antes_jantar', 'antes_dormir']);
  });
  test('DM2 basal → jejum', () => expect(modelosPlano('dm2', 'basal')[0]).toMatchObject({ id: 'dm2_basal', momentos: ['jejum'] }));
  test('DM2 intensiva → antes das refeições e ao deitar', () => expect(modelosPlano('dm2', 'intensiva')[0].id).toBe('dm2_intensiva'));
  test('DM2 sem insulina → sem horários fixos', () => expect(modelosPlano('dm2', 'nao')[0]).toMatchObject({ id: 'dm2_sem_insulina', momentos: [] }));
  test('sem tipo definido → todos os modelos', () => expect(modelosPlano(null, null)).toHaveLength(4));
});

test('resumo (§8): médias por grupo, contagens de meta e episódios', () => {
  const med = (mgdl: number, momento: MedidaGlicemia['momento'], d = 1): MedidaGlicemia => ({ id: `${mgdl}${momento}`, medidoEm: `2026-09-0${d}T08:00:00Z`, mgdl, momento, contexto: {} });
  const r = resumoGlicemia([med(100, 'jejum'), med(120, 'jejum', 2), med(140, 'antes_almoco'), med(200, 'pos_almoco_2h'), med(60, 'aleatoria'), med(300, 'aleatoria', 3)], metasAdulto);
  expect(r.n).toBe(6);
  expect(r.mediaJejum).toBe(110);
  expect(r.mediaPre).toBe(120); // jejum + pré-prandial
  expect(r.mediaPos2h).toBe(200);
  expect(r.menor?.mgdl).toBe(60);
  expect(r.maior?.mgdl).toBe(300);
  expect(r.acimaDaMeta).toBe(2); // 140 pré, 200 pós
  expect(r.abaixoDaMeta).toBe(0);
  expect(r.episodiosBaixos).toBe(1);
  expect(r.episodiosAltos).toBe(1);
  expect(resumoGlicemia([], null).media).toBeNull();
});
