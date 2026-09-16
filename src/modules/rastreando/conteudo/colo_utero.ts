import type { ConteudoPrograma } from './tipos';

export const colo_utero: ConteudoPrograma = {
  titulo: 'Câncer do colo do útero',
  subtitulo: 'Rastreamento com teste de DNA-HPV',
  icone: 'flower-outline',
  capa: ['#7C3AED', '#C084FC'],
  entenda: [
    'O câncer do colo do útero é causado, na quase totalidade dos casos, por infecção persistente pelo HPV. Ele se desenvolve devagar, passando por lesões que podem ser tratadas antes de virar câncer.',
    'Desde 2025, o exame de rastreamento no Brasil passou a ser o teste de DNA-HPV, que detecta o vírus antes de qualquer lesão. Ele substitui gradualmente o Papanicolau.',
    'A recomendação é começar aos 25 anos, para quem já teve atividade sexual, e repetir a cada 5 anos quando o resultado for negativo. O rastreamento encerra quando o último teste depois dos 60 anos for negativo.',
    'Pessoas com HIV ou imunossupressão têm intervalo menor (3 anos) e continuam o rastreamento sem idade limite.',
  ],
  noSus: 'O teste de DNA-HPV está sendo implantado no SUS desde 2025. Onde ainda não chegou, o Papanicolau continua válido: anual e, após dois resultados normais seguidos, a cada 3 anos.',
  fatoresEducativos: [
    'Tabagismo',
    'Início precoce da vida sexual e múltiplos parceiros',
    'Uso prolongado de anticoncepcional oral',
    'Não ter sido vacinada contra o HPV',
  ],
  fatoresModificadores: [
    'HIV ou outra condição de imunossupressão',
    'Lesão de alto grau (NIC 2, NIC 3 ou AIS) já tratada',
    'Histerectomia por lesão precursora ou câncer do colo',
  ],
  sinaisAlerta: [
    { id: 'sangramento_fora_periodo', texto: 'Sangramento fora do período menstrual ou após a menopausa' },
    { id: 'sangramento_relacao', texto: 'Sangramento durante ou após a relação sexual' },
    { id: 'corrimento_odor', texto: 'Corrimento persistente, com odor forte ou com sangue' },
    { id: 'dor_pelvica', texto: 'Dor pélvica persistente sem causa conhecida' },
  ],
  fonteResumo: 'INCA 2025 · Portaria SAES/SECTICS 13/2025',
};
