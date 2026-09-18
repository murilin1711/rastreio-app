/** Check-up "Como está minha prevenção?" (§24): conta o que está atualizado pelas janelas de C-014. */
import { estadoDoDado } from './dadoRecente';
import type { FontesCheckup, ItemCheckup, ParametrosRisco } from './tiposRisco';

export function avaliarCheckup(f: FontesCheckup, perfil: { temDiabetes: boolean | null }, hoje: string, p: ParametrosRisco): { itens: ItemCheckup[]; total: 8; atualizados: number } {
  const ok = (tipo: Parameters<typeof estadoDoDado>[0], data: string | null, n = 0) => estadoDoDado(tipo, data, hoje, p) === 'atual' || (tipo === 'pa_casual' && estadoDoDado(tipo, data, hoje, p, n) === 'atual');
  const paOk = f.pa.ehMrpa ? ok('pa_mrpa', f.pa.data) : estadoDoDado('pa_casual', f.pa.data, hoje, p, f.pa.nCasual7d) === 'atual';
  const glicemiaNaoSeAplica = !perfil.temDiabetes;
  const itens: ItemCheckup[] = [
    { chave: 'pa', rotulo: 'Pressão arterial', atualizado: paOk, frase: 'Falta medir sua pressão nos últimos dias (ou concluir uma MRPA).' },
    { chave: 'peso', rotulo: 'Peso e IMC', atualizado: ok('peso', f.peso), frase: 'Falta registrar seu peso.' },
    { chave: 'tabagismo', rotulo: 'Tabagismo', atualizado: f.tabagismoAtualizadoEm != null && estadoDoDado('risco', f.tabagismoAtualizadoEm, hoje, p) === 'atual', frase: 'Falta confirmar sua situação em relação ao cigarro.' },
    { chave: 'glicemia_hba1c', rotulo: 'Glicemia / HbA1c', atualizado: glicemiaNaoSeAplica || ok('hba1c', f.glicemiaOuHba1c), naoSeAplica: glicemiaNaoSeAplica || undefined, frase: glicemiaNaoSeAplica ? 'Não se aplica: sem diabetes no perfil.' : 'Falta atualizar sua hemoglobina glicada ou glicemia.' },
    { chave: 'lipidios', rotulo: 'Perfil lipídico', atualizado: ok('lipidios', f.lipidios), frase: 'Falta atualizar seu perfil lipídico.' },
    { chave: 'renal', rotulo: 'Função renal', atualizado: ok('renal', f.renal), frase: 'Falta atualizar sua creatinina ou TFG.' },
    { chave: 'atividade', rotulo: 'Atividade física', atualizado: ok('peso', f.atividadeFisica), frase: 'Falta registrar sua atividade física (chega na próxima fase).' },
    { chave: 'risco', rotulo: 'Risco cardiovascular', atualizado: ok('risco', f.risco), frase: 'Falta calcular (ou atualizar) seu risco cardiovascular.' },
  ];
  return { itens, total: 8, atualizados: itens.filter((i) => i.atualizado).length };
}
