import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { armazenamentoSeguro } from './armazenamentoSeguro';
import type { Database } from './database.types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env');
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    // Keychain/Keystore, não texto simples: a sessão dá acesso a um prontuário (D-031).
    storage: armazenamentoSeguro,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
