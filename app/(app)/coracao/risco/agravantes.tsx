import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExamesCardio } from '@core/cardio/useExamesCardio';
import { useRiscoCv } from '@core/cardio/useRiscoCv';
import { LISTA_AGRAVANTES } from '@core/regras/cardio/agravantes';
import type { AgravanteCV } from '@core/regras/cardio/tiposRisco';
import { traduzirErro } from '@core/supabase/erros';
import { dataLongaBr } from '@modules/coracao/componentes/formato';
import { fraseAgravantes } from '@modules/coracao/conteudo/risco';
import { Alerta, Button, Colors, InternalHeader, Opcoes, Radius, Spacing, StatusBadge, Typography } from '@ui/index';

/** §17 agravantes (Tabela 4.3) e §18 escore de cálcio (Tabela 4.4). O app não reclassifica o risco. */
export default function Agravantes() {
  const router = useRouter();
  const { perfil, parametros, salvarAgravantes } = useRiscoCv();
  const { exames } = useExamesCardio({ tipo: 'cac' });
  const [itens, setItens] = useState<AgravanteCV[]>([]);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => { if (perfil) setItens(perfil.agravantesCv.itens as AgravanteCV[]); }, [perfil]);

  const cac = exames[0];
  const ag = cac?.resultado.agatston ?? null;
  const pct = cac?.resultado.percentil ?? null;
  const cacDestaque = parametros && cac ? ((ag ?? 0) > parametros.cac.muitoAlto ? 'muito_alto' : (ag ?? 0) > parametros.cac.alto || (pct ?? 0) > parametros.cac.percentilAlto ? 'alto' : null) : null;

  const gravar = async () => {
    setSalvando(true);
    try { await salvarAgravantes(itens); router.back(); } catch (e) { Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario); } finally { setSalvando(false); }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Meu Risco" title="Fatores agravantes" />
        <Text style={styles.sub}>A diretriz brasileira lista situações que podem mudar a interpretação do risco calculado, principalmente quando ele é intermediário. Marque as que se aplicam a você.</Text>
        <Opcoes<AgravanteCV> opcoes={LISTA_AGRAVANTES.map((a) => ({ valor: a.id, rotulo: a.rotulo, descricao: a.detalhe || undefined }))} valor={itens} onChange={(v) => setItens(itens.includes(v) ? itens.filter((x) => x !== v) : [...itens, v])} multiplo />
        {itens.length ? <View style={[styles.aviso, { backgroundColor: Alerta.amarelo.bg }]}><Text style={[styles.texto, { color: Alerta.amarelo.fg }]}>{fraseAgravantes}</Text></View> : null}
        <Button label="Salvar" onPress={gravar} loading={salvando} style={{ marginTop: Spacing.xl }} />

        <View style={styles.bloco}>
          <Text style={styles.secao}>Escore de cálcio coronariano</Text>
          {cac ? (
            <>
              <Text style={styles.texto}>{ag ?? '—'} Agatston{pct != null ? ` · percentil ${pct}` : ''} · {dataLongaBr(cac.dataRealizacao)}</Text>
              {cacDestaque && parametros ? (
                <View style={[styles.aviso, { backgroundColor: Alerta.amarelo.bg }]}>
                  <StatusBadge nivel="amarelo" label={cacDestaque === 'muito_alto' ? `Acima de ${parametros.cac.muitoAlto} Agatston` : `Acima de ${parametros.cac.alto} Agatston ou percentil ${parametros.cac.percentilAlto}`} />
                  <Text style={[styles.texto, { color: Alerta.amarelo.fg, marginTop: Spacing.sm }]}>{parametros.cac.regra.mensagemPaciente}</Text>
                </View>
              ) : <Text style={styles.nota}>Aparece no seu histórico cardiovascular e no relatório para o médico.</Text>}
            </>
          ) : <Text style={styles.nota}>Nenhum escore de cálcio registrado. Se você fez o exame, registre o valor em Agatston.</Text>}
          <Button label={cac ? 'Registrar novo escore de cálcio' : 'Registrar escore de cálcio'} variant="outline" onPress={() => router.push({ pathname: '/(app)/coracao/exames/registrar', params: { tipo: 'cac' } })} style={{ marginTop: Spacing.md }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  sub: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  texto: { ...Typography.body, color: Colors.textPrimary },
  nota: { ...Typography.caption, color: Colors.textSecondary },
  aviso: { borderRadius: Radius.linha, padding: Spacing.lg, marginTop: Spacing.lg },
  bloco: { marginTop: Spacing.xxxl },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.sm },
});
