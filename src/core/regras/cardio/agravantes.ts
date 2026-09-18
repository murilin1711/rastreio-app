/** Fatores agravantes do risco cardiovascular — Diretriz Brasileira de Dislipidemias 2025, Tabela 4.3 (C-013, §17). */
import type { AgravanteCV } from './tiposRisco';

export const LISTA_AGRAVANTES: { id: AgravanteCV; rotulo: string; detalhe: string }[] = [
  { id: 'hist_familiar_dcv_prematura', rotulo: 'Infarto, AVC ou morte cardíaca precoce na família', detalhe: 'Pai, mãe, irmão ou filho com evento antes dos 55 anos (homem) ou 65 anos (mulher).' },
  { id: 'sindrome_metabolica', rotulo: 'Síndrome metabólica', detalhe: 'Diagnóstico feito pelo seu médico (cintura aumentada com alterações de pressão, glicemia ou gorduras no sangue).' },
  { id: 'esteatose_hepatica', rotulo: 'Gordura no fígado (esteatose)', detalhe: 'Principalmente formas mais graves ou associadas a fatores cardiometabólicos.' },
  { id: 'artrite_reumatoide', rotulo: 'Artrite reumatoide', detalhe: 'Condição inflamatória crônica.' },
  { id: 'psoriase', rotulo: 'Psoríase', detalhe: 'Condição inflamatória crônica.' },
  { id: 'lupus', rotulo: 'Lúpus eritematoso sistêmico', detalhe: 'Condição inflamatória crônica.' },
  { id: 'dii', rotulo: 'Doença inflamatória intestinal', detalhe: 'Retocolite ulcerativa ou doença de Crohn.' },
  { id: 'hiv', rotulo: 'Infecção crônica pelo HIV', detalhe: '' },
  { id: 'transplante', rotulo: 'Transplante de órgão', detalhe: 'Por exemplo coração, fígado ou rim.' },
  { id: 'menarca_precoce_ou_tardia', rotulo: 'Primeira menstruação muito cedo ou tarde', detalhe: 'Aos 12 anos ou antes, ou aos 17 anos ou depois.' },
  { id: 'disturbio_gestacional', rotulo: 'Pressão alta ou diabetes na gravidez', detalhe: 'Pré-eclâmpsia, eclâmpsia, hipertensão gestacional ou diabetes gestacional.' },
  { id: 'parto_prematuro', rotulo: 'Parto prematuro', detalhe: '' },
  { id: 'rciu', rotulo: 'Bebê com crescimento restrito na gestação', detalhe: 'Restrição de crescimento intrauterino.' },
  { id: 'abortos_repeticao', rotulo: 'Abortos de repetição', detalhe: 'Três ou mais perdas gestacionais espontâneas.' },
  { id: 'menopausa_precoce', rotulo: 'Menopausa precoce', detalhe: 'Antes dos 40 anos.' },
  { id: 'lpa_elevada', rotulo: 'Lipoproteína(a) elevada', detalhe: '50 mg/dL ou mais (125 nmol/L ou mais) em exame de sangue.' },
  { id: 'pcr_us_elevada', rotulo: 'Proteína C-reativa ultrassensível elevada', detalhe: '2,0 mg/L ou mais em exame de sangue.' },
];

export function temAgravante(itens: AgravanteCV[]): boolean {
  return itens.length > 0;
}
