import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

interface Props {
  valor: string | null;
  onChange: (iso: string | null) => void;
  rotulo?: string;
  /** Permite datas futuras (padrão: não). */
  futuro?: boolean;
}

/** Três campos DD / MM / AAAA. Emite ISO 'AAAA-MM-DD' quando completo e válido; null caso contrário. */
export function CampoData({ valor, onChange, rotulo, futuro = false }: Props) {
  const [d, setD] = useState(valor?.slice(8, 10) ?? '');
  const [m, setM] = useState(valor?.slice(5, 7) ?? '');
  const [a, setA] = useState(valor?.slice(0, 4) ?? '');
  const refM = useRef<TextInput>(null);
  const refA = useRef<TextInput>(null);

  const emitir = (dd: string, mm: string, aa: string) => {
    if (dd.length === 2 && mm.length === 2 && aa.length === 4) {
      const iso = `${aa}-${mm}-${dd}`;
      const dt = new Date(`${iso}T00:00:00Z`);
      const existe = !isNaN(dt.getTime()) && dt.toISOString().slice(0, 10) === iso;
      const noPassado = futuro || dt.getTime() <= Date.now();
      onChange(existe && noPassado ? iso : null);
    } else {
      onChange(null);
    }
  };

  const soDigitos = (v: string) => v.replace(/\D/g, '');

  return (
    <View>
      {rotulo ? <Text style={styles.rotulo}>{rotulo}</Text> : null}
      <View style={styles.linha}>
        <TextInput
          style={styles.campo} placeholder="DD" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" maxLength={2} value={d}
          onChangeText={(v) => { const x = soDigitos(v); setD(x); emitir(x, m, a); if (x.length === 2) refM.current?.focus(); }}
          accessibilityLabel="Dia"
        />
        <Text style={styles.sep}>/</Text>
        <TextInput
          ref={refM} style={styles.campo} placeholder="MM" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" maxLength={2} value={m}
          onChangeText={(v) => { const x = soDigitos(v); setM(x); emitir(d, x, a); if (x.length === 2) refA.current?.focus(); }}
          accessibilityLabel="Mês"
        />
        <Text style={styles.sep}>/</Text>
        <TextInput
          ref={refA} style={[styles.campo, { flex: 1.7 }]} placeholder="AAAA" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" maxLength={4} value={a}
          onChangeText={(v) => { const x = soDigitos(v); setA(x); emitir(d, m, x); }}
          accessibilityLabel="Ano"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginBottom: Spacing.sm },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  campo: { flex: 1, minHeight: 50, ...Typography.body, color: Colors.textPrimary, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.linha, paddingHorizontal: Spacing.md, textAlign: 'center' },
  sep: { ...Typography.title, color: Colors.textMuted },
});
