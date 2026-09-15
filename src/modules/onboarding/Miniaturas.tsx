import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alerta, Colors, Radius, Spacing, Typography } from '@ui/theme';

/**
 * Miniaturas nativas do produto usadas no onboarding — o que a pessoa vai ver depois,
 * em escala reduzida. Conteúdo ilustrativo, mas com a linguagem real do NERO.
 */

function Cartao({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.cartao, style]}>{children}</View>;
}

function Ponto({ nivel }: { nivel: keyof typeof Alerta }) {
  return <View style={[styles.ponto, { backgroundColor: Alerta[nivel].fg }]} />;
}

/** Slide 1 — tudo em um lugar: três registros de módulos diferentes empilhados. */
export function MiniaturaTudoEmUmLugar() {
  return (
    <View style={styles.pilha}>
      <Cartao style={{ transform: [{ rotate: '-2deg' }], marginRight: 28 }}>
        <View style={styles.linha}><Ionicons name="heart-outline" size={16} color={Colors.logoAco} /><Text style={styles.rotulo}>Pressão arterial</Text></View>
        <Text style={styles.valor}>128<Text style={styles.unidade}>/78 mmHg</Text></Text>
        <Text style={styles.meta}>Média da manhã, hoje</Text>
      </Cartao>
      <Cartao style={{ marginLeft: 28, marginTop: -6 }}>
        <View style={styles.linha}><Ponto nivel="verde" /><Text style={styles.rotulo}>Mamografia</Text></View>
        <Text style={styles.valorPequeno}>Rastreamento em dia</Text>
        <Text style={styles.meta}>Próxima prevista: setembro de 2027</Text>
      </Cartao>
      <Cartao style={{ transform: [{ rotate: '1.5deg' }], marginRight: 40, marginTop: -6 }}>
        <View style={styles.linha}><Ionicons name="moon-outline" size={16} color={Colors.logoAco} /><Text style={styles.rotulo}>Sono</Text></View>
        <Text style={styles.valor}>7h12<Text style={styles.unidade}> por noite</Text></Text>
        <Text style={styles.meta}>Média dos últimos 7 dias</Text>
      </Cartao>
    </View>
  );
}

/** Slide 2 — cadastre uma vez: um dado do perfil alimentando três módulos. */
export function MiniaturaUmaVez() {
  const destinos = [
    { icone: 'heart-outline' as const, texto: 'Risco cardiovascular' },
    { icone: 'search-outline' as const, texto: 'Rastreamento de pulmão' },
    { icone: 'document-text-outline' as const, texto: 'Relatório para o médico' },
  ];
  return (
    <View style={{ alignItems: 'center' }}>
      <Cartao style={styles.origem}>
        <Text style={styles.rotulo}>Seu perfil</Text>
        <Text style={styles.valorPequeno}>Parou de fumar em 2020</Text>
        <Text style={styles.meta}>20 cigarros por dia durante 30 anos</Text>
      </Cartao>
      <View style={styles.tronco} />
      <View style={styles.ramos}>
        {destinos.map((d) => (
          <View key={d.texto} style={styles.ramo}>
            <View style={styles.galho} />
            <View style={styles.destino}>
              <Ionicons name={d.icone} size={14} color={Colors.logoCiano} />
              <Text style={styles.destinoTexto}>{d.texto}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Slide 3 — orientação, não diagnóstico: um alerta com a conduta certa. */
export function MiniaturaOrientacao() {
  return (
    <View style={{ gap: Spacing.sm }}>
      <Cartao>
        <View style={styles.linha}><Ponto nivel="laranja" /><Text style={styles.rotulo}>Colorretal</Text></View>
        <Text style={styles.valorPequeno}>Este resultado precisa de avaliação</Text>
        <Text style={styles.meta}>Um teste positivo não significa câncer, mas pede investigação. Procure seu médico.</Text>
      </Cartao>
      <View style={styles.acao}>
        <Ionicons name="document-text-outline" size={16} color={Colors.hero} />
        <Text style={styles.acaoTexto}>Preparar minha consulta</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pilha: { gap: 0 },
  cartao: { backgroundColor: Colors.surface, borderRadius: Radius.linha + 2, padding: Spacing.lg, gap: 2, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
  ponto: { width: 9, height: 9, borderRadius: 5 },
  rotulo: { ...Typography.caption, fontFamily: 'Poppins-SemiBold', color: Colors.textSecondary },
  valor: { fontFamily: 'Poppins-ExtraBold', fontSize: 26, lineHeight: 30, color: Colors.textPrimary },
  unidade: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: Colors.textSecondary },
  valorPequeno: { ...Typography.subheading, color: Colors.textPrimary },
  meta: { ...Typography.caption, color: Colors.textSecondary },
  origem: { alignSelf: 'stretch' },
  tronco: { width: 2, height: 22, backgroundColor: Colors.logoCiano, opacity: 0.7 },
  ramos: { alignSelf: 'stretch', gap: Spacing.sm },
  ramo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  galho: { width: 18, height: 2, backgroundColor: Colors.logoCiano, opacity: 0.7, marginLeft: Spacing.xxl },
  destino: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: Radius.linha, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  destinoTexto: { ...Typography.subheading, color: Colors.white },
  acao: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.logoCiano, borderRadius: Radius.pill, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  acaoTexto: { ...Typography.subheading, color: Colors.hero },
});
