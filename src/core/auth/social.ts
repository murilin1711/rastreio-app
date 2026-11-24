import * as AppleAuthentication from 'expo-apple-authentication';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { SignInResponse } from '@react-native-google-signin/google-signin';
import { supabase } from '@core/supabase/client';

/**
 * Login com Apple e Google (D-061), nativo: o sistema entrega um token de identidade e a Supabase cria
 * ou abre a conta com `signInWithIdToken`. Quem entra assim não passa pelas caixas do cadastro; o
 * `app/index.tsx` leva à tela de aceite (D-056). IDs do Google não são segredo (vão dentro do app).
 */
// Corrigidos em 26/09: estavam trocados. O Google recusou o login com "custom scheme não permitido para cliente Web",
// o que prova que o ID usado como iOS era o do cliente Web.
export const GOOGLE_WEB_CLIENT_ID = '778333253878-btk37n764jlvaq39nilqdnf35tk86qf1.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '778333253878-rg4u675l5p4926329pjngmle68iabthe.apps.googleusercontent.com';

export type ResultadoSocial = 'ok' | 'cancelado';

export async function appleDisponivel(): Promise<boolean> {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync().catch(() => false));
}

/** O Expo Go não tem o módulo nativo do Google; lá o botão não aparece (funciona no build). */
export const googleDisponivel = () => Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

export async function entrarComApple(): Promise<ResultadoSocial> {
  // Igual ao exemplo oficial da Supabase para Expo: sem nonce. A primeira versão mandava o hash do nonce à
  // Apple e o valor bruto à Supabase (formato do login pela web) e falhou no aparelho em 26/09.
  let credencial: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credencial = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return 'cancelado';
    throw e;
  }
  if (!credencial.identityToken) throw new Error('A Apple não devolveu o token de identidade.');
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credencial.identityToken });
  if (error) throw error;
  // A Apple só entrega o nome no primeiro login, fora do token: grava se o perfil ainda estiver sem nome.
  const nome = [credencial.fullName?.givenName, credencial.fullName?.familyName].filter(Boolean).join(' ').trim();
  if (nome && data.user) await supabase.from('perfil_saude').update({ nome }).eq('user_id', data.user.id).eq('nome', '');
  return 'ok';
}

/** O Google não conseguiu abrir a janela de login ("Unable to open Safari", GIDSignIn código -1). */
export function falhouAoAbrirJanela(e: unknown): boolean {
  const msg = (e as { message?: unknown } | null)?.message;
  return typeof msg === 'string' && /unable to open safari/i.test(msg);
}

/**
 * Visto no Sentry em 20/11/2026: tocar no Google logo depois de fechar o alerta de erro da Apple deu "Unable to
 * open Safari". O alerta do React Native usa uma janela própria por cima do app, e o Google tenta abrir o login
 * enquanto ela ainda sai. Uma nova tentativa, depois de uma pausa curta, já encontra a tela do app.
 */
export async function comNovaTentativaAoAbrir<T>(fn: () => Promise<T>, esperaMs = 700): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (!falhouAoAbrirJanela(e)) throw e;
    await new Promise((r) => setTimeout(r, esperaMs));
    return fn();
  }
}

export async function entrarComGoogle(): Promise<ResultadoSocial> {
  // `require` aqui dentro: importar no topo derrubaria o Expo Go, que não tem o módulo nativo.
  const { GoogleSignin, isErrorWithCode, statusCodes } = require('@react-native-google-signin/google-signin');
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID });
  try {
    await GoogleSignin.hasPlayServices();
    const resposta = await comNovaTentativaAoAbrir<SignInResponse>(() => GoogleSignin.signIn());
    if (resposta.type !== 'success') return 'cancelado'; // o mesmo teste do `isSuccessResponse` da biblioteca
    const token = resposta.data.idToken;
    if (!token) throw new Error('O Google não devolveu o token de identidade.');
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token });
    if (error) throw error;
    return 'ok';
  } catch (e) {
    const codigo = isErrorWithCode(e) ? (e as { code: string }).code : null;
    if (codigo === statusCodes.SIGN_IN_CANCELLED || codigo === statusCodes.IN_PROGRESS) return 'cancelado';
    throw e;
  }
}
