/**
 * Janelas de "dado recente" para o preenchimento automático do PREVENT (§14) — C-014 (decisão de produto,
 * ancorada no ciclo anual de reavaliação da Dislipidemias 2025 e DBHA 2025).
 */
import { ckdEpi2021 } from './ckdEpi';
import type { EntradaPrevent, EstadoDado, FontesPrevent, ParametrosRisco, TipoDado } from './tiposRisco';

const DIA_MS = 86_400_000;
export const diasEntre = (a: string, b: string) => Math.floor((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / DIA_MS);
const meses = (m: number) => Math.round(m * 30.4375);

/** Três estados: usa direto · pergunta se há mais recente ("antigo") · pede novo ("faltando"). */
export function estadoDoDado(tipo: TipoDado, data: string | null, hoje: string, p: ParametrosRisco, n = 0): EstadoDado {
  const d = p.dadoRecente;
  if (!data) return 'faltando';
  const idade = diasEntre(data, hoje);
  switch (tipo) {
    case 'pa_mrpa': return idade <= d.paMrpaDias ? 'atual' : 'faltando';
    case 'pa_casual': return idade <= d.paCasualDias && n >= d.paCasualMin ? 'atual' : 'faltando';
    case 'peso': return idade <= d.pesoDias ? 'atual' : idade <= d.pesoPerguntarDias ? 'antigo' : 'faltando';
    case 'lipidios': return idade <= meses(d.lipidiosMeses) ? 'atual' : 'antigo';
    case 'renal': return idade <= meses(d.renalMeses) ? 'atual' : 'antigo';
    case 'hba1c': return idade <= meses(d.hba1cMeses) ? 'atual' : 'antigo';
    case 'rac': return idade <= meses(d.racMeses) ? 'atual' : 'antigo';
    case 'risco': return idade <= meses(d.riscoMeses) ? 'atual' : 'antigo';
  }
}

export function imcDe(pesoKg: number, alturaCm: number): number {
  const m = alturaCm / 100;
  return Math.round((pesoKg / (m * m)) * 10) / 10;
}

/** Uma entrada por variável do PREVENT, com valor, data, origem e estado (tela "Deseja utilizar seus dados mais recentes?"). */
export function montarEntradasPrevent(f: FontesPrevent, hoje: string, p: ParametrosRisco): EntradaPrevent[] {
  const out: EntradaPrevent[] = [];
  const push = (e: Omit<EntradaPrevent, 'obrigatoria'> & { obrigatoria?: boolean }) => out.push({ obrigatoria: true, ...e });

  push({ chave: 'idade', rotulo: 'Idade', valor: f.idade, unidade: 'anos', data: null, origem: 'perfil', estado: f.idade != null ? 'atual' : 'faltando' });
  push({ chave: 'sexo', rotulo: 'Sexo ao nascer', valor: f.sexo, unidade: null, data: null, origem: 'perfil', estado: f.sexo ? 'atual' : 'faltando' });

  // PA: MRPA válida recente prevalece; senão média das casuais dos últimos dias (≥ mínimo)
  if (f.paMrpa && estadoDoDado('pa_mrpa', f.paMrpa.data, hoje, p) === 'atual') {
    push({ chave: 'pas', rotulo: 'Pressão sistólica (média da MRPA)', valor: f.paMrpa.valor, unidade: 'mmHg', data: f.paMrpa.data, origem: 'medida', estado: 'atual' });
  } else if (f.paCasual && estadoDoDado('pa_casual', f.paCasual.dataMaisRecente, hoje, p, f.paCasual.n) === 'atual') {
    push({ chave: 'pas', rotulo: `Pressão sistólica (média de ${f.paCasual.n} medidas)`, valor: f.paCasual.media, unidade: 'mmHg', data: f.paCasual.dataMaisRecente, origem: 'medida', estado: 'atual' });
  } else {
    push({ chave: 'pas', rotulo: 'Pressão sistólica', valor: null, unidade: 'mmHg', data: null, origem: null, estado: 'faltando' });
  }

  const lip = (chave: 'colesterolTotal' | 'hdl', rotulo: string, d: FontesPrevent['colesterolTotal']) =>
    push({ chave, rotulo, valor: d?.valor ?? null, unidade: 'mg/dL', data: d?.data ?? null, origem: d?.origem ?? null, estado: d ? estadoDoDado('lipidios', d.data, hoje, p) : 'faltando' });
  lip('colesterolTotal', 'Colesterol total', f.colesterolTotal);
  lip('hdl', 'HDL-colesterol', f.hdl);

  push({ chave: 'antiHipertensivo', rotulo: 'Usa remédio para pressão', valor: f.antiHipertensivo?.valor ?? null, unidade: null, data: null, origem: f.antiHipertensivo?.origem ?? null, estado: f.antiHipertensivo ? 'atual' : 'faltando' });
  push({ chave: 'estatina', rotulo: 'Usa estatina', valor: f.estatina?.valor ?? null, unidade: null, data: null, origem: f.estatina?.origem ?? null, estado: f.estatina ? 'atual' : 'faltando' });
  push({ chave: 'diabetes', rotulo: 'Diabetes', valor: f.diabetes, unidade: null, data: null, origem: 'perfil', estado: f.diabetes != null ? 'atual' : 'faltando' });
  push({ chave: 'tabagismo', rotulo: 'Fuma atualmente', valor: f.tabagismoAtual, unidade: null, data: null, origem: 'perfil', estado: f.tabagismoAtual != null ? 'atual' : 'faltando' });

  if (f.peso && f.alturaCm) {
    push({ chave: 'imc', rotulo: 'IMC (peso e altura)', valor: imcDe(f.peso.valor, f.alturaCm), unidade: 'kg/m²', data: f.peso.data, origem: f.peso.origem, estado: estadoDoDado('peso', f.peso.data, hoje, p) });
  } else {
    push({ chave: 'imc', rotulo: 'IMC (peso e altura)', valor: null, unidade: 'kg/m²', data: null, origem: null, estado: 'faltando' });
  }

  if (f.tfg) {
    push({ chave: 'tfg', rotulo: 'Função renal (TFG)', valor: f.tfg.valor, unidade: 'mL/min/1,73 m²', data: f.tfg.data, origem: f.tfg.origem, estado: estadoDoDado('renal', f.tfg.data, hoje, p) });
  } else if (f.creatinina && f.idade != null && f.sexo) {
    push({ chave: 'tfg', rotulo: 'Função renal (TFG calculada da creatinina)', valor: ckdEpi2021(f.creatinina.valor, f.idade, f.sexo), unidade: 'mL/min/1,73 m²', data: f.creatinina.data, origem: f.creatinina.origem, estado: estadoDoDado('renal', f.creatinina.data, hoje, p) });
  } else {
    push({ chave: 'tfg', rotulo: 'Função renal (creatinina ou TFG)', valor: null, unidade: 'mL/min/1,73 m²', data: null, origem: null, estado: 'faltando' });
  }

  push({ chave: 'hba1c', rotulo: 'Hemoglobina glicada (opcional)', valor: f.hba1c?.valor ?? null, unidade: '%', data: f.hba1c?.data ?? null, origem: f.hba1c?.origem ?? null, estado: f.hba1c ? estadoDoDado('hba1c', f.hba1c.data, hoje, p) : 'faltando', obrigatoria: false });
  push({ chave: 'rac', rotulo: 'Albumina/creatinina urinária (opcional)', valor: f.rac?.valor ?? null, unidade: 'mg/g', data: f.rac?.data ?? null, origem: f.rac?.origem ?? null, estado: f.rac ? estadoDoDado('rac', f.rac.data, hoje, p) : 'faltando', obrigatoria: false });
  return out;
}
