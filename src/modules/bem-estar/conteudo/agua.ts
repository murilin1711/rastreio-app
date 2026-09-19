/**
 * Textos do módulo de água (C-021). O app fala de "água bebida" o tempo todo, para não confundir
 * com as diretrizes de água total. Nada aqui promete benefício clínico: o §66 pede tom calmo e o
 * §76 proíbe classificar como bom ou ruim.
 */
export const TEXTO_AGUA = {
  subtitulo: 'Quanta água você bebeu hoje. Conta só o que você bebe — a água dos alimentos não entra.',
  origemMeta: 'Meta estimada pelo app a partir do seu peso (35 ml por quilo por dia), uma regra de cálculo usada em nutrição clínica. Não é uma recomendação de diretriz: ajuste com seu médico ou nutricionista.',
  semPeso: 'Registre seu peso em Meu Corpo para o app estimar uma meta, ou defina a sua.',
  restricao: 'Você marcou doença renal ou insuficiência cardíaca no seu perfil. Nesses casos a quantidade de líquido faz parte do tratamento e quem define é o seu médico — por isso o app não calcula uma meta para você. Registre o quanto bebeu e leve para a consulta.',
  lembretesRestricao: 'Como a quantidade de líquido faz parte do seu tratamento, o app não envia lembretes para beber água. Siga a orientação do seu médico.',
  comoFunciona: (quantos: number) => `${quantos} ${quantos === 1 ? 'aviso' : 'avisos'} por dia, nessa janela. Você pode desligar aqui ou em Minha Saúde › Lembretes.`,
  metaBatida: {
    titulo: 'Você bebeu a quantidade de água que era sua meta hoje.',
    incentivo: 'Manter isso nos próximos dias é o que faz diferença — e em dias de calor ou de atividade física você precisa de mais. Se sentir sede, beba, mesmo depois de bater a meta.',
  },
} as const;

/** Medidas rápidas da tela, em ml. */
export const PORCOES_AGUA = [
  { rotulo: 'Copo', ml: 200 },
  { rotulo: 'Copo grande', ml: 300 },
  { rotulo: 'Garrafa', ml: 500 },
] as const;

/** Intervalos oferecidos na tela. O mínimo é 1 hora, para o lembrete não virar ruído. */
export const INTERVALOS_AGUA = [
  { min: 60, rotulo: '1 hora' },
  { min: 90, rotulo: '1h30' },
  { min: 120, rotulo: '2 horas' },
  { min: 180, rotulo: '3 horas' },
] as const;
