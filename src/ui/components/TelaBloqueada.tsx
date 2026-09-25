import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@ui/components/Button';
import { Input } from '@ui/components/Input';
import { LogoNero } from '@ui/components/LogoNero';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

interface Props {
  onTentar: () => void;
  /** Ligado quando o sistema biométrico falhou: aí o caminho é a senha, não tentar o rosto de novo. */
  exigeSenha: boolean;
  /** Devolve falso quando a senha não confere. */
  onSenha: (senha: string) => Promise<boolean>;
}

/**
 * Cobre o app inteiro enquanto o desbloqueio não acontece (D-032).
 *
 * Mostra só a marca, sem nenhum dado: a tela existe justamente para que quem pegou o celular de
 * outra pessoa não veja nada. Nem nome, nem pendência, nem o número da sequência.
 *
 * Dois caminhos de saída. O normal é a biometria, e o botão existe porque a caixa do sistema pode
 * ser cancelada por engano. Quando o sistema biométrico **falha** (decisão do Murilo em 24/09), a
 * tela pede a senha da conta: insistir no rosto não resolveria, e liberar sem nada seria abrir o
 * prontuário para quem estiver com o aparelho.
 */
export function TelaBloqueada({ onTentar, exigeSenha, onSenha }: Props) {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [conferindo, setConferindo] = useState(false);

  const enviar = async () => {
    if (!senha) return;
    setConferindo(true);
    setErro(null);
    const ok = await onSenha(senha);
    setConferindo(false);
    if (!ok) { setErro('Senha incorreta.'); setSenha(''); }
  };

  return (
    <KeyboardAvoidingView style={styles.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LogoNero variante="simbolo" width={64} />
      <Text style={styles.titulo}>NERO bloqueado</Text>

      {exigeSenha ? (
        <>
          <Text style={styles.texto}>Não foi possível usar a biometria neste aparelho. Entre com a senha da sua conta.</Text>
          <View style={styles.campo}>
            <Input
              value={senha}
              onChangeText={setSenha}
              placeholder="Sua senha"
              secureTextEntry
              autoCapitalize="none"
              autoFocus
              onSubmitEditing={enviar}
              returnKeyType="go"
            />
            {erro ? <Text style={styles.erro}>{erro}</Text> : null}
            <Button label="Entrar" onPress={enviar} loading={conferindo} style={{ marginTop: Spacing.md }} />
            <Pressable onPress={onTentar} accessibilityRole="button" hitSlop={8} style={styles.alternativa}>
              <Text style={styles.alternativaLabel}>Tentar a biometria de novo</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.texto}>Suas informações de saúde estão protegidas neste aparelho.</Text>
          <Pressable onPress={onTentar} accessibilityRole="button" style={({ pressed }) => [styles.botao, pressed && { opacity: 0.8 }]}>
            <Ionicons name="lock-open-outline" size={18} color={Colors.white} />
            <Text style={styles.botaoLabel}>Desbloquear</Text>
          </Pressable>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.md },
  titulo: { ...Typography.title, color: Colors.textPrimary, marginTop: Spacing.sm },
  texto: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  campo: { alignSelf: 'stretch', maxWidth: 420, width: '100%', marginTop: Spacing.md },
  erro: { ...Typography.caption, color: Colors.danger, marginTop: Spacing.xs },
  botao: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.linha, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, marginTop: Spacing.lg },
  botaoLabel: { ...Typography.subheading, color: Colors.white },
  alternativa: { alignSelf: 'center', paddingVertical: Spacing.md },
  alternativaLabel: { ...Typography.caption, fontFamily: 'Poppins-SemiBold', color: Colors.accent },
});
