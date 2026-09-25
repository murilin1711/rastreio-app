import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAtividades } from '@core/bemestar/useAtividades';
import { ROTULO_ATIVIDADE } from '@core/regras/bemestar/atividade';
import type { Intensidade, TipoAtividade } from '@core/regras/bemestar/tipos';
import { useConquistas } from '@core/bemestar/useConquistas';
import { CONQUISTAS_BEM_ESTAR } from '@core/regras/bemestar/conquistas';
import { TEXTO_CONQUISTA } from '@modules/bem-estar/conteudo/conquistas';
import { traduzirErro } from '@core/supabase/erros';
import { DESCRICAO_INTENSIDADE, ROTULO_INTENSIDADE } from '@modules/bem-estar/conteudo/atividade';
import { paraISO } from '@modules/coracao/componentes/formato';
import { Button, CampoData, Colors, Input, InternalHeader, ModalComemoracao, Opcoes, Select, Spacing, Typography } from '@ui/index';

const numero = (t: string) => (t.trim() === '' ? null : Number(t.replace(',', '.')));
const horaValida = (h: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
const agoraHHMM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

/** Registrar atividade (§77): tipo, data/hora, duração, intensidade percebida; distância, FC e calorias opcionais. */
export default function RegistrarAtividade() {
  const router = useRouter();
  const { inserir } = useAtividades();
  const [tipo, setTipo] = useState<TipoAtividade | null>(null);
  const [data, setData] = useState<string | null>(new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState(agoraHHMM());
  const [duracao, setDuracao] = useState('');
  const [intensidade, setIntensidade] = useState<Intensidade | null>(null);
  const [distancia, setDistancia] = useState('');
  const [fc, setFc] = useState('');
  const [calorias, setCalorias] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const conquistas = useConquistas({ auto: false, chaves: CONQUISTAS_BEM_ESTAR });
  const gravar = async () => {
    if (!tipo) { Alert.alert('Faltou algo', 'Escolha a atividade.'); return; }
    if (!data || !horaValida(hora)) { Alert.alert('Faltou algo', 'Informe a data e a hora (HH:MM).'); return; }
    const min = numero(duracao);
    if (min == null || !Number.isInteger(min) || min < 1 || min > 720) { Alert.alert('Faltou algo', 'Informe a duração em minutos (1 a 720).'); return; }
    if (!intensidade) { Alert.alert('Faltou algo', 'Escolha a intensidade percebida.'); return; }
    const fcMedia = numero(fc);
    if (fcMedia != null && (fcMedia < 30 || fcMedia > 250)) { Alert.alert('Confira a frequência cardíaca', 'Valor esperado entre 30 e 250 bpm.'); return; }
    setSalvando(true);
    try {
      await inserir({ inicio: paraISO(data, hora), tipo, duracaoMin: min, intensidade, distanciaKm: numero(distancia), fcMedia, calorias: numero(calorias), observacao: observacao.trim() || null });
      // A comemoração aparece aqui, no momento do registro; a volta espera o modal fechar.
      if ((await conquistas.avaliar()) === 0) router.back();
    } catch (e) { Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario); } finally { setSalvando(false); }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Minhas Atividades" title="Registrar atividade" onBack={() => router.back()} />
        <Text style={styles.rotulo}>Atividade</Text>
        <Select opcoes={(Object.keys(ROTULO_ATIVIDADE) as TipoAtividade[]).map((t) => ({ valor: t, rotulo: ROTULO_ATIVIDADE[t] }))} valor={tipo} onChange={setTipo} placeholder="Escolha a atividade" />
        <Text style={styles.rotulo}>Data e hora de início</Text>
        <CampoData valor={data} onChange={setData} />
        <Input value={hora} onChangeText={setHora} placeholder="HH:MM" keyboardType="numbers-and-punctuation" maxLength={5} style={{ marginTop: Spacing.sm }} />
        <Text style={styles.rotulo}>Duração (minutos)</Text>
        <Input value={duracao} onChangeText={setDuracao} placeholder="Ex.: 40" keyboardType="number-pad" />
        <Text style={styles.rotulo}>Intensidade percebida</Text>
        <Opcoes<Intensidade> opcoes={(['leve', 'moderada', 'vigorosa'] as Intensidade[]).map((i) => ({ valor: i, rotulo: ROTULO_INTENSIDADE[i], descricao: DESCRICAO_INTENSIDADE[i] }))} valor={intensidade} onChange={setIntensidade} />
        <Text style={styles.rotulo}>Opcionais</Text>
        <View style={styles.linha}>
          <Input value={distancia} onChangeText={setDistancia} placeholder="Distância (km)" keyboardType="decimal-pad" style={{ flex: 1 }} />
          <Input value={fc} onChangeText={setFc} placeholder="FC média (bpm)" keyboardType="number-pad" style={{ flex: 1 }} />
        </View>
        <Input value={calorias} onChangeText={setCalorias} placeholder="Calorias (se o aparelho informou)" keyboardType="number-pad" style={{ marginTop: Spacing.sm }} />
        <Input value={observacao} onChangeText={setObservacao} placeholder="Observação" multiline style={{ marginTop: Spacing.sm }} />
        <Button label="Salvar atividade" onPress={gravar} loading={salvando} style={{ marginTop: Spacing.xxl }} />
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
  linha: { flexDirection: 'row', gap: Spacing.sm },
});
