import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

export interface Opcao<T extends string> {
  valor: T;
  rotulo: string;
  descricao?: string;
}

interface Props<T extends string> {
  opcoes: Opcao<T>[];
  valor: T | T[] | null;
  onChange: (v: T) => void;
  multiplo?: boolean;
}

/** Grupo de opções em blocos tocáveis — escolha única (rádio) ou múltipla (caixas). */
export function Opcoes<T extends string>({ opcoes, valor, onChange, multiplo }: Props<T>) {
  const selecionado = (v: T) => (Array.isArray(valor) ? valor.includes(v) : valor === v);
  return (
    <View style={styles.grupo}>
      {opcoes.map((o) => {
        const ativo = selecionado(o.valor);
        return (
          <Pressable
            key={o.valor}
            onPress={() => onChange(o.valor)}
            style={[styles.item, ativo && styles.ativo]}
            accessibilityRole={multiplo ? 'checkbox' : 'radio'}
            accessibilityState={{ checked: ativo }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.rotulo, ativo && styles.rotuloAtivo]}>{o.rotulo}</Text>
              {o.descricao ? <Text style={styles.descricao}>{o.descricao}</Text> : null}
            </View>
            <Ionicons
              name={multiplo ? (ativo ? 'checkbox' : 'square-outline') : ativo ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={ativo ? Colors.primary : Colors.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: Spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.linha, padding: Spacing.lg },
  ativo: { borderColor: Colors.primary, backgroundColor: '#EEF3FA' },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary },
  rotuloAtivo: { color: Colors.primary },
  descricao: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
});
