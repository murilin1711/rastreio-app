import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@core/supabase/client';

/**
 * Bloqueio por biometria (D-032). Quem abre o app entra direto no prontuário, então quem pegar o
 * celular desbloqueado também entra. Este módulo põe o Face ID (ou digital) na frente disso.
 *
 * É **opcional e desligado por padrão**: parte do público tem dificuldade com biometria, e trancar
 * alguém do lado de fora do próprio prontuário é pior do que o risco que se evita. Quem quiser, liga
 * em Minha Saúde.
 *
 * A preferência mora no cofre do aparelho, não no banco: é uma escolha daquele aparelho, e não da
 * conta. A mesma pessoa pode querer biometria no celular que leva na rua e não no tablet de casa.
 */

const CHAVE_ATIVO = 'nero.bloqueio.ativo';

/** Depois deste tempo em segundo plano, pede de novo. Trocar de app por instantes não deve pedir. */
export const MS_TOLERANCIA = 5 * 60 * 1000;

export interface RecursoBiometrico {
  disponivel: boolean;
  /** Nome para a tela: "Face ID", "Touch ID" ou "biometria". */
  nome: string;
}

/** O que este aparelho oferece. Sem hardware ou sem digital cadastrada, não adianta oferecer. */
export async function recursoBiometrico(): Promise<RecursoBiometrico> {
  try {
    const [temHardware, temCadastro, tipos] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    if (!temHardware || !temCadastro) return { disponivel: false, nome: 'biometria' };
    const facial = tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const digital = tipos.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
    return { disponivel: true, nome: facial ? 'Face ID' : digital ? 'Touch ID' : 'biometria' };
  } catch {
    return { disponivel: false, nome: 'biometria' };
  }
}

export async function bloqueioAtivo(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(CHAVE_ATIVO)) === '1';
  } catch {
    return false;
  }
}

export async function definirBloqueio(ativo: boolean): Promise<void> {
  if (ativo) await SecureStore.setItemAsync(CHAVE_ATIVO, '1');
  else await SecureStore.deleteItemAsync(CHAVE_ATIVO).catch(() => {});
}

/**
 * Resultado de uma tentativa de desbloqueio.
 *
 * `erro` é diferente de `negado`: negado é o rosto que não bateu ou o toque em Cancelar, e a pessoa
 * pode tentar de novo. Erro é o sistema biométrico não responder — aí tentar de novo não adianta,
 * e a saída é a senha da conta.
 */
export type ResultadoBiometria = 'ok' | 'negado' | 'erro';

/**
 * Pede a biometria.
 *
 * `disableDeviceFallback: false` deixa cair na senha do aparelho quando o rosto não é reconhecido
 * (máscara, óculos escuros, pouca luz). Sem isso, quem usa o app no escuro fica trancado do lado de
 * fora e a única saída seria desinstalar.
 */
export async function pedirBiometria(): Promise<ResultadoBiometria> {
  try {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloqueie para ver sua saúde',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    return r.success ? 'ok' : 'negado';
  } catch {
    // Decisão do Murilo (24/09): falha do sistema biométrico NÃO libera. Quem não consegue usar o
    // rosto entra com a senha da conta, que é a credencial que ele mesmo cadastrou.
    return 'erro';
  }
}

/**
 * Confere a senha da conta sem derrubar a sessão. É a saída de quem está com a biometria quebrada.
 * Erro de senha devolve `false`; erro de rede também, porque sem poder conferir não se libera nada.
 */
export async function conferirSenha(email: string, senha: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    return !error;
  } catch {
    return false;
  }
}
