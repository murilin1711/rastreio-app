import { useRouter, type Href } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMedicacoes } from '@core/medicacoes/useMedicacoes';
import { usePerfil } from '@core/perfil/usePerfil';
import { CardModulo } from '@modules/home/CardModulo';
import { ItemHoje } from '@modules/home/ItemHoje';
import { montarItensHoje } from '@modules/home/montarItensHoje';
import { Colors, NeroImage, Spacing, Typography } from '@ui/index';

function saudacao(nome?: string | null) {
  const h = new Date().getHours();
  const periodo = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const primeiro = nome?.trim().split(' ')[0];
  return primeiro ? `${periodo}, ${primeiro}` : periodo;
}

/** Home do NERO (§55, §56, §89): saudação, o que precisa de atenção hoje e os quatro módulos. */
export default function Home() {
  const router = useRouter();
  const { perfil, antecedentes, carregando, recarregar } = usePerfil();
  const { ativas, recarregar: recarregarMed } = useMedicacoes();
  const itens = montarItensHoje({ perfil, antecedentesQtd: antecedentes.length, medicacoesAtivasQtd: ativas.length });

  const atualizar = () => { recarregar(); recarregarMed(); };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.conteudo}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={atualizar} tintColor={Colors.primary} />}
      >
        <View style={styles.cabecalho}>
          <View style={{ flex: 1 }}>
            <Text style={styles.saudacao}>{saudacao(perfil?.nome)}</Text>
            <Text style={styles.pergunta}>Como está sua saúde hoje?</Text>
          </View>
          <NeroImage size={104} />
        </View>

        <Text style={styles.secao}>Hoje</Text>
        <View>
          {itens.map((i, idx) => (
            <ItemHoje key={i.id} item={i} ultimo={idx === itens.length - 1} onPress={() => router.push(i.rota as Href)} />
          ))}
        </View>

        <Text style={[styles.secao, { marginTop: Spacing.xxxl }]}>Seus módulos</Text>
        <View style={{ gap: Spacing.md }}>
          <CardModulo titulo="Rastreando" descricao="Rastreamento de câncer organizado pelo seu perfil" variant="rastreando" cor={Colors.accent} onPress={() => router.push('/(app)/rastreando')} />
          <CardModulo titulo="Minha Saúde" descricao="Perfil, medicamentos, exames e relatórios" variant="minha_saude" cor={Colors.primary} onPress={() => router.push('/(app)/minha-saude')} />
          <CardModulo titulo="Coração & Metabolismo" descricao="Pressão, glicemia, exames e risco cardiovascular" variant="cardio" cor="#C2410C" emBreve />
          <CardModulo titulo="Saúde & Bem-estar" descricao="Peso, alimentação, atividade e sono" variant="bem_estar" cor="#15803D" emBreve />
        </View>

        <Text style={styles.rodape}>O NERO organiza suas informações e não substitui a avaliação do seu médico.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xxl },
  saudacao: { ...Typography.display, fontSize: 26, lineHeight: 32, color: Colors.primary },
  pergunta: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.sm },
  rodape: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xxxl },
});
