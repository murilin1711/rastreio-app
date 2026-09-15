import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';
import type { Opcao } from './Opcoes';

interface Props<T extends string> {
  opcoes: Opcao<T>[];
  valor: T | null;
  onChange: (v: T) => void;
  placeholder?: string;
}

/** Campo de seleção que abre uma folha inferior com as opções. */
export function Select<T extends string>({ opcoes, valor, onChange, placeholder = 'Selecione' }: Props<T>) {
  const [aberto, setAberto] = useState(false);
  const atual = opcoes.find((o) => o.valor === valor);
  return (
    <>
      <Pressable onPress={() => setAberto(true)} style={styles.campo} accessibilityRole="button" accessibilityLabel={placeholder}>
        <Text style={[styles.texto, !atual && { color: Colors.textMuted }]}>{atual?.rotulo ?? placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
      </Pressable>
      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable style={styles.fundo} onPress={() => setAberto(false)}>
          <View style={styles.folha}>
            <Text style={styles.titulo}>{placeholder}</Text>
            <FlatList
              data={opcoes}
              keyExtractor={(o) => o.valor}
              renderItem={({ item }) => {
                const ativo = item.valor === valor;
                return (
                  <Pressable style={styles.opcao} onPress={() => { onChange(item.valor); setAberto(false); }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.texto, ativo && styles.textoAtivo]}>{item.rotulo}</Text>
                      {item.descricao ? <Text style={styles.descricao}>{item.descricao}</Text> : null}
                    </View>
                    {ativo ? <Ionicons name="checkmark" size={20} color={Colors.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  campo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 50, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.linha, paddingHorizontal: Spacing.lg },
  texto: { ...Typography.body, color: Colors.textPrimary },
  textoAtivo: { fontFamily: 'Poppins-SemiBold', color: Colors.primary },
  descricao: { ...Typography.caption, color: Colors.textSecondary },
  fundo: { flex: 1, backgroundColor: 'rgba(15,45,99,0.35)', justifyContent: 'flex-end' },
  folha: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.bloco, borderTopRightRadius: Radius.bloco, maxHeight: '65%', paddingTop: Spacing.lg, paddingBottom: Spacing.xxxl },
  titulo: { ...Typography.heading, color: Colors.textPrimary, paddingHorizontal: Spacing.xxl, marginBottom: Spacing.sm },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl },
});
