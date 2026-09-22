/**
 * Código de confirmação de e-mail (D-019).
 *
 * A confirmação existe por causa da recuperação de senha: se a pessoa digita o e-mail errado no
 * cadastro e ninguém confere, no dia em que esquecer a senha perde o acesso permanente ao próprio
 * histórico de saúde, sem como provar que a conta é dela. Esquecer senha é o evento mais previsível
 * no público do NERO, majoritariamente idoso — o passo a mais no dia 1 evita a perda total depois.
 *
 * É **código**, não link: o link obriga a sair do app, abrir o e-mail, tocar, abrir o navegador e o
 * navegador conseguir devolver a pessoa ao app — cinco etapas, e a última falha com frequência. Com
 * o código o app fica parado na tela esperando seis números.
 */
export const TAMANHO_CODIGO = 6;

/** A Supabase aceita um pedido de código por 60 s. */
export const ESPERA_REENVIO_S = 60;

/**
 * Deixa só os dígitos e corta no tamanho do código. Serve para quem cola o e-mail inteiro, cola
 * "Código: 123456" ou digita com espaços — casos comuns e que não deveriam virar erro na tela.
 */
export function normalizarCodigo(texto: string): string {
  return texto.replace(/\D/g, '').slice(0, TAMANHO_CODIGO);
}

export function codigoCompleto(codigo: string): boolean {
  return normalizarCodigo(codigo).length === TAMANHO_CODIGO;
}

/**
 * Quantos segundos faltam para poder pedir outro código. Arredonda **para cima**, para a tela nunca
 * mostrar 0 com o botão ainda travado.
 */
export function segundosParaReenviar(ultimoEnvioEm: number | null, agora: number, esperaS = ESPERA_REENVIO_S): number {
  if (ultimoEnvioEm == null) return 0;
  const decorridos = (agora - ultimoEnvioEm) / 1000;
  return Math.max(0, Math.ceil(esperaS - decorridos));
}

/**
 * Se o erro de login é "e-mail ainda não confirmado". Serve para levar a pessoa à tela do código em
 * vez de deixá-la presa num alerta sem saída: quem se cadastra, não termina e volta depois tentaria
 * entrar e travaria ali. Checa o código da API e, como reserva, a mensagem — mas **nunca** confunde
 * com senha errada, que não deve mandar ninguém para a tela do código.
 */
export function ehEmailNaoConfirmado(erro: { code?: string; message?: string } | null | undefined): boolean {
  if (!erro) return false;
  if (erro.code === 'email_not_confirmed') return true;
  return /email not confirmed/i.test(erro.message ?? '');
}
