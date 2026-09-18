import { StyleSheet, Text, View } from 'react-native';
import { media } from '@core/regras/cardio/pressao';
import type { MedidaPA, PeriodoMrpa } from '@core/regras/cardio/tipos';
import { Button } from '@ui/components/Button';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';
import { horaLocal } from './formato';
import { LeituraPA } from './LeituraPA';

interface Props { periodo: PeriodoMrpa; medidas: MedidaPA[]; podeMedir: boolean; onMedir: () => void }

/** Bloco Manhã/Noite da tela diária da MRPA (§2): até 3 medidas e a média do período. Sem cor por valor. */
export function BlocoPeriodo({ periodo, medidas, podeMedir, onMedir }: Props) {
  const validas = medidas.filter((m) => !m.contexto.excluida);
  const md = media(validas);
  const completo = medidas.length >= 3;
  return (
    <View style={styles.bloco}>
      <Text style={styles.titulo}>{periodo === 'manha' ? 'Manhã' : 'Noite'}</Text>
      {medidas.length ? (
        <View style={styles.lista}>
          {medidas.map((m) => (
            <View key={m.id} style={styles.linha}>
              <Text style={styles.hora}>{horaLocal(m.medidoEm)}</Text>
              <LeituraPA pas={m.pas} pad={m.pad} tamanho="linha" />
              {m.contexto.excluida ? <Text style={styles.excluida}>excluída do cálculo</Text> : null}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.vazio}>{podeMedir ? 'Ainda sem medidas.' : 'Sem medidas neste período.'}</Text>
      )}
      {md ? (
        <View style={styles.mediaLinha}>
          <Text style={styles.mediaRotulo}>Média da {periodo === 'manha' ? 'manhã' : 'noite'}</Text>
          <LeituraPA pas={md.pas} pad={md.pad} tamanho="medio" />
        </View>
      ) : null}
      {podeMedir && !completo ? <Button label={`Fazer as 3 medidas da ${periodo === 'manha' ? 'manhã' : 'noite'}`} variant={medidas.length ? 'outline' : 'primary'} onPress={onMedir} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.xl, gap: Spacing.md },
  titulo: { ...Typography.heading, color: Colors.textPrimary },
  lista: { gap: Spacing.xs },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  hora: { ...Typography.caption, color: Colors.textSecondary, width: 44 },
  excluida: { ...Typography.caption, color: Colors.textMuted },
  vazio: { ...Typography.caption, color: Colors.textMuted },
  mediaLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
  mediaRotulo: { ...Typography.subheading, color: Colors.textSecondary },
});
