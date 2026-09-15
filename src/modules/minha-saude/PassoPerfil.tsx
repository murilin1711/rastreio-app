import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Colors, ProgressBar, Spacing, Typography } from '@ui/index';

interface Props {
  passo: number;
  total: number;
  titulo: string;
  ajuda?: string;
  podeAvancar: boolean;
  ultimo?: boolean;
  podePular?: boolean;
  salvando?: boolean;
  onAvancar: () => void;
  onVoltar?: () => void;
  onPular?: () => void;
  children: React.ReactNode;
}

/** Moldura de um passo do perfil inicial: progresso, pergunta, conteúdo e navegação. */
export function PassoPerfil({ passo, total, titulo, ajuda, podeAvancar, ultimo, podePular, salvando, onAvancar, onVoltar, onPular, children }: Props) {
  return (
    <SafeAreaView style={styles.tela}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.topo}>
          <ProgressBar value={Math.round((passo / total) * 100)} label={`${passo} de ${total}`} />
        </View>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <Text style={styles.titulo}>{titulo}</Text>
          {ajuda ? <Text style={styles.ajuda}>{ajuda}</Text> : null}
          <View style={{ marginTop: Spacing.xxl }}>{children}</View>
        </ScrollView>
        <View style={styles.rodape}>
          {onVoltar ? <Button label="Voltar" variant="ghost" onPress={onVoltar} /> : <View />}
          <View style={styles.acoes}>
            {podePular && onPular ? <Button label="Pular" variant="outline" onPress={onPular} /> : null}
            <Button label={ultimo ? 'Concluir' : 'Continuar'} onPress={onAvancar} disabled={!podeAvancar} loading={salvando} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  topo: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.md },
  conteudo: { padding: Spacing.xxl },
  titulo: { ...Typography.display, fontSize: 26, lineHeight: 32, color: Colors.primary },
  ajuda: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.sm },
  rodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg },
  acoes: { flexDirection: 'row', gap: Spacing.sm },
});
