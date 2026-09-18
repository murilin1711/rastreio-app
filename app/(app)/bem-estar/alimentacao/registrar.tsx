import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlimentacao } from '@core/bemestar/useAlimentacao';
import { ROTULO_REFEICAO } from '@core/regras/bemestar/alimentacao';
import type { Refeicao, TipoRefeicao } from '@core/regras/bemestar/tipos';
import { traduzirErro } from '@core/supabase/erros';
import { ROTULO_LOCAL, ROTULO_QUANTIDADE, ROTULO_SACIEDADE, TEXTO_ALIMENTACAO } from '@modules/bem-estar/conteudo/alimentacao';
import { paraISO } from '@modules/coracao/componentes/formato';
import { Button, CampoData, Colors, Input, InternalHeader, Opcoes, Radius, Spacing, Typography } from '@ui/index';

const horaValida = (h: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
const agoraHHMM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
type Quantidade = NonNullable<Refeicao['quantidade']>; type Saciedade = NonNullable<Refeicao['saciedade']>; type Local = NonNullable<Refeicao['local']>;

/** Registrar refeição (§74–§75): tipo, data/hora, descrição livre; opcionais leves para não desanimar o registro. */
export default function RegistrarRefeicao() {
  const router = useRouter();
  const { inserir } = useAlimentacao();
  const [tipo, setTipo] = useState<TipoRefeicao | null>(null);
  const [data, setData] = useState<string | null>(new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState(agoraHHMM());
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState<Quantidade | null>(null);
  const [fome, setFome] = useState<number | null>(null);
  const [saciedade, setSaciedade] = useState<Saciedade | null>(null);
  const [local, setLocal] = useState<Local | null>(null);
  const [observacao, setObservacao] = useState('');
  const [maisCampos, setMaisCampos] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const gravar = async () => {
    if (!tipo) { Alert.alert('Faltou algo', 'Escolha a refeição.'); return; }
    if (!data || !horaValida(hora)) { Alert.alert('Faltou algo', 'Informe a data e a hora (HH:MM).'); return; }
    if (!descricao.trim()) { Alert.alert('Faltou algo', 'Escreva o que você comeu, mesmo que em poucas palavras.'); return; }
    setSalvando(true);
    try {
      await inserir({ em: paraISO(data, hora), tipo, descricao: descricao.trim(), quantidade, fomeAntes: fome, saciedade, local, observacao: observacao.trim() || null });
      router.back();
    } catch (e) { Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario); } finally { setSalvando(false); }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Minha Alimentação" title="Registrar refeição" onBack={() => router.back()} />
        <Text style={styles.rotulo}>Qual refeição?</Text>
        <Opcoes<TipoRefeicao> opcoes={(Object.keys(ROTULO_REFEICAO) as TipoRefeicao[]).map((t) => ({ valor: t, rotulo: ROTULO_REFEICAO[t] }))} valor={tipo} onChange={setTipo} />
        <Text style={styles.rotulo}>Data e horário</Text>
        <CampoData valor={data} onChange={setData} />
        <Input value={hora} onChangeText={setHora} placeholder="HH:MM" keyboardType="numbers-and-punctuation" maxLength={5} style={{ marginTop: Spacing.sm }} />
        <Text style={styles.rotulo}>O que você comeu?</Text>
        <Input value={descricao} onChangeText={setDescricao} placeholder={TEXTO_ALIMENTACAO.descricaoAjuda} multiline />
        {!maisCampos ? <Pressable onPress={() => setMaisCampos(true)} hitSlop={6}><Text style={styles.link}>Adicionar detalhes (opcional)</Text></Pressable> : (
          <>
            <Text style={styles.rotulo}>Quantidade aproximada</Text>
            <Opcoes<Quantidade> opcoes={(Object.keys(ROTULO_QUANTIDADE) as Quantidade[]).map((q) => ({ valor: q, rotulo: ROTULO_QUANTIDADE[q] }))} valor={quantidade} onChange={setQuantidade} />
            <Text style={styles.rotulo}>Como estava sua fome antes? (0 = nenhuma, 10 = muita)</Text>
            <View style={styles.escala}>
              {Array.from({ length: 11 }, (_, i) => (
                <Pressable key={i} onPress={() => setFome(i)} style={[styles.escalaItem, fome === i && styles.escalaAtivo]} accessibilityRole="button" accessibilityLabel={`Fome ${i}`}>
                  <Text style={[styles.escalaTexto, fome === i && { color: Colors.white }]}>{i}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.rotulo}>Como ficou após comer?</Text>
            <Opcoes<Saciedade> opcoes={(Object.keys(ROTULO_SACIEDADE) as Saciedade[]).map((s) => ({ valor: s, rotulo: ROTULO_SACIEDADE[s] }))} valor={saciedade} onChange={setSaciedade} />
            <Text style={styles.rotulo}>Onde?</Text>
            <Opcoes<Local> opcoes={(Object.keys(ROTULO_LOCAL) as Local[]).map((l) => ({ valor: l, rotulo: ROTULO_LOCAL[l] }))} valor={local} onChange={setLocal} />
            <Text style={styles.rotulo}>Observação</Text>
            <Input value={observacao} onChangeText={setObservacao} placeholder="Ex.: estava em plantão, comi mais tarde, treinei antes" multiline />
          </>
        )}
        <Button label="Salvar refeição" onPress={gravar} loading={salvando} style={{ marginTop: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  link: { ...Typography.caption, fontFamily: 'Poppins-SemiBold', color: Colors.accent, marginTop: Spacing.md },
  escala: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  escalaItem: { width: 36, height: 36, borderRadius: Radius.linha, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  escalaAtivo: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  escalaTexto: { ...Typography.caption, color: Colors.textPrimary },
});
