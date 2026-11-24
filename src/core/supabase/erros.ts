/** Erro com mensagem pronta para o usuário. Repositórios lançam; telas exibem `mensagemUsuario`. */
export class ErroNero extends Error {
  constructor(public mensagemUsuario: string, public causa: unknown) {
    super(mensagemUsuario);
    this.name = 'ErroNero';
  }
}

const porCodigo: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  user_already_exists: 'Este e-mail já está cadastrado.',
  email_exists: 'Este e-mail já está cadastrado.',
  weak_password: 'A senha precisa ter pelo menos 8 caracteres.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar.',
  over_email_send_rate_limit: 'Muitas tentativas. Aguarde um minuto e tente de novo.',
  '23505': 'Este registro já existe.',
  '42501': 'Você não tem permissão para esta ação.',
  PGRST116: 'Registro não encontrado.',
};

const SENHA_VAZADA = 'Essa senha já apareceu em vazamentos de dados na internet e pode ser descoberta. Escolha outra.';

// "Entrar com a Apple" recusado pela própria Apple depois do Face ID (visto no Sentry em 20/11/2026): quase
// sempre é o Apple ID do aparelho, não o app. A saída que sempre funciona é o e-mail.
const APPLE_RECUSOU = 'A Apple não concluiu o login. Tente de novo ou entre com e-mail e senha.';
const CODIGOS_APPLE = ['ERR_REQUEST_UNKNOWN', 'ERR_REQUEST_FAILED', 'ERR_REQUEST_NOT_HANDLED', 'ERR_INVALID_RESPONSE'];
const GOOGLE_SEM_JANELA = 'O Google não abriu a janela de login. Tente de novo em alguns segundos.';

const GENERICA = 'Não foi possível concluir. Tente novamente.';
const SEM_REDE = 'Sem conexão com a internet. Verifique sua rede e tente novamente.';

export function traduzirErro(e: unknown): ErroNero {
  if (e instanceof ErroNero) return e;
  const obj = (e ?? {}) as { code?: string; message?: string; reasons?: string[] };
  const msg = obj.message ?? (e instanceof Error ? e.message : '');
  if (/network request failed|failed to fetch|network error/i.test(msg)) return new ErroNero(SEM_REDE, e);
  // Proteção contra senha vazada (painel da Supabase): mesmo código da senha curta, outro motivo.
  if (obj.code === 'weak_password' && obj.reasons?.includes('pwned')) return new ErroNero(SENHA_VAZADA, e);
  if (obj.code && CODIGOS_APPLE.includes(obj.code)) return new ErroNero(APPLE_RECUSOU, e);
  if (/unable to open safari/i.test(msg)) return new ErroNero(GOOGLE_SEM_JANELA, e);
  if (obj.code && porCodigo[obj.code]) return new ErroNero(porCodigo[obj.code], e);
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn('[NERO] erro não traduzido:', e);
  return new ErroNero(GENERICA, e);
}
