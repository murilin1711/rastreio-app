import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAgua } from '@core/bemestar/useAgua';
import { totalDoDiaMl } from '@core/regras/bemestar/agua';
import { hojeLocalISO } from '@core/bemestar/useAtividades';
import { traduzirErro } from '@core/supabase/erros';
import { INTERVALOS_AGUA, PORCOES_AGUA, TEXTO_AGUA } from '@modules/bem-estar/conteudo/agua';
import { horariosAgua, validarConfigAgua } from '@core/regras/bemestar/lembretesAgua';
import { horaLocal } from '@modules/coracao/componentes/formato';
import { Button, Card, Colors, Input, InternalHeader, ModalComemoracao, Opcoes, ProgressBar, Radius, Spacing, Typography } from '@ui/index';

const litros = (ml: number) => `${String(Math.round(ml / 100) / 10).replace('.', ',')} L`;

/** Minha Água (C-021): quanto a pessoa bebeu hoje, meta e histórico. Meta é de água bebida. */
export default function MinhaAgua() {
  const router = useRouter();
  const agua = useAgua();
  const [outro, setOutro] = useState('');
  useFocusEffect(useCallback(() => { agua.recarregar(); }, [agua.recarregar]));

  const beber = (ml: number) => agua.registrar(ml).catch((e) => Alert.alert('Não foi possível registrar', traduzirErro(e).mensagemUsuario));
  const beberOutro = () => {
    const ml = Number(outro.replace(',', '.'));
    if (!outro.trim() || Number.isNaN(ml) || ml <= 0 || ml > 5000) { Alert.alert('Confira o valor', 'Informe a quantidade em ml, entre 1 e 5000.'); return; }
    setOutro('');
    beber(Math.round(ml));
  };
  const apagar = (id: string, rotulo: string) => Alert.alert('Apagar registro?', rotulo, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Apagar', style: 'destructive', onPress: () => agua.excluir(id).catch((e) => Alert.alert('Não foi possível apagar', traduzirErro(e).mensagemUsuario)) },
  ]);

  const salvarLembretes = (config: typeof agua.lembretes) => {
    const erro = config.ativo ? validarConfigAgua(config) : null;
    if (erro) { Alert.alert('Confira os horários', erro); return; }
    agua.salvarLembretes(config).catch((e) => Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario));
  };

  const hoje = hojeLocalISO();
  const doDia = agua.registros.filter((r) => r.medidoEm.slice(0, 10) === hoje);
  const pct = agua.metaMl ? Math.min(100, Math.round((agua.totalHoje / agua.metaMl) * 100)) : 0;

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={agua.carregando} onRefresh={agua.recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Saúde & Bem-estar" title="Minha Água" onBack={() => router.back()} />
        <Text style={styles.sub}>{TEXTO_AGUA.subtitulo}</Text>

        <Card style={styles.hoje}>
          <Text style={styles.total}>{litros(agua.totalHoje)}</Text>
          {agua.metaMl ? (
            <>
              <Text style={styles.meta}>de {litros(agua.metaMl)} hoje</Text>
              <ProgressBar value={pct} />
            </>
          ) : (
            <Text style={styles.meta}>hoje</Text>
          )}
        </Card>

        <View style={styles.porcoes}>
          {PORCOES_AGUA.map((p) => (
            <Pressable key={p.rotulo} style={styles.porcao} onPress={() => beber(p.ml)}>
              <Text style={styles.porcaoMl}>{p.ml} ml</Text>
              <Text style={styles.porcaoRotulo}>{p.rotulo}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.outro}>
          <Input value={outro} onChangeText={setOutro} placeholder="Outra quantidade (ml)" keyboardType="number-pad" style={{ flex: 1 }} />
          <Button label="Adicionar" onPress={beberOutro} />
        </View>

        <Text style={styles.nota}>
          {agua.temRestricao ? TEXTO_AGUA.restricao : agua.metaDefinida != null ? 'Meta definida por você ou pelo seu profissional.' : agua.metaMl ? TEXTO_AGUA.origemMeta : TEXTO_AGUA.semPeso}
        </Text>
        <Button label="Definir minha meta" variant="ghost" onPress={() => router.push('/(app)/bem-estar/metas')} />

        <Text style={styles.secao}>Lembretes</Text>
        {agua.temRestricao ? (
          <Text style={styles.nota}>{TEXTO_AGUA.lembretesRestricao}</Text>
        ) : (
          <Card style={styles.lembretes}>
            <View style={styles.linhaSwitch}>
              <Text style={styles.linhaMl}>Quero ser lembrado de beber água</Text>
              <Switch
                value={agua.lembretes.ativo}
                onValueChange={(v) => salvarLembretes({ ...agua.lembretes, ativo: v })}
                trackColor={{ true: Colors.accent, false: Colors.border }}
                thumbColor={Colors.white}
                accessibilityLabel="Lembretes de água"
              />
            </View>
            {agua.lembretes.ativo ? (
              <>
                <Text style={styles.rotulo}>Das</Text>
                <View style={styles.horas}>
                  <Input value={agua.lembretes.inicio} onChangeText={(t) => salvarLembretes({ ...agua.lembretes, inicio: t })} placeholder="08:00" style={{ flex: 1 }} />
                  <Text style={styles.ate}>até</Text>
                  <Input value={agua.lembretes.fim} onChangeText={(t) => salvarLembretes({ ...agua.lembretes, fim: t })} placeholder="20:00" style={{ flex: 1 }} />
                </View>
                <Text style={styles.rotulo}>A cada</Text>
                <Opcoes opcoes={INTERVALOS_AGUA.map((i) => ({ valor: String(i.min), rotulo: i.rotulo }))} valor={String(agua.lembretes.intervaloMin)} onChange={(v) => salvarLembretes({ ...agua.lembretes, intervaloMin: Number(v) })} />
                <Text style={styles.nota}>{TEXTO_AGUA.comoFunciona(horariosAgua(agua.lembretes.inicio, agua.lembretes.fim, agua.lembretes.intervaloMin).length)}</Text>
              </>
            ) : null}
          </Card>
        )}

        <Text style={styles.secao}>Hoje</Text>
        {doDia.length === 0 ? <Text style={styles.vazio}>Nada registrado ainda hoje.</Text> : null}
        <View style={{ gap: Spacing.xs }}>
          {doDia.map((r) => (
            <Pressable key={r.id} onLongPress={() => apagar(r.id, `${r.ml} ml às ${horaLocal(r.medidoEm)}`)}>
              <Card style={styles.linha}>
                <Text style={styles.linhaMl}>{r.ml} ml</Text>
                <Text style={styles.linhaHora}>{horaLocal(r.medidoEm)}</Text>
              </Card>
            </Pressable>
          ))}
        </View>
        {doDia.length > 0 ? <Text style={styles.dica}>Toque e segure um registro para apagar.</Text> : null}

        <Text style={styles.secao}>Últimos dias</Text>
        <View style={{ gap: Spacing.xs }}>
          {[...new Set(agua.registros.map((r) => r.medidoEm.slice(0, 10)))].filter((d) => d !== hoje).slice(0, 7).map((d) => (
            <Card key={d} style={styles.linha}>
              <Text style={styles.linhaMl}>{litros(totalDoDiaMl(agua.registros, d))}</Text>
              <Text style={styles.linhaHora}>{d.slice(8, 10)}/{d.slice(5, 7)}</Text>
            </Card>
          ))}
        </View>
      </ScrollView>
      <ModalComemoracao conteudo={agua.comemorar ? TEXTO_AGUA.metaBatida : null} aoFechar={agua.dispensarComemoracao} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  sub: { ...Typography.body, color: Colors.textSecondary },
  hoje: { marginTop: Spacing.lg, alignItems: 'center', gap: Spacing.xs },
  total: { ...Typography.display, fontSize: 40, lineHeight: 46, color: Colors.primary },
  meta: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.sm },
  porcoes: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  porcao: { flex: 1, alignItems: 'center', paddingVertical: Spacing.lg, borderRadius: Radius.linha, backgroundColor: Colors.surface, gap: 2 },
  porcaoMl: { ...Typography.subheading, color: Colors.primary },
  porcaoRotulo: { ...Typography.caption, color: Colors.textSecondary },
  outro: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginTop: Spacing.sm },
  nota: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.lg },
  lembretes: { padding: Spacing.lg, gap: Spacing.sm },
  linhaSwitch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.sm },
  horas: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ate: { ...Typography.body, color: Colors.textSecondary },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  vazio: { ...Typography.body, color: Colors.textSecondary },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
  linhaMl: { ...Typography.subheading, color: Colors.textPrimary },
  linhaHora: { ...Typography.caption, color: Colors.textSecondary },
  dica: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.sm },
});
