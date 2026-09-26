import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * O nome dito ao Nero no onboarding (D-063) fica só no celular até a conta existir: preenche o campo
 * Nome do cadastro e o do perfil inicial, e é apagado depois. Sem armazenamento, o app segue sem nome.
 */
const CHAVE = 'nero:nome-onboarding';

export async function guardarNome(nome: string): Promise<void> {
  const n = nome.trim();
  try {
    if (n) await AsyncStorage.setItem(CHAVE, n);
    else await AsyncStorage.removeItem(CHAVE);
  } catch { /* segue sem nome */ }
}

export async function lerNome(): Promise<string | null> {
  try { return (await AsyncStorage.getItem(CHAVE))?.trim() || null; } catch { return null; }
}

export async function apagarNome(): Promise<void> {
  try { await AsyncStorage.removeItem(CHAVE); } catch { /* nada a fazer */ }
}
