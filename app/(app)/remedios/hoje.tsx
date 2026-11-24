import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAbrir } from '@core/navegacao/useVoltar';
import { horaCurta, rotaTomar } from '@core/medicacoes/horarios';
import { listarMedicacoes } from '@core/medicacoes/repositorio';
import type { DoseClassificada } from '@core/medicacoes/adesao';
import type { Medicacao } from '@core/medicacoes/tipos';
import { useDosesHoje } from '@core/medicacoes/useDosesHoje';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { rotuloEstadoDose } from '@modules/remedios/rotulos';
import { Button, Colors, InternalHeader, ListItem, Radius, Spacing, Typography } from '@ui/index';

type Remedios = { tipo: 'carregando' } | { tipo: 'erro'; mensagem: string } | { tipo: 'pronto'; lista: Medicacao[] };

const nomeCompleto = (m: Medicacao) => (m.dose ? `${m.nome} ${m.dose}` : m.nome);

/**
 * "Tomei remédio" (spec §6.4), aberta pelo ＋ Anotar: marcar sem depender da notificação. Mostra as
 * doses de hoje (cada uma abre "Tomou?" daquele horário), as de ontem ainda sem marca (marcáveis até o
 * fim de hoje) e os remédios "se precisar" com "Tomei agora" (tomada avulsa). Recarrega a cada volta,
 * para a dose recém-marcada aparecer com o estado novo. Falha na carga mostra o erro e "Tentar de novo"
 * — nunca uma lista vazia, que pareceria "nada a marcar". O erro das doses fica só no lugar delas: a
 * seção "Se precisar" depende apenas da lista de remédios.
 */
export default function TomeiRemedio() {
  const abrir = useAbrir();
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const doses = useDosesHoje({ incluirOntem: true });
  const recarregarDoses = doses.recarregar;
  const [remedios, setRemedios] = useState<Remedios>({ tipo: 'carregando' });
  // Depois da primeira carga, a recarga ao voltar é silenciosa: a lista fica na tela.
  const dosesVieram = useRef(false);
  if (!doses.carregando) dosesVieram.current = true;

  const carregarRemedios = useCallback(async () => {
    if (!userId) return;
    try {
      setRemedios({ tipo: 'pronto', lista: await listarMedicacoes(userId) });
    } catch (e) {
      setRemedios({ tipo: 'erro', mensagem: traduzirErro(e).mensagemUsuario });
    }
  }, [userId]);

  // A primeira vez é a montagem: `useDosesHoje` já carrega as doses sozinho.
  const jaFocou = useRef(false);
  useFocusEffect(useCallback(() => {
    carregarRemedios();
    if (jaFocou.current) recarregarDoses();
    jaFocou.current = true;
  }, [carregarRemedios, recarregarDoses]));

  const tentarDeNovo = () => {
    setRemedios((r) => (r.tipo === 'erro' ? { tipo: 'carregando' } : r));
    carregarRemedios();
    recarregarDoses();
  };

  let corpo: React.ReactNode;
  if (remedios.tipo === 'erro') {
    corpo = <Erro mensagem={remedios.mensagem} aoTentar={tentarDeNovo} />;
  } else if (remedios.tipo !== 'pronto') {
    corpo = <ActivityIndicator color={Colors.primary} style={styles.espera} />;
  } else {
    const ativas = remedios.lista.filter((m) => m.ativa);
    const sePrecisar = ativas.filter((m) => m.sePrecisar);
    const nomeDe = (id: string) => ativas.find((m) => m.id === id)?.nome ?? 'Remédio';
    const linhaDose = (d: DoseClassificada, sufixo = '') => (
      <ListItem
        key={`${d.data}_${d.medicacaoId}_${d.hora}`}
        icon="medkit-outline"
        title={`${nomeDe(d.medicacaoId)} · ${horaCurta(d.hora)}${sufixo}`}
        subtitle={rotuloEstadoDose(d)}
        onPress={() => abrir(rotaTomar(d.medicacaoId, d.hora, d.data))}
      />
    );
    let partesDoses: React.ReactNode;
    if (doses.erro) {
      partesDoses = <Erro mensagem={doses.erro} aoTentar={tentarDeNovo} />;
    } else if (!dosesVieram.current) {
      partesDoses = <ActivityIndicator color={Colors.primary} style={styles.espera} />;
    } else if (!doses.doses.length && !doses.dosesOntem.length) {
      partesDoses = !sePrecisar.length ? <Text style={styles.texto}>Nenhuma dose para hoje.</Text> : null;
    } else {
      partesDoses = (
        <>
          {doses.doses.length ? (
            <>
              <Text style={styles.secao}>Doses de hoje</Text>
              <View style={styles.lista}>{doses.doses.map((d) => linhaDose(d))}</View>
            </>
          ) : null}
          {doses.dosesOntem.length ? (
            <>
              <Text style={styles.secao}>De ontem</Text>
              <View style={styles.lista}>{doses.dosesOntem.map((d) => linhaDose(d, ' · ontem'))}</View>
            </>
          ) : null}
        </>
      );
    }
    corpo = !ativas.length ? (
      <>
        <Text style={styles.texto}>Nenhum remédio cadastrado.</Text>
        <Button label="Cadastrar remédio" onPress={() => abrir('/(app)/(tabs)/minha-saude/medicamentos')} style={styles.botao} />
      </>
    ) : (
      <>
        {partesDoses}
        {sePrecisar.length ? (
          <>
            <Text style={styles.secao}>Se precisar</Text>
            <View style={styles.lista}>
              {sePrecisar.map((m) => (
                <View key={m.id} style={styles.linha}>
                  <Text style={styles.nome}>{nomeCompleto(m)}</Text>
                  <Button label="Tomei agora" variant="outline" onPress={() => abrir(rotaTomar(m.id))} />
                </View>
              ))}
            </View>
          </>
        ) : null}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.tela} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Remédios" title="Tomei remédio" />
        {corpo}
      </ScrollView>
    </SafeAreaView>
  );
}

function Erro({ mensagem, aoTentar }: { mensagem: string; aoTentar: () => void }) {
  return (
    <>
      <Text style={styles.texto}>{mensagem}</Text>
      <Button label="Tentar de novo" variant="outline" onPress={aoTentar} style={styles.botao} />
    </>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingTop: Spacing.md },
  texto: { ...Typography.body, color: Colors.textPrimary, marginBottom: Spacing.lg },
  espera: { marginTop: Spacing.xxxl },
  botao: { width: '100%', marginBottom: Spacing.md },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.md },
  lista: { gap: Spacing.sm, marginBottom: Spacing.xxl },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.linha, padding: Spacing.lg },
  nome: { ...Typography.subheading, fontSize: 17, lineHeight: 23, color: Colors.textPrimary, flex: 1 },
});
