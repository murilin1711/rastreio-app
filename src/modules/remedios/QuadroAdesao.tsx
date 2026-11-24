import { StyleSheet, Text, View } from 'react-native';
import type { ResumoAdesao } from '@core/medicacoes/adesao';
import { Button, Card, Colors, Spacing, Typography } from '@ui/index';
import { simboloDose, textoResumoAdesao } from './rotulos';

const TITULO = 'Seus remédios nesta semana';

/** "Losartana 50 mg", "Losartana" (sem dose) ou "Dipirona (se precisar)". */
function nomeDaLinha(r: ResumoAdesao): string {
  if (r.sePrecisar) return `${r.nome} (se precisar)`;
  return r.dose ? `${r.nome} ${r.dose}` : r.nome;
}

/**
 * Quadro só de leitura do check-in semanal (spec §6.6): por remédio, o nome, a fileira de símbolos das doses
 * já fechadas e o resumo em texto. Só fatos, sem cor nem selo de "bom/ruim" (Ruling S0). Remédio com horário
 * sem nenhuma dose fechada no período fica de fora; sem linha nenhuma, o quadro não aparece. Com `erro`,
 * mostra a mensagem e "Tentar de novo" — nunca um quadro vazio que pareceria "nenhum remédio".
 */
export function QuadroAdesao({
  resumos,
  erro = null,
  aoTentarDeNovo,
}: {
  resumos: ResumoAdesao[];
  erro?: string | null;
  aoTentarDeNovo?: () => void;
}) {
  if (erro) {
    return (
      <Card style={styles.card}>
        <Text style={styles.titulo}>{TITULO}</Text>
        <Text style={styles.texto}>{erro}</Text>
        {aoTentarDeNovo ? <Button label="Tentar de novo" variant="outline" onPress={aoTentarDeNovo} /> : null}
      </Card>
    );
  }
  const linhas = resumos.filter((r) => r.sePrecisar || r.previstas > 0);
  if (!linhas.length) return null;
  return (
    <Card style={styles.card}>
      <Text style={styles.titulo} accessibilityRole="header">{TITULO}</Text>
      {linhas.map((r) => {
        const nome = nomeDaLinha(r);
        const texto = textoResumoAdesao(r);
        const simbolos = r.sePrecisar ? '' : r.doses.map((d) => simboloDose(d.estado) ?? '').join('');
        return (
          <View key={r.medicacaoId} style={styles.linha} accessible accessibilityLabel={`${nome}: ${texto}`}>
            <Text style={styles.nome}>{nome}</Text>
            {simbolos ? <Text style={styles.simbolos}>{simbolos}</Text> : null}
            <Text style={styles.texto}>{texto}</Text>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.lg, gap: Spacing.md, marginTop: Spacing.lg },
  titulo: { ...Typography.subheading, color: Colors.textPrimary },
  linha: { gap: 2 },
  nome: { ...Typography.body, color: Colors.textPrimary },
  simbolos: { ...Typography.body, color: Colors.textSecondary, letterSpacing: 2 },
  texto: { ...Typography.caption, color: Colors.textSecondary },
});
