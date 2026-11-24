jest.mock('@core/supabase/client', () => ({ supabase: { auth: { signInWithIdToken: jest.fn() } } }));
jest.mock('expo-apple-authentication', () => ({}));
import { comNovaTentativaAoAbrir, falhouAoAbrirJanela } from '../social';

const SAFARI = new Error('RNGoogleSignIn: Unknown error in google sign in., Error Domain=com.google.GIDSignIn Code=-1 "Unable to open Safari."');

test('reconhece a falha do Google ao abrir a janela de login', () => {
  expect(falhouAoAbrirJanela(SAFARI)).toBe(true);
  expect(falhouAoAbrirJanela(new Error('Network request failed'))).toBe(false);
  expect(falhouAoAbrirJanela(null)).toBe(false);
});

test('repete uma vez quando a janela não abriu (ex.: alerta anterior ainda saindo da tela)', async () => {
  const fn = jest.fn().mockRejectedValueOnce(SAFARI).mockResolvedValueOnce('ok');
  await expect(comNovaTentativaAoAbrir(fn, 0)).resolves.toBe('ok');
  expect(fn).toHaveBeenCalledTimes(2);
});

test('não repete mais de uma vez nem repete outros erros', async () => {
  const sempre = jest.fn().mockRejectedValue(SAFARI);
  await expect(comNovaTentativaAoAbrir(sempre, 0)).rejects.toBe(SAFARI);
  expect(sempre).toHaveBeenCalledTimes(2);
  const outro = new Error('outro');
  const fn = jest.fn().mockRejectedValue(outro);
  await expect(comNovaTentativaAoAbrir(fn, 0)).rejects.toBe(outro);
  expect(fn).toHaveBeenCalledTimes(1);
});
