import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, KeyboardAvoidingView, PanResponder, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { estadoPermissao, pedirPermissaoNotificacoes } from '@core/lembretes/permissao';
import { marcarAdiado } from '@core/lembretes/useAvisos';
import { ONBOARDING_KEY } from '@core/onboarding/chave';
import { apagarNome, guardarNome } from '@core/onboarding/nomeGuardado';
import { PERGUNTA_AVISOS, ROTEIRO } from '@core/onboarding/roteiro';
import { CenaNero, CeuOnboarding } from '@modules/onboarding/CenaNero';
import { Conversa } from '@modules/onboarding/Conversa';
import { DemoLembrete } from '@modules/onboarding/demos/DemoLembrete';
import { DemoPressao } from '@modules/onboarding/demos/DemoPressao';
import { DemoRelatorio } from '@modules/onboarding/demos/DemoRelatorio';
import { FalaNero } from '@modules/onboarding/FalaNero';
import { Colors, Radius, Spacing, Typography } from '@ui/index';

/**
 * Onboarding em que o Nero fala (D-063; spec `docs/superpowers/specs/2026-09-26-nero-onboarding-nero-fala-design.md`).
 * Esta tela só conduz: passo atual, pontinhos, "Pular", voltar e as saídas. As falas estão em `ROTEIRO`;
 * a conversa, a cena e as demonstrações são peças próprias.
 *
 * Dois padrões (ajuste do Murilo, 26/09): no 1 (conversas), o Nero grande no meio da tela e o botão em
 * pílula embaixo, como na referência do Gentler Streak; no 2 (demonstrações), o conteúdo em cima e o Nero
 * médio logo abaixo. Ninguém avança sozinho: o botão aparece quando a conversa termina.
 */
export default function Onboarding() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  // Só em desenvolvimento: `/onboarding?passo=relatorio` abre direto numa tela, para conferir sem percorrer tudo.
  const { passo: passoInicial } = useLocalSearchParams<{ passo?: string }>();
  const [indice, setIndice] = useState(() => (__DEV__ ? Math.max(0, ROTEIRO.findIndex((p) => p.id === passoInicial)) : 0));
  const [nome, setNome] = useState('');
  const [completar, setCompletar] = useState(0);
  const [conversaPronta, setConversaPronta] = useState(false);
  const [cartoes, setCartoes] = useState<string[]>([]);
  const [perguntaPronta, setPerguntaPronta] = useState(false);
  // Tela 6: só pergunta se o iOS ainda não tem resposta (a chance de pedir é uma só).
  const [podePerguntar, setPodePerguntar] = useState<boolean | null>(null);
  const passo = ROTEIRO[indice];
  const ultimo = indice === ROTEIRO.length - 1;

  // Com o teclado aberto (tela do nome), o Nero encolhe: num iPhone pequeno, grande ele empurraria o botão.
  const [tecladoAberto, setTecladoAberto] = useState(false);
  useEffect(() => {
    const abrir = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setTecladoAberto(true));
    const fechar = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setTecladoAberto(false));
    return () => { abrir.remove(); fechar.remove(); };
  }, []);

  useEffect(() => {
    setConversaPronta(false); setPerguntaPronta(false); setCartoes([]); setCompletar(0);
    if (passo.id === 'lembrete') estadoPermissao().then((e) => setPodePerguntar(e === 'perguntar')).catch(() => setPodePerguntar(false));
  }, [indice, passo.id]);

  const avancar = () => setIndice((i) => Math.min(i + 1, ROTEIRO.length - 1));
  const voltar = () => setIndice((i) => Math.max(i - 1, 0));
  const sair = async (destino: '/(auth)/cadastro' | '/(auth)/login') => {
    try { await AsyncStorage.setItem(ONBOARDING_KEY, 'true'); } catch { /* segue */ }
    router.replace(destino);
  };

  // Voltar arrastando para a direita (PanResponder: funciona sem configurar o gesture-handler).
  const indiceAtual = useRef(indice);
  indiceAtual.current = indice;
  const arrastar = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => g.dx > 20 && Math.abs(g.dy) < 20 && indiceAtual.current > 0,
    onPanResponderRelease: (_e, g) => { if (g.dx > 80) voltar(); },
  })).current;

  const nomeValido = nome.trim().length >= 2;
  const continuarNome = async () => { if (!nomeValido) return; await guardarNome(nome); avancar(); };
  const semNome = async () => { await apagarNome(); setNome(''); avancar(); };
  const responderAvisos = async (sim: boolean) => {
    if (sim) await pedirPermissaoNotificacoes().catch(() => false);
    else await marcarAdiado();
    avancar();
  };

  const mostrarPergunta = passo.id === 'lembrete' && podePerguntar === true && conversaPronta;
  // Padrão 2: o Nero maior que antes (pedido do Murilo), limitado ao espaço que sobra embaixo do conteúdo.
  const [espacoBaixo, setEspacoBaixo] = useState(0);
  const tamanhoNero = tecladoAberto ? 110 : passo.padrao === 1 ? Math.min(290, Math.round(height * 0.34)) : Math.max(100, Math.min(220, espacoBaixo - 8));

  const rodape = () => {
    if (!conversaPronta) return null;
    if (passo.id === 'nome') {
      return (
        <>
          <Pilula rotulo={passo.botao} onPress={continuarNome} desativado={!nomeValido} />
          <Link rotulo="Prefiro não dizer" onPress={semNome} />
        </>
      );
    }
    if (passo.id === 'lembrete' && podePerguntar === null) return null;
    if (passo.id === 'lembrete' && podePerguntar) {
      if (!perguntaPronta) return null;
      return (
        <>
          <Pilula rotulo="Sim, pode me avisar" onPress={() => responderAvisos(true)} />
          <Link rotulo="Agora não" onPress={() => responderAvisos(false)} />
        </>
      );
    }
    if (ultimo) {
      return (
        <>
          <Pilula rotulo={passo.botao} onPress={() => sair('/(auth)/cadastro')} />
          <Link rotulo="Já tenho conta" onPress={() => sair('/(auth)/login')} />
        </>
      );
    }
    return <Pilula rotulo={passo.botao} onPress={avancar} />;
  };

  return (
    <SafeAreaView style={styles.tela} {...arrastar.panHandlers}>
      <StatusBar style="dark" />
      <CeuOnboarding />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.corpo}>
        <View style={styles.topo}>
          <View style={styles.lado}>
            {indice > 0 ? (
              <Pressable onPress={voltar} hitSlop={12} accessibilityRole="button" accessibilityLabel="Voltar">
                <Ionicons name="chevron-back" size={24} color={Colors.primary} />
                <Text style={styles.oculto}>Voltar</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.pontos}>
            {ROTEIRO.map((p, i) => <View key={p.id} style={[styles.ponto, i === indice && styles.pontoAtual, i < indice && styles.pontoFeito]} />)}
          </View>
          <View style={[styles.lado, { alignItems: 'flex-end' }]}>
            {!ultimo ? (
              <Pressable onPress={() => sair('/(auth)/cadastro')} hitSlop={12} accessibilityRole="button">
                <Text style={styles.pular}>Pular</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Tocar em qualquer ponto completa a fala; o botão continua sendo o único jeito de avançar. */}
        <Pressable style={styles.palco} onPress={() => setCompletar((c) => c + 1)} accessible={false}>
          <View style={styles.conteudo}>
            {mostrarPergunta ? (
              <FalaNero key="pergunta" fala={PERGUNTA_AVISOS} onTerminou={() => setPerguntaPronta(true)} completar={completar} />
            ) : (
              <Conversa
                key={`conversa-${indice}`}
                falas={passo.falas}
                nome={nomeValido ? nome : null}
                atrasoInicialMs={passo.atrasoInicialMs}
                completar={completar}
                onMarco={(c) => setCartoes((l) => (l.includes(c) ? l : [...l, c]))}
                onTerminou={() => setConversaPronta(true)}
              />
            )}
            {passo.id === 'nome' ? (
              <TextInput
                value={nome}
                onChangeText={setNome}
                placeholder="Seu nome"
                placeholderTextColor={Colors.textMuted}
                autoFocus
                autoComplete="name"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={continuarNome}
                style={styles.campoNome}
                accessibilityLabel="Seu nome"
              />
            ) : null}
            {/* Tela 4: os cartões só depois da fala (fala e cartão juntos confundiam). */}
            {passo.id === 'pressao' && conversaPronta ? <DemoPressao /> : null}
            {passo.id === 'relatorio' ? <DemoRelatorio visiveis={cartoes} juntar={conversaPronta} /> : null}
            {passo.id === 'lembrete' ? <DemoLembrete visiveis={cartoes} /> : null}
          </View>
          <View style={passo.padrao === 1 ? styles.neroMeio : styles.neroBaixo} onLayout={(e) => setEspacoBaixo(e.nativeEvent.layout.height)}>
            <CenaNero clipe={passo.clipe} entrada={passo.entrada} pausaMs={passo.pausaClipeMs} tamanho={tamanhoNero} />
          </View>
        </Pressable>

        <Rodape>{rodape()}</Rodape>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Botão em pílula da referência (Gentler Streak), no azul e na fonte do NERO. */
function Pilula({ rotulo, onPress, desativado = false }: { rotulo: string; onPress: () => void; desativado?: boolean }) {
  return (
    <Pressable onPress={desativado ? undefined : onPress} disabled={desativado} accessibilityRole="button" accessibilityState={{ disabled: desativado }}
      style={({ pressed }) => [styles.pilula, desativado && styles.pilulaDesativada, pressed && { transform: [{ scale: 0.98 }] }]}>
      <Text style={styles.pilulaTexto}>{rotulo}</Text>
    </Pressable>
  );
}

function Link({ rotulo, onPress }: { rotulo: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button">
      <Text style={styles.link}>{rotulo}</Text>
    </Pressable>
  );
}

/** O rodapé entra deslizando de baixo quando a conversa termina; o espaço fica reservado para nada pular. */
function Rodape({ children }: { children: React.ReactNode }) {
  const entrada = useRef(new Animated.Value(0)).current;
  const visivel = !!children;
  useEffect(() => {
    entrada.setValue(0);
    if (visivel) Animated.timing(entrada, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [visivel, entrada]);
  return (
    <Animated.View style={[styles.rodape, { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  corpo: { flex: 1 },
  topo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xxl, height: 48 },
  lado: { width: 64 },
  oculto: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  pontos: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  ponto: { width: 7, height: 7, borderRadius: Radius.pill, backgroundColor: Colors.border },
  pontoAtual: { width: 20, backgroundColor: Colors.logoCeu },
  pontoFeito: { backgroundColor: Colors.accent },
  pular: { ...Typography.subheading, color: Colors.textSecondary },
  palco: { flex: 1 },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl, gap: Spacing.lg },
  campoNome: { fontFamily: 'Poppins-SemiBold', fontSize: 30, color: Colors.primary, borderBottomWidth: 2, borderBottomColor: Colors.accent, paddingVertical: Spacing.sm },
  // Padrão 1: o Nero no meio do espaço entre a fala e o botão. Padrão 2: logo abaixo do conteúdo, no fim.
  neroMeio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: Spacing.xxl },
  neroBaixo: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  rodape: { alignItems: 'center', gap: Spacing.md, minHeight: 104, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  pilula: {
    minWidth: 230, height: 62, paddingHorizontal: Spacing.xxxl, borderRadius: Radius.pill, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 18, elevation: 6,
  },
  pilulaDesativada: { opacity: 0.4 },
  pilulaTexto: { fontFamily: 'Poppins-SemiBold', fontSize: 18, color: Colors.white },
  link: { ...Typography.subheading, color: Colors.textSecondary, textAlign: 'center' },
});
