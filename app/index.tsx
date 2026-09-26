import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ONBOARDING_KEY } from '@core/onboarding/chave';
import { consentimentoEmDia } from '@core/consentimento/repositorio';
import { useSessao } from '@core/sessao/SessaoProvider';
import { supabase } from '@core/supabase/client';
import { Colors } from '@ui/theme';

/** Roteador de entrada: onboarding → cadastro/login → aceite dos termos (D-056) → perfil inicial → app. */
export default function Index() {
  const { sessao, carregando } = useSessao();
  const [onboardingVisto, setOnboardingVisto] = useState<boolean | null>(null);
  const [perfilCompleto, setPerfilCompleto] = useState<boolean | null>(null);
  const [aceitou, setAceitou] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((v) => setOnboardingVisto(v === 'true'))
      .catch(() => setOnboardingVisto(false));
  }, []);

  useEffect(() => {
    if (!sessao) {
      setPerfilCompleto(null);
      setAceitou(null);
      return;
    }
    // Falha de rede não pode trancar a pessoa fora do app: na dúvida, segue (o aceite é pedido de novo na próxima abertura).
    consentimentoEmDia(sessao.user.id).then(setAceitou).catch(() => setAceitou(true));
    supabase
      .from('perfil_saude')
      .select('perfil_inicial_completo')
      .eq('user_id', sessao.user.id)
      .single()
      .then(({ data }) => setPerfilCompleto(data?.perfil_inicial_completo ?? false));
  }, [sessao?.user.id]);

  const aguardando = carregando || onboardingVisto === null || (sessao && (perfilCompleto === null || aceitou === null));
  if (aguardando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }
  if (!sessao) return <Redirect href={onboardingVisto ? '/(auth)/login' : '/(auth)/onboarding'} />;
  if (!aceitou) return <Redirect href="/consentimento" />;
  if (!perfilCompleto) return <Redirect href="/perfil-inicial" />;
  return <Redirect href="/(app)/(tabs)" />;
}
