import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button } from '@ui/components/Button';
import { Colors, Radius, Shadows, Spacing, Typography } from '@ui/theme';

interface Props {
  visivel: boolean;
  aoAtivar: () => void;
  aoAdiar: () => void;
  /**
   * `ajustes`: a pessoa negou no iOS, que não deixa perguntar de novo (D-043). O botão leva aos
   * Ajustes em vez de abrir a caixa do sistema.
   */
  modo?: 'pedir' | 'ajustes';
}

const ITENS = [
  { icone: 'shield-checkmark-outline', texto: 'Quando um exame de rastreamento estiver chegando na data' },
  { icone: 'medkit-outline', texto: 'Nos horários dos seus medicamentos' },
  { icone: 'calendar-outline', texto: 'Um dia antes das suas consultas' },
] as const;

/**
 * Explica o que o NERO avisa ANTES de pedir a permissão ao sistema. No iOS, negar é quase
 * definitivo — o app não pode perguntar de novo e a pessoa teria que ir nos Ajustes. Perguntar sem
 * contexto faz muita gente negar, e quem nega perde os lembretes de rastreamento.
 * "Agora não" não queima a permissão: o app volta a oferecer depois.
 */
export function ModalAtivarAvisos({ visivel, aoAtivar, aoAdiar, modo = 'pedir' }: Props) {
  if (modo === 'ajustes') return <ModalAjustes visivel={visivel} aoAbrir={aoAtivar} aoAdiar={aoAdiar} />;
  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoAdiar}>
      <View style={styles.fundo}>
        <View style={styles.caixa}>
          <View style={styles.sino}><Ionicons name="notifications-outline" size={28} color={Colors.primary} /></View>
          <Text style={styles.titulo}>Posso te avisar na hora certa?</Text>
          <Text style={styles.sub}>Os avisos do NERO servem para você não perder o que tem data:</Text>
          <View style={styles.itens}>
            {ITENS.map((i) => (
              <View key={i.texto} style={styles.item}>
                <Ionicons name={i.icone} size={18} color={Colors.primary} />
                <Text style={styles.itemTexto}>{i.texto}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.nota}>Você escolhe quais avisos quer receber, e pode desligar todos a qualquer momento em Minha Saúde.</Text>
          <Button label="Ativar avisos" onPress={aoAtivar} style={styles.botao} />
          <Button label="Agora não" variant="ghost" onPress={aoAdiar} />
        </View>
      </View>
    </Modal>
  );
}

function ModalAjustes({ visivel, aoAbrir, aoAdiar }: { visivel: boolean; aoAbrir: () => void; aoAdiar: () => void }) {
  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoAdiar}>
      <View style={styles.fundo}>
        <View style={styles.caixa}>
          <View style={styles.sino}><Ionicons name="notifications-off-outline" size={28} color={Colors.primary} /></View>
          <Text style={styles.titulo}>Seus avisos estão desligados</Text>
          <Text style={styles.sub}>Para receber este lembrete, ligue as notificações do NERO nos Ajustes do iPhone. É só tocar no botão e ativar "Permitir Notificações".</Text>
          <Button label="Abrir Ajustes" onPress={aoAbrir} style={styles.botao} />
          <Button label="Agora não" variant="ghost" onPress={aoAdiar} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(11, 30, 68, 0.55)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  caixa: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.xxl, gap: Spacing.sm, maxWidth: 420, width: '100%', ...Shadows.card },
  sino: { alignSelf: 'center', marginBottom: Spacing.xs },
  titulo: { ...Typography.heading, color: Colors.textPrimary, textAlign: 'center' },
  sub: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  itens: { gap: Spacing.sm, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  itemTexto: { ...Typography.body, color: Colors.textPrimary, flexShrink: 1 },
  nota: { ...Typography.caption, color: Colors.textSecondary },
  botao: { marginTop: Spacing.lg },
});
