import NetInfo from '@react-native-community/netinfo';
import type { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@core/supabase/client';

interface Sessao {
  sessao: Session | null;
  carregando: boolean;
  online: boolean;
  sair: () => Promise<void>;
}

const Ctx = createContext<Sessao | null>(null);

export function SessaoProvider({ children }: { children: React.ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => setSessao(s));
    const cancelarNet = NetInfo.addEventListener((estado) => setOnline(estado.isConnected !== false));
    return () => {
      sub.subscription.unsubscribe();
      cancelarNet();
    };
  }, []);

  const sair = async () => {
    await supabase.auth.signOut();
  };

  return <Ctx.Provider value={{ sessao, carregando, online, sair }}>{children}</Ctx.Provider>;
}

export function useSessao(): Sessao {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSessao precisa estar dentro de SessaoProvider');
  return v;
}
