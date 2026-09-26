import * as AppleAuthentication from 'expo-apple-authentication';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { supabase } from '@core/supabase/client';

/**
 * Login com Apple e Google (D-061), nativo: o sistema entrega um token de identidade e a Supabase cria
 * ou abre a conta com `signInWithIdToken`. Quem entra assim não passa pelas caixas do cadastro; o
 * `app/index.tsx` leva à tela de aceite (D-056). IDs do Google não são segredo (vão dentro do app).
 */
export const GOOGLE_WEB_CLIENT_ID = '778333253878-rg4u675l5p4926329pjngmle68iabthe.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '778333253878-btk37n764jlvaq39nilqdnf35tk86qf1.apps.googleusercontent.com';

export type ResultadoSocial = 'ok' | 'cancelado';

export async function appleDisponivel(): Promise<boolean> {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync().catch(() => false));
}

/** O Expo Go não tem o módulo nativo do Google; lá o botão não aparece (funciona no build). */
export const googleDisponivel = () => Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

export async function entrarComApple(): Promise<ResultadoSocial> {
  // A Apple recebe o hash; a Supabase recebe o valor bruto e confere que batem (evita reuso do token).
  const nonce = Crypto.randomUUID();
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
  let credencial: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credencial = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hash,
    });
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return 'cancelado';
    throw e;
  }
  if (!credencial.identityToken) throw new Error('A Apple não devolveu o token de identidade.');
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credencial.identityToken, nonce });
  if (error) throw error;
  // A Apple só entrega o nome no primeiro login, fora do token: grava se o perfil ainda estiver sem nome.
  const nome = [credencial.fullName?.givenName, credencial.fullName?.familyName].filter(Boolean).join(' ').trim();
  if (nome && data.user) await supabase.from('perfil_saude').update({ nome }).eq('user_id', data.user.id).eq('nome', '');
  return 'ok';
}

export async function entrarComGoogle(): Promise<ResultadoSocial> {
  // `require` aqui dentro: importar no topo derrubaria o Expo Go, que não tem o módulo nativo.
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = require('@react-native-google-signin/google-signin');
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID });
  try {
    await GoogleSignin.hasPlayServices();
    const resposta = await GoogleSignin.signIn();
    if (!isSuccessResponse(resposta)) return 'cancelado';
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
