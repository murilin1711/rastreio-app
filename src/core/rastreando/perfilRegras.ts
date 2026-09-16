import { anosDesde, calcularIdade, calcularIMC, calcularMacosAno } from '@core/perfil/calculos';
import type { AntecedenteFamiliar, PerfilSaude } from '@core/perfil/tipos';
import type { PerfilRegras } from '@core/regras/tipos';

/** Converte o Perfil de Saúde (domínio) no subconjunto derivado que o motor consome. Função pura. */
export function paraPerfilRegras(p: PerfilSaude, antecedentes: AntecedenteFamiliar[], pesoKg: number | null, hoje = new Date()): PerfilRegras {
  return {
    idade: p.dataNascimento ? calcularIdade(p.dataNascimento, hoje) : 0,
    sexoNascimento: p.sexoNascimento ?? 'feminino',
    possuiColoUtero: p.possuiColoUtero,
    jaTeveAtividadeSexual: p.jaTeveAtividadeSexual,
    histerectomia: p.histerectomia,
    racaCor: p.racaCor,
    imc: pesoKg != null && p.alturaCm ? calcularIMC(pesoKg, p.alturaCm) : null,
    tabagismo: {
      status: p.tabagismoStatus ?? 'nunca',
      macosAno: calcularMacosAno(p.cigarrosDia, p.anosFumando),
      anosDesdeCessacao: p.tabagismoStatus === 'ex' ? anosDesde(p.dataCessacao, hoje) : null,
    },
    condicoes: {
      diabetes: p.temDiabetes ?? undefined,
      dii: p.temDii ?? undefined,
      imunossupressao: p.temImunossupressao ?? undefined,
      hiv: p.temHiv ?? undefined,
      doencaRenal: p.temDoencaRenal ?? undefined,
    },
    historicoCancerPessoal: p.historicoCancerPessoal.map((h) => h.tipo),
    lesoesPrecursoras: p.lesoesPrecursoras.map((l) => l.tipo),
    doencasGeneticas: p.doencasGeneticas.map((d) => d.nome),
    radioterapiaToracica: p.radioterapiaToracica === true,
    antecedentes: antecedentes.map((a) => ({ condicao: a.condicao, grau: a.grau, idadeDiagnostico: a.idadeDiagnostico })),
  };
}
