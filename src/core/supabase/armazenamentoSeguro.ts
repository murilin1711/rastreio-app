import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Onde a sessão do Supabase mora no aparelho (D-031).
 *
 * Antes era `AsyncStorage`: texto simples no armazenamento do app. Quem tivesse acesso ao aparelho
 * (jailbreak, backup não criptografado, análise forense) lia o token e entrava na conta — e a conta
 * aqui é um prontuário. Agora vai para o Keychain do iOS / Keystore do Android, via `expo-secure-store`.
 *
 * Duas coisas que o adapter precisa resolver:
 *
 * 1. **O Keychain tem limite de 2048 bytes por item.** Uma sessão do Supabase (access token JWT +
 *    refresh token + objeto do usuário) passa perto disso e às vezes ultrapassa. Sem dividir, a
 *    gravação falha e a pessoa é deslogada sem explicação. Por isso o valor é quebrado em pedaços.
 * 2. **Quem já estava logado não pode perder a sessão na atualização.** Na primeira leitura de cada
 *    chave, se não houver nada no cofre, o adapter procura no `AsyncStorage` antigo, move para cá e
 *    apaga de lá.
 */

/** Abaixo do limite de 2048 do Keychain, com folga para a chave e o overhead do próprio item. */
const TAMANHO_PEDACO = 1800;
const SUFIXO_CONTAGEM = '__partes';

const chaveDoPedaco = (chave: string, i: number) => `${chave}__${i}`;

async function apagarPedacos(chave: string, quantas: number): Promise<void> {
  await Promise.all(
    Array.from({ length: quantas }, (_, i) => SecureStore.deleteItemAsync(chaveDoPedaco(chave, i)).catch(() => {})),
  );
  await SecureStore.deleteItemAsync(`${chave}${SUFIXO_CONTAGEM}`).catch(() => {});
}

async function quantasPartes(chave: string): Promise<number> {
  const n = await SecureStore.getItemAsync(`${chave}${SUFIXO_CONTAGEM}`).catch(() => null);
  return n ? Number(n) : 0;
}

/**
 * Traz para o cofre uma sessão que ficou no armazenamento antigo. Roda no máximo uma vez por chave:
 * depois de mover, o valor antigo é apagado e a próxima leitura já encontra tudo aqui.
 */
async function migrarDoAntigo(chave: string): Promise<string | null> {
  const antigo = await AsyncStorage.getItem(chave).catch(() => null);
  if (antigo == null) return null;
  await armazenamentoSeguro.setItem(chave, antigo);
  await AsyncStorage.removeItem(chave).catch(() => {});
  return antigo;
}

export const armazenamentoSeguro = {
  async getItem(chave: string): Promise<string | null> {
    try {
      const partes = await quantasPartes(chave);
      if (partes === 0) return migrarDoAntigo(chave);
      const pedacos = await Promise.all(
        Array.from({ length: partes }, (_, i) => SecureStore.getItemAsync(chaveDoPedaco(chave, i))),
      );
      // Um pedaço faltando torna o valor inútil: melhor tratar como ausente e deixar reautenticar
      // do que devolver um JSON cortado, que quebraria em outro lugar mais difícil de entender.
      if (pedacos.some((p) => p == null)) {
        await apagarPedacos(chave, partes);
        return null;
      }
      return pedacos.join('');
    } catch {
      return null;
    }
  },

  async setItem(chave: string, valor: string): Promise<void> {
    const anteriores = await quantasPartes(chave);
    if (anteriores) await apagarPedacos(chave, anteriores);

    const pedacos: string[] = [];
    for (let i = 0; i < valor.length; i += TAMANHO_PEDACO) pedacos.push(valor.slice(i, i + TAMANHO_PEDACO));

    await Promise.all(pedacos.map((p, i) => SecureStore.setItemAsync(chaveDoPedaco(chave, i), p)));
    await SecureStore.setItemAsync(`${chave}${SUFIXO_CONTAGEM}`, String(pedacos.length));
  },

  async removeItem(chave: string): Promise<void> {
    const partes = await quantasPartes(chave);
    await apagarPedacos(chave, partes);
    await AsyncStorage.removeItem(chave).catch(() => {});
  },
};
