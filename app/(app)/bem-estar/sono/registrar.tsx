import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSono } from '@core/bemestar/useSono';
import { formatarHm, minutosDeSono } from '@core/regras/bemestar/sono';
import type { Sono } from '@core/regras/bemestar/tipos';
import { useConquistas } from '@core/bemestar/useConquistas';
import { CONQUISTAS_BEM_ESTAR } from '@core/regras/bemestar/conquistas';
import { TEXTO_CONQUISTA } from '@modules/bem-estar/conteudo/conquistas';
import { traduzirErro } from '@core/supabase/erros';
import { ROTULO_CONTEXTO_SONO, ROTULO_QUALIDADE } from '@modules/bem-estar/conteudo/sono';
import { paraISO } from '@modules/coracao/componentes/formato';
import { Button, CampoData, Colors, Input, InternalHeader, ModalComemoracao, Opcoes, Radius, Spacing, Typography } from '@ui/index';

const horaValida = (h: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
const ontemISO = () => new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
const somarDia = (iso: string) => { const [a, m, d] = iso.split('-').map(Number); const x = new Date(a, m - 1, d + 1); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
type Qualidade = '1' | '2' | '3' | '4' | '5';
type ChaveCtx = keyof typeof ROTULO_CONTEXTO_SONO;

/** Registrar noite (§80): dormiu (data + hora), acordou (hora; se antes de dormir, assume o dia seguinte), qualidade, opcionais. */
export default function RegistrarSono() {
  const router = useRouter();
  const { inserir } = useSono();
  const [data, setData] = useState<string | null>(ontemISO());
  const [horaDormiu, setHoraDormiu] = useState('23:00');
  const [horaAcordou, setHoraAcordou] = useState('07:00');
  const [qualidade, setQualidade] = useState<Qualidade | null>(null);
  const [ctx, setCtx] = useState<Sono['contexto']>({});
  const [salvando, setSalvando] = useState(false);

  const calcular = () => {
    if (!data || !horaValida(horaDormiu) || !horaValida(horaAcordou)) return null;
    const dormiuEm = paraISO(data, horaDormiu);
    const acordouEm = paraISO(horaAcordou <= horaDormiu ? somarDia(data) : data, horaAcordou);
    try { return { dormiuEm, acordouEm, minutos: minutosDeSono(dormiuEm, acordouEm) }; } catch { return null; }
  };
  const previa = calcular();

  const conquistas = useConquistas({ auto: false, chaves: CONQUISTAS_BEM_ESTAR });
  const gravar = async () => {
    if (!data) { Alert.alert('Faltou algo', 'Informe a data em que dormiu.'); return; }
    if (!previa) { Alert.alert('Confira os horários', 'Use o formato HH:MM. O tempo de sono precisa ficar entre 1 minuto e 20 horas.'); return; }
    setSalvando(true);
    try {
      await inserir({ dormiuEm: previa.dormiuEm, acordouEm: previa.acordouEm, qualidade: qualidade ? (Number(qualidade) as Sono['qualidade']) : null, contexto: ctx });
      // A comemoração aparece aqui, no momento do registro; a volta espera o modal fechar.
      if ((await conquistas.avaliar()) === 0) router.back();
    } catch (e) { Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario); } finally { setSalvando(false); }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Meu Sono" title="Registrar noite" onBack={() => router.back()} />
        <Text style={styles.rotulo}>Data em que dormiu</Text>
        <CampoData valor={data} onChange={setData} />
        <Text style={styles.rotulo}>Horários</Text>
        <View style={styles.linha}>
          <View style={{ flex: 1 }}><Text style={styles.ajuda}>Dormiu às</Text><Input value={horaDormiu} onChangeText={setHoraDormiu} placeholder="23:00" keyboardType="numbers-and-punctuation" maxLength={5} /></View>
          <View style={{ flex: 1 }}><Text style={styles.ajuda}>Acordou às</Text><Input value={horaAcordou} onChangeText={setHoraAcordou} placeholder="07:00" keyboardType="numbers-and-punctuation" maxLength={5} /></View>
        </View>
        <Text style={styles.previa}>{previa ? `Tempo total de sono: ${formatarHm(previa.minutos)}` : 'Informe os dois horários.'}</Text>
        <Text style={styles.rotulo}>Como você avalia seu sono? (opcional)</Text>
        <Opcoes<Qualidade> opcoes={(['1', '2', '3', '4', '5'] as Qualidade[]).map((q) => ({ valor: q, rotulo: ROTULO_QUALIDADE[Number(q) as 1 | 2 | 3 | 4 | 5] }))} valor={qualidade} onChange={setQualidade} />
        <Text style={styles.rotulo}>Opcionais</Text>
        {(Object.keys(ROTULO_CONTEXTO_SONO) as ChaveCtx[]).map((k) => (
          <View key={k} style={styles.switchLinha}>
            <Text style={styles.texto}>{ROTULO_CONTEXTO_SONO[k]}</Text>
            <Switch value={!!ctx[k]} onValueChange={(v) => setCtx((c) => ({ ...c, [k]: v }))} trackColor={{ true: Colors.accent, false: Colors.border }} thumbColor={Colors.white} />
          </View>
        ))}
        <Button label="Salvar noite" onPress={gravar} loading={salvando} style={{ marginTop: Spacing.xxl }} />
      </ScrollView>
      <ModalComemoracao
        conteudo={conquistas.proxima ? TEXTO_CONQUISTA[conquistas.proxima] : null}
        aoFechar={() => { if (!conquistas.dispensar()) router.back(); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  ajuda: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 },
  linha: { flexDirection: 'row', gap: Spacing.sm },
  previa: { ...Typography.body, color: Colors.textPrimary, marginTop: Spacing.sm },
  texto: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  switchLinha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.linha, padding: Spacing.md, marginBottom: Spacing.xs },
});
