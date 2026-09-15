import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Colors, Input, Radius, Spacing, Typography } from '@ui/index';

export interface ItemTexto { texto: string; ano?: number }

interface Props {
  itens: ItemTexto[];
  onChange: (itens: ItemTexto[]) => void;
  placeholder: string;
  comAno?: boolean;
}

/** Lista editável de textos curtos (histórico de câncer, lesões, doenças genéticas). */
export function ListaTexto({ itens, onChange, placeholder, comAno }: Props) {
  const [texto, setTexto] = useState('');
  const [ano, setAno] = useState('');

  const adicionar = () => {
    const t = texto.trim();
    if (!t) return;
    onChange([...itens, { texto: t, ano: comAno && ano ? Number(ano) : undefined }]);
    setTexto('');
    setAno('');
  };

  return (
    <View style={{ gap: Spacing.sm }}>
      {itens.map((it, i) => (
        <View key={`${it.texto}-${i}`} style={styles.item}>
          <Text style={styles.texto}>{it.texto}{it.ano ? ` (${it.ano})` : ''}</Text>
          <Pressable onPress={() => onChange(itens.filter((_, j) => j !== i))} hitSlop={8} accessibilityLabel={`Remover ${it.texto}`}>
            <Ionicons name="close-circle" size={22} color={Colors.textMuted} />
          </Pressable>
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <Input style={{ flex: 1 }} placeholder={placeholder} value={texto} onChangeText={setTexto} onSubmitEditing={adicionar} />
        {comAno ? <Input style={{ width: 96 }} placeholder="Ano" keyboardType="number-pad" maxLength={4} value={ano} onChangeText={setAno} /> : null}
      </View>
      <Button label="Adicionar" variant="outline" onPress={adicionar} disabled={!texto.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.background, borderRadius: Radius.linha, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  texto: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
});
