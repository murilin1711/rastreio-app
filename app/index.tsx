import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ONBOARDING_KEY } from '@core/onboarding/chave';
import { useSessao } from '@core/sessao/SessaoProvider';
import { supabase } from '@core/supabase/client';
import { Colors } from '@ui/theme';

/** Roteador de entrada: onboarding → login → perfil inicial → app. */
export default function Index() {
  const { sessao, carregando } = useSessao();
  const [onboardingVisto, setOnboardingVisto] = useState<boolean | null>(null);
  const [perfilCompleto, setPerfilCompleto] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((v) => setOnboardingVisto(v === 'true'))
      .catch(() => setOnboardingVisto(false));
  }, []);

  useEffect(() => {
    if (!sessao) {
      setPerfilCompleto(null);
      return;
    }
    supabase
      .from('perfil_saude')
      .select('perfil_inicial_completo')
      .eq('user_id', sessao.user.id)
      .single()
      .then(({ data }) => setPerfilCompleto(data?.perfil_inicial_completo ?? false));
  }, [sessao?.user.id]);

  const aguardando = carregando || onboardingVisto === null || (sessao && perfilCompleto === null);
  if (aguardando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }
  if (!sessao) return <Redirect href={onboardingVisto ? '/(auth)/login' : '/(auth)/onboarding'} />;
  if (!perfilCompleto) return <Redirect href="/perfil-inicial" />;
  return <Redirect href="/(app)" />;
}
