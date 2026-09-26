import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, KeyboardAvoidingView, PanResponder, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { estadoPermissao, pedirPermissaoNotificacoes } from '@core/lembretes/permissao';
import { marcarAdiado } from '@core/lembretes/useAvisos';
import { ONBOARDING_KEY } from '@core/onboarding/chave';
import { apagarNome, guardarNome } from '@core/onboarding/nomeGuardado';
import { falaComNome, PERGUNTA_AVISOS, ROTEIRO } from '@core/onboarding/roteiro';
import { CenaNero, CeuOnboarding } from '@modules/onboarding/CenaNero';
import { DemoLembrete } from '@modules/onboarding/demos/DemoLembrete';
import { DemoPressao } from '@modules/onboarding/demos/DemoPressao';
import { DemoRelatorio } from '@modules/onboarding/demos/DemoRelatorio';
import { FalaNero } from '@modules/onboarding/FalaNero';
import { Button, Colors, Radius, Spacing, Typography } from '@ui/index';

/**
 * Onboarding em que o Nero fala (D-063; spec `docs/superpowers/specs/2026-09-26-nero-onboarding-nero-fala-design.md`).
 * Substitui os três slides da D-033. Esta tela só conduz: passo atual, pontinhos, "Pular", voltar e as
 * saídas. As falas estão em `ROTEIRO`; a fala, a cena e as demonstrações são peças próprias.
 *
 * Ninguém avança sozinho: o botão aparece quando a fala termina, e tocar na tela completa a fala.
 */
export default function Onboarding() {
  const router = useRouter();
  const [indice, setIndice] = useState(0);
  const [nome, setNome] = useState('');
  const [completar, setCompletar] = useState(0);
  const [falaPronta, setFalaPronta] = useState(false);
  const [demoPronta, setDemoPronta] = useState(false);
  const [perguntaPronta, setPerguntaPronta] = useState(false);
  // Tela 6: só pergunta se o iOS ainda não tem resposta (a chance de pedir é uma só).
  const [podePerguntar, setPodePerguntar] = useState<boolean | null>(null);
  const passo = ROTEIRO[indice];
  // Com o teclado aberto (tela do nome), o Nero encolhe: num iPhone pequeno, grande ele empurraria o botão.
  const [tecladoAberto, setTecladoAberto] = useState(false);
  useEffect(() => {
    const abrir = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setTecladoAberto(true));
    const fechar = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setTecladoAberto(false));
    return () => { abrir.remove(); fechar.remove(); };
  }, []);
  const ultimo = indice === ROTEIRO.length - 1;

  useEffect(() => {
    setFalaPronta(false); setDemoPronta(false); setPerguntaPronta(false); setCompletar(0);
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

  const nomeFala = nomeValido ? nome : null;
  const temDemo = passo.id === 'pressao' || passo.id === 'relatorio' || passo.id === 'lembrete';
  const mostrarPergunta = passo.id === 'lembrete' && podePerguntar === true && falaPronta && demoPronta;

  const rodape = () => {
    if (!falaPronta) return null;
    if (passo.id === 'nome') {
      return (
        <>
          <Button label={passo.botao} onPress={continuarNome} disabled={!nomeValido} />
          <Pressable onPress={semNome} hitSlop={8} accessibilityRole="button"><Text style={styles.link}>Prefiro não dizer</Text></Pressable>
        </>
      );
    }
    if (passo.id === 'lembrete' && podePerguntar === true) {
      if (!perguntaPronta) return null;
      return (
        <>
          <Button label="Sim, pode me avisar" onPress={() => responderAvisos(true)} />
          <Pressable onPress={() => responderAvisos(false)} hitSlop={8} accessibilityRole="button"><Text style={styles.link}>Agora não</Text></Pressable>
        </>
      );
    }
    if (passo.id === 'lembrete' && podePerguntar === null) return null;
    if (ultimo) {
      return (
        <>
          <Button label={passo.botao} onPress={() => sair('/(auth)/cadastro')} />
          <Pressable onPress={() => sair('/(auth)/login')} hitSlop={8} accessibilityRole="button"><Text style={styles.link}>Já tenho conta</Text></Pressable>
        </>
      );
    }
    return <Button label={passo.botao} onPress={avancar} />;
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
          <FalaNero key={`fala-${indice}`} linhaPequena={passo.linhaPequena} fala={falaComNome(passo.fala, nomeFala)} onTerminou={() => setFalaPronta(true)} completar={completar} />
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
          {temDemo ? (
            <View style={styles.demo}>
              {passo.id === 'pressao' ? <DemoPressao onTerminou={() => setDemoPronta(true)} /> : null}
              {passo.id === 'relatorio' ? <DemoRelatorio onTerminou={() => setDemoPronta(true)} /> : null}
              {passo.id === 'lembrete' ? <DemoLembrete onTerminou={() => setDemoPronta(true)} /> : null}
            </View>
          ) : null}
          {mostrarPergunta ? (
            <View style={styles.pergunta}>
              <FalaNero key="pergunta" fala={PERGUNTA_AVISOS} onTerminou={() => setPerguntaPronta(true)} completar={completar} />
            </View>
          ) : null}
        </Pressable>

        <View style={styles.baixo}>
          <CenaNero clipe={passo.clipe} tamanho={tecladoAberto ? 'pequeno' : passo.nero} />
          <Rodape>{rodape()}</Rodape>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** O rodapé entra deslizando de baixo quando a fala termina. */
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
  palco: { flex: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl, gap: Spacing.xl },
  campoNome: { fontFamily: 'Poppins-SemiBold', fontSize: 30, color: Colors.primary, borderBottomWidth: 2, borderBottomColor: Colors.accent, paddingVertical: Spacing.sm },
  demo: { marginTop: Spacing.sm },
  pergunta: { marginTop: Spacing.xs },
  baixo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.md },
  rodape: { gap: Spacing.md, alignItems: 'stretch', minHeight: 54, marginTop: Spacing.md },
  link: { ...Typography.subheading, color: Colors.textSecondary, textAlign: 'center' },
});
