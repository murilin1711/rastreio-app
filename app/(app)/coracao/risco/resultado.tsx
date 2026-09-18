import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRiscoCv } from '@core/cardio/useRiscoCv';
import type { EntradaPrevent } from '@core/regras/cardio/tiposRisco';
import { dataLongaBr } from '@modules/coracao/componentes/formato';
import { FatorRisco } from '@modules/coracao/componentes/FatorRisco';
import { frase30anos, fraseAgravantes, fraseCategoria, fraseFatores, fraseResultado } from '@modules/coracao/conteudo/risco';
import { Alerta, Button, Card, Colors, InternalHeader, Radius, Spacing, StatusBadge, Typography } from '@ui/index';

const ROTULO_CAT = { baixo: 'Risco baixo pelo escore', intermediario: 'Risco intermediário pelo escore', alto: 'Risco alto pelo escore' } as const;
const NIVEL_CAT = { baixo: 'verde', intermediario: 'amarelo', alto: 'laranja' } as const;
const fmt = (n: number) => String(n).replace('.', ',');

/** Resultado do risco (§15–§16) com fatores educativos e aviso de dados antigos (C-014). */
export default function ResultadoRisco() {
  const router = useRouter();
  const { ultimo, parametros, perfil, carregando } = useRiscoCv();
  if (!ultimo || !parametros) return <SafeAreaView style={styles.tela} edges={['top']}><View style={styles.conteudo}><InternalHeader sectionLabel="Meu Risco" title="Resultado" /><Text style={styles.texto}>{carregando ? 'Carregando…' : 'Nenhum cálculo ainda.'}</Text></View></SafeAreaView>;

  const por = Object.fromEntries(ultimo.entradas.map((e) => [e.chave, e])) as Partial<Record<EntradaPrevent['chave'], EntradaPrevent>>;
  const num = (c: EntradaPrevent['chave']) => (typeof por[c]?.valor === 'number' ? (por[c]!.valor as number) : null);
  const antigos = ultimo.entradas.filter((e) => e.estado === 'antigo');
  const fatores: { nivel: 'verde' | 'amarelo' | 'vermelho'; texto: string }[] = [
    por.tabagismo?.valor ? { nivel: 'vermelho', texto: 'Fuma atualmente — é o fator que mais pesa e o que mais muda o resultado ao parar.' } : { nivel: 'verde', texto: 'Não fuma.' },
    (num('pas') ?? 0) >= 130 ? { nivel: 'amarelo', texto: `Pressão sistólica ${num('pas')} — acima da referência domiciliar de 130.` } : { nivel: 'verde', texto: `Pressão sistólica ${num('pas') ?? '—'} — dentro da referência.` },
    por.diabetes?.valor ? { nivel: 'vermelho', texto: 'Diabetes.' } : { nivel: 'verde', texto: 'Sem diabetes.' },
    (num('imc') ?? 0) >= 30 ? { nivel: 'amarelo', texto: `IMC ${fmt(num('imc')!)} — faixa de obesidade.` } : (num('imc') ?? 0) >= 25 ? { nivel: 'amarelo', texto: `IMC ${fmt(num('imc')!)} — faixa de sobrepeso.` } : { nivel: 'verde', texto: `IMC ${num('imc') != null ? fmt(num('imc')!) : '—'} — dentro da faixa esperada.` },
    (num('tfg') ?? 90) < 60 ? { nivel: 'amarelo', texto: `Função renal reduzida (TFG ${fmt(num('tfg')!)}).` } : { nivel: 'verde', texto: 'Função renal preservada.' },
    perfil?.atividadeFisicaRegular === false ? { nivel: 'amarelo', texto: 'Sedentarismo.' } : perfil?.atividadeFisicaRegular ? { nivel: 'verde', texto: 'Pratica atividade física.' } : { nivel: 'amarelo', texto: 'Atividade física não informada.' },
  ];

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Meu Risco" title="Seu risco cardiovascular estimado" onBack={() => router.replace('/(app)/coracao/risco')} />
        <Card style={styles.card}>
          <Text style={styles.rotulo}>Risco de infarto ou AVC em 10 anos · calculado em {dataLongaBr(ultimo.calculadoEm.slice(0, 10))}</Text>
          <Text style={styles.valor}>{fmt(ultimo.ascvd10)} %</Text>
          <StatusBadge nivel={NIVEL_CAT[ultimo.categoria]} label={ROTULO_CAT[ultimo.categoria]} />
          <Text style={styles.nota}>{fraseCategoria}</Text>
          {ultimo.ascvd30 != null ? (
            <View style={{ marginTop: Spacing.md }}>
              <Text style={styles.rotulo}>Estimativa em 30 anos</Text>
              <Text style={styles.valor30}>{fmt(ultimo.ascvd30)} %</Text>
              <Text style={styles.nota}>{frase30anos}</Text>
            </View>
          ) : null}
        </Card>
        <View style={styles.destaque}><Text style={styles.destaqueTexto}>{fraseResultado}</Text></View>

        {antigos.length ? <View style={[styles.aviso, { backgroundColor: Alerta.cinza.bg }]}><Text style={styles.nota}>{parametros.dadoRecente.regra.mensagemPaciente} ({antigos.map((a) => a.rotulo.toLowerCase()).join(', ')})</Text></View> : null}

        <View style={styles.bloco}>
          <Text style={styles.secao}>O que está impactando meu risco</Text>
          <Text style={styles.nota}>{fraseFatores}</Text>
          {fatores.map((f, i) => <FatorRisco key={i} nivel={f.nivel} texto={f.texto} />)}
        </View>

        {ultimo.agravantesPresentes.length ? <View style={[styles.aviso, { backgroundColor: Alerta.amarelo.bg }]}><Text style={[styles.texto, { color: Alerta.amarelo.fg }]}>{fraseAgravantes}</Text></View> : null}
        <Button label="Fatores agravantes e escore de cálcio" variant="outline" onPress={() => router.push('/(app)/coracao/risco/agravantes')} style={{ marginTop: Spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  card: { padding: Spacing.xl, gap: Spacing.sm },
  rotulo: { ...Typography.caption, color: Colors.textSecondary },
  valor: { fontFamily: 'Poppins-ExtraBold', fontSize: 56, lineHeight: 62, color: Colors.textPrimary, letterSpacing: -1 },
  valor30: { fontFamily: 'Poppins-Bold', fontSize: 28, lineHeight: 34, color: Colors.textPrimary },
  texto: { ...Typography.body, color: Colors.textPrimary },
  nota: { ...Typography.caption, color: Colors.textSecondary },
  destaque: { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.bloco, padding: Spacing.xl, marginTop: Spacing.lg },
  destaqueTexto: { ...Typography.body, color: Colors.textPrimary },
  aviso: { borderRadius: Radius.linha, padding: Spacing.lg, marginTop: Spacing.lg },
  bloco: { marginTop: Spacing.xxl },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.xs },
});
