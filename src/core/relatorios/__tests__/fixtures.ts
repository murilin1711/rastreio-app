import type { PerfilSaude } from '@core/perfil/tipos';
import type { DadosNero, Periodo } from '../tipos';

export const PERIODO_TESTE: Periodo = { desde: '2026-06-20', ate: '2026-09-18', rotulo: 'últimos 90 dias' };

const perfil: PerfilSaude = {
  userId: 'u', nome: 'Ana Souza', dataNascimento: '1975-04-10', sexoNascimento: 'feminino', possuiColoUtero: true, histerectomia: false, alturaCm: 165,
  tabagismoStatus: 'ex', cigarrosDia: 20, anosFumando: 20, dataCessacao: '2020-01-01',
  temDiabetes: true, temHipertensao: true, temDoencaRenal: false, temImunossupressao: false, temHiv: false, temDii: false,
  historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, jaTeveAtividadeSexual: true, racaCor: 'branca', menopausa: true,
  semMedicacoes: false, semAntecedentesFamiliares: false, perfilInicialCompleto: true,
  tipoDiabetes: 'dm2', usaInsulina: 'nao', eventoCvPrevio: false, perfilMetaGlicemica: 'adulto', metasGlicemia: null, planoGlicemia: null,
  agravantesCv: { itens: ['sindrome_metabolica'], atualizadoEm: '2026-09-01' }, atividadeFisicaRegular: false,
  preferenciasLembretes: { exame: true, mrpa: true, glicemia: true, medicacao: true, consulta: true, atualizacao: true },
};

const pa = (i: number, pas: number, pad: number) => ({ id: `pa${i}`, medidoEm: `2026-09-0${i}T08:00:00.000Z`, pas, pad, fc: 70, sessaoId: null, contexto: {} });
const lab = (id: string, tipo: string, valor: number, unidade: string, data = '2026-08-15') => ({ id, tipo, categoria: 'laboratorial' as const, dataRealizacao: data, resultado: { valor, unidade, referenciaMin: undefined, referenciaMax: undefined }, instituicao: 'Lab Central', solicitante: null, observacoes: null });

/** Conjunto completo de dados para os testes de montagem: um pouco de cada módulo. */
export function dadosNeroTeste(): DadosNero {
  return {
    perfil,
    antecedentes: [{ id: 'a1', parentesco: 'mae', grau: 'primeiro', condicao: 'mama', idadeDiagnostico: 52, observacao: null }],
    medicacoes: [
      { id: 'm1', nome: 'Losartana', dose: '50 mg', horarios: ['08:00'], desde: '2024-03-01', ate: null, prescritor: 'Dr. Lima', ativa: true, lembrar: true, observacao: null },
      { id: 'm2', nome: 'Metformina', dose: '850 mg', horarios: ['08:00', '20:00'], desde: '2023-01-10', ate: null, prescritor: null, ativa: true, lembrar: false, observacao: null },
      { id: 'm3', nome: 'Sinvastatina', dose: '20 mg', horarios: ['22:00'], desde: '2022-01-01', ate: '2024-01-01', prescritor: null, ativa: false, lembrar: false, observacao: null },
    ],
    medidasPA: [pa(1, 128, 82), pa(2, 134, 86), pa(3, 126, 80), pa(4, 140, 90), pa(5, 122, 78), pa(6, 130, 84)],
    sessoesMrpa: [{
      id: 's1', inicio: '2026-08-01', diasPrevistos: 5, status: 'concluida', horarios: { manha: '07:00', noite: '21:00' }, paConsultorio: { pas: 142, pad: 92, medidoEm: '2026-07-28' }, concluidaEm: '2026-08-06T00:00:00.000Z',
      resultado: { medidasValidas: 24, medidasExcluidas: 0, diasComRegistro: 4, medias: { total: { pas: 131, pad: 83, n: 24 }, manha: { pas: 133, pad: 85, n: 12 }, noite: { pas: 129, pad: 81, n: 12 }, porDia: [{ dia: 2, data: '2026-08-02', manha: null, noite: null, total: { pas: 130, pad: 82, n: 6 } }, { dia: 3, data: '2026-08-03', manha: null, noite: null, total: { pas: 132, pad: 84, n: 6 } }] }, valido: true, motivoInvalidez: null, acimaReferencia: true, diferencaConsultorio: { pas: 11, pad: 9 }, regraId: 'r' },
    }],
    glicemias: [
      { id: 'g1', medidoEm: '2026-09-01T07:00:00.000Z', mgdl: 112, momento: 'jejum', contexto: {} },
      { id: 'g2', medidoEm: '2026-09-01T14:00:00.000Z', mgdl: 168, momento: 'pos_almoco_2h', contexto: {} },
      { id: 'g3', medidoEm: '2026-09-02T07:00:00.000Z', mgdl: 98, momento: 'jejum', contexto: {} },
      { id: 'g4', medidoEm: '2026-09-02T22:00:00.000Z', mgdl: 140, momento: 'antes_dormir', contexto: {} },
    ],
    metasGlicemia: { origem: 'diretriz', perfil: 'adulto', jejumMin: 80, jejumMax: 130, posMax: 180, deitarMin: 90, deitarMax: 150, regraId: 'rg' },
    examesCardio: [
      lab('e1', 'ldl', 118, 'mg/dL'), lab('e2', 'hdl', 52, 'mg/dL'), lab('e3', 'colesterol_total', 198, 'mg/dL'), lab('e4', 'creatinina', 0.9, 'mg/dL'), lab('e5', 'hba1c', 6.8, '%'),
      lab('e6', 'ldl', 140, 'mg/dL', '2025-08-15'),
      { id: 'e7', tipo: 'cac', categoria: 'cardiologico', dataRealizacao: '2026-07-01', resultado: { agatston: 12, percentil: 40 }, instituicao: 'Imagem SP', solicitante: null, observacoes: null },
    ],
    examesRastreamento: [
      { id: 'x1', tipo: 'mamografia', programa: 'mama', dataRealizacao: '2026-05-10', resultado: { birads: 1 }, classificacao: 'normal', nivelAlerta: 'verde', proximaAcao: 'Repetir em 12 meses', dataProximaAcao: '2027-05-10', mensagem: null, regraId: 'r1', regraVersao: '1', resolveExameId: null, laudoTexto: null },
      { id: 'x2', tipo: 'fit', programa: 'colorretal', dataRealizacao: '2026-08-20', resultado: { fit: 'positivo' }, classificacao: 'investigacao', nivelAlerta: 'laranja', proximaAcao: 'Colonoscopia', dataProximaAcao: null, mensagem: null, regraId: 'r2', regraVersao: '1', resolveExameId: null, laudoTexto: null },
    ],
    pendencias: [{ id: 'p1', programa: 'colorretal', descricao: 'FIT positivo: colonoscopia indicada', nivelAlerta: 'laranja', exameOrigemId: 'x2', abertaEm: '2026-08-20' }],
    sintomas: [],
    avaliacoes: {
      mama: { programa: 'mama', status: 'em_dia', mensagem: 'Mamografia em dia.', regraId: 'r1', regraVersao: '1', proximaData: '2027-05-10' },
      colorretal: { programa: 'colorretal', status: 'exame_atrasado', mensagem: 'Há uma pendência aberta.', regraId: 'r2', regraVersao: '1', proximaData: null },
    },
    riscos: [{ id: 'k1', calculadoEm: '2026-09-05T10:00:00.000Z', modelo: 'base', ascvd10: 7.4, ascvd30: 21.3, categoria: 'intermediario', entradas: [{ chave: 'idade', rotulo: 'Idade', valor: 51, unidade: 'anos', data: null, origem: 'perfil', estado: 'atual', obrigatoria: true }, { chave: 'estatina', rotulo: 'Estatina', valor: false, unidade: null, data: null, origem: 'medicacao', estado: 'atual', obrigatoria: true }], agravantesPresentes: ['sindrome_metabolica'], versaoCoeficientes: 'S12' }],
    checkup: { itens: [{ chave: 'pa', rotulo: 'Pressão', atualizado: true, frase: 'MRPA válida há 1 mês' }], atualizados: 1, total: 8 },
    peso: { kg: 72.5, data: '2026-09-01' },
    documentos: [{ id: 'd1', exameId: 'x1', tipo: 'laudo', nome: 'Laudo mamografia', caminho: 'u/a.pdf', mime: 'application/pdf', tamanho: 2048, dataDocumento: '2026-05-10', observacao: null, criadoEm: '2026-05-11T00:00:00.000Z' }],
    consultas: [{ id: 'c1', especialidade: 'cardiologia', dataHora: '2026-09-25T14:00:00.000Z', local: 'Clínica Norte', profissional: null }],
  };
}
