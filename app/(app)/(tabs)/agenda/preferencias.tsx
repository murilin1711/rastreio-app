import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DESCRICAO_TIPO_LEMBRETE, ROTULO_TIPO_LEMBRETE, type TipoLembrete } from '@core/lembretes/origem';
import { lerPreferencias, salvarPreferencias } from '@core/lembretes/preferencias';
import { PREFERENCIAS_PADRAO, type PreferenciasLembretes } from '@core/perfil/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { TEXTO_PREFERENCIAS } from '@modules/minha-saude/conteudo/relatorios';
import { Colors, InternalHeader, Radius, Spacing, Typography } from '@ui/index';

const TIPOS = Object.keys(ROTULO_TIPO_LEMBRETE) as TipoLembrete[];

/** Preferências de notificação (D-010): um interruptor por tipo; desligar cancela só os avisos do celular. */
export default function Preferencias() {
  const router = useRouter();
  const { sessao } = useSessao();
  const [prefs, setPrefs] = useState<PreferenciasLembretes>(PREFERENCIAS_PADRAO);
  const [salvando, setSalvando] = useState<TipoLembrete | null>(null);

  useEffect(() => {
    if (!sessao?.user.id) return;
    lerPreferencias(sessao.user.id).then(setPrefs).catch(() => {});
  }, [sessao?.user.id]);

  const alternar = async (tipo: TipoLembrete, valor: boolean) => {
    if (!sessao?.user.id) return;
    const novas = { ...prefs, [tipo]: valor };
    setPrefs(novas);
    setSalvando(tipo);
    try { await salvarPreferencias(sessao.user.id, novas); } catch (e) { setPrefs(prefs); Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario); } finally { setSalvando(null); }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Meus lembretes" title="Preferências" />
        <Text style={styles.ajuda}>{TEXTO_PREFERENCIAS.introducao}</Text>
        <View style={{ gap: Spacing.sm, marginTop: Spacing.xl }}>
          {TIPOS.map((t) => (
            <View key={t} style={styles.linha}>
              <View style={{ flex: 1 }}>
                <Text style={styles.titulo}>{ROTULO_TIPO_LEMBRETE[t]}</Text>
                <Text style={styles.descricao}>{DESCRICAO_TIPO_LEMBRETE[t]}</Text>
              </View>
              <Switch value={prefs[t]} onValueChange={(v) => alternar(t, v)} disabled={salvando === t} trackColor={{ true: Colors.accent, false: Colors.border }} thumbColor={Colors.white} accessibilityLabel={ROTULO_TIPO_LEMBRETE[t]} />
            </View>
          ))}
        </View>
        <Text style={styles.nota}>{TEXTO_PREFERENCIAS.nota}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  ajuda: { ...Typography.body, color: Colors.textSecondary },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.linha, padding: Spacing.lg },
  titulo: { ...Typography.subheading, color: Colors.textPrimary },
  descricao: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  nota: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xl },
});
