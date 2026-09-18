import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCorpo } from '@core/bemestar/useCorpo';
import { traduzirErro } from '@core/supabase/erros';
import { ROTULO_METODO } from '@modules/bem-estar/conteudo/corpo';
import { Button, CampoData, Colors, Input, InternalHeader, Radius, Select, Spacing, Typography } from '@ui/index';

const numero = (t: string) => (t.trim() === '' ? null : Number(t.replace(',', '.')));
type Metodo = keyof typeof ROTULO_METODO;

/** Registrar medidas (§70): peso, altura, cintura, quadril, método, data. Validação de plausibilidade (spec §10). */
export default function RegistrarMedidas() {
  const router = useRouter();
  const { perfil, ultimos, parametros, registrar } = useCorpo();
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [cintura, setCintura] = useState('');
  const [quadril, setQuadril] = useState('');
  const [metodo, setMetodo] = useState<Metodo | null>(null);
  const [data, setData] = useState<string | null>(new Date().toISOString().slice(0, 10));
  const [tecnica, setTecnica] = useState(false);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => { if (perfil?.alturaCm && !altura) setAltura(String(perfil.alturaCm)); }, [perfil?.alturaCm, altura]);

  const gravar = async () => {
    const pesoKg = numero(peso); const alturaCm = numero(altura); const cinturaCm = numero(cintura); const quadrilCm = numero(quadril);
    if (pesoKg == null && cinturaCm == null && quadrilCm == null) { Alert.alert('Faltou algo', 'Informe pelo menos o peso ou a cintura.'); return; }
    if (pesoKg != null && (Number.isNaN(pesoKg) || pesoKg < 20 || pesoKg > 400)) { Alert.alert('Confira o peso', 'O peso deve ficar entre 20 e 400 kg.'); return; }
    if (alturaCm != null && (Number.isNaN(alturaCm) || alturaCm < 100 || alturaCm > 250)) { Alert.alert('Confira a altura', 'A altura deve ficar entre 100 e 250 cm.'); return; }
    if (cinturaCm != null && (Number.isNaN(cinturaCm) || cinturaCm < 40 || cinturaCm > 200)) { Alert.alert('Confira a cintura', 'A circunferência abdominal deve ficar entre 40 e 200 cm.'); return; }
    if (quadrilCm != null && (Number.isNaN(quadrilCm) || quadrilCm < 50 || quadrilCm > 220)) { Alert.alert('Confira o quadril', 'A circunferência do quadril deve ficar entre 50 e 220 cm.'); return; }
    if (!data) { Alert.alert('Faltou algo', 'Informe a data da medida.'); return; }
    const anterior = ultimos.peso?.valores.kg;
    if (pesoKg != null && anterior && Math.abs(pesoKg - anterior) / anterior > 0.2) {
      const ok = await new Promise<boolean>((r) => Alert.alert('Confirma o peso?', `A última medida foi ${String(anterior).replace('.', ',')} kg. Este valor é bem diferente.`, [{ text: 'Corrigir', style: 'cancel', onPress: () => r(false) }, { text: 'Confirmar', onPress: () => r(true) }]));
      if (!ok) return;
    }
    setSalvando(true);
    try {
      await registrar({ medidoEm: `${data}T${new Date().toTimeString().slice(0, 8)}`, pesoKg: pesoKg ?? undefined, alturaCm: alturaCm ?? undefined, cinturaCm: cinturaCm ?? undefined, quadrilCm: quadrilCm ?? undefined, metodo: metodo ?? undefined });
      router.back();
    } catch (e) { Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario); } finally { setSalvando(false); }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Meu Corpo" title="Registrar medidas" onBack={() => router.back()} />
        <Text style={styles.rotulo}>Peso (kg)</Text>
        <Input value={peso} onChangeText={setPeso} placeholder="Ex.: 72,4" keyboardType="decimal-pad" />
        <Text style={styles.rotulo}>Altura (cm)</Text>
        <Input value={altura} onChangeText={setAltura} placeholder="Ex.: 170" keyboardType="number-pad" />
        <Text style={styles.rotulo}>Circunferência abdominal (cm)</Text>
        <Input value={cintura} onChangeText={setCintura} placeholder="Ex.: 88" keyboardType="decimal-pad" />
        <Pressable onPress={() => setTecnica(true)} hitSlop={6}><Text style={styles.link}>Como medir a cintura</Text></Pressable>
        <Text style={styles.rotulo}>Circunferência do quadril (cm, opcional)</Text>
        <Input value={quadril} onChangeText={setQuadril} placeholder="Ex.: 100" keyboardType="decimal-pad" />
        <Text style={styles.rotulo}>Método (opcional)</Text>
        <Select opcoes={(Object.keys(ROTULO_METODO) as Metodo[]).filter((m) => m !== 'dexa').map((m) => ({ valor: m, rotulo: ROTULO_METODO[m] }))} valor={metodo} onChange={setMetodo} placeholder="Balança, bioimpedância…" />
        <Text style={styles.rotulo}>Data da medida</Text>
        <CampoData valor={data} onChange={setData} />
        <Button label="Salvar medidas" onPress={gravar} loading={salvando} style={{ marginTop: Spacing.xxl }} />
      </ScrollView>
      <Modal visible={tecnica} transparent animationType="fade" onRequestClose={() => setTecnica(false)}>
        <Pressable style={styles.fundo} onPress={() => setTecnica(false)}>
          <View style={styles.folha}>
            <Text style={styles.folhaTitulo}>Como medir a cintura</Text>
            <Text style={styles.texto}>{parametros?.tecnica.regra.mensagemPaciente ?? 'Carregando…'}</Text>
            {parametros ? <Text style={styles.fonte}>Fonte: {parametros.tecnica.regra.fonte}</Text> : null}
            <Button label="Entendi" onPress={() => setTecnica(false)} />
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  link: { ...Typography.caption, fontFamily: 'Poppins-SemiBold', color: Colors.accent, marginTop: Spacing.sm },
  texto: { ...Typography.body, color: Colors.textPrimary },
  fonte: { ...Typography.caption, color: Colors.textSecondary },
  fundo: { flex: 1, backgroundColor: 'rgba(15,45,99,0.45)', justifyContent: 'flex-end' },
  folha: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.bloco, borderTopRightRadius: Radius.bloco, padding: Spacing.xxl, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  folhaTitulo: { ...Typography.heading, color: Colors.textPrimary },
});
