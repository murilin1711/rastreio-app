import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cancelarSegundoLembrete } from '@core/cardio/lembretesCardio';
import { classificarDoses, podeMarcar } from '@core/medicacoes/adesao';
import { horaCurta } from '@core/medicacoes/horarios';
import { listarMedicacoes, listarTomadas, registrarTomada, substituirTomadas } from '@core/medicacoes/repositorio';
import type { Medicacao, Tomada } from '@core/medicacoes/tipos';
import { formatarQuantidade, UNIDADES } from '@core/medicacoes/unidades';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { SeletorQuantidade } from '@modules/remedios/SeletorQuantidade';
import { Alerta, Button, Colors, InternalHeader, MS_SAIDA_CONCLUIDA, Radius, Spacing, Typography } from '@ui/index';

/** 'AAAA-MM-DD' do dia local. */
function diaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 'HH:MM' local de um instante ISO. */
function horaDe(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type Acao = 'tomei' | 'nao' | 'denovo';

type Carga =
  | { tipo: 'carregando' }
  | { tipo: 'erro' }
  | { tipo: 'pronto'; remedio: Medicacao | null; tomadas: Tomada[]; agora: Date };

/**
 * "Tomou?" (spec §6.3). Aberta pelo lembrete, pela Home, pelo ＋ Anotar e pela lista de doses de hoje.
 * Params: `med`; `hora` ausente = uso de remédio "se precisar" (tomada avulsa); `data` ausente = hoje.
 *
 * "✓ Tomei" grava com a quantidade mostrada; se a dose já tem marca, a tela avisa e oferece "Corrigir"
 * (troca a marca) ou "Tomei de novo" (segunda tomada, que conta como dose dobrada). Se a última marca foi
 * "não tomei", o aviso diz isso e o botão é "✓ Tomei" (vale como tomada). Hora que não está mais no
 * cadastro e sem marca: só o aviso de que o horário mudou (a marca não contaria). Depois de gravar,
 * mostra "Marcado ✓" e volta. O cancelamento do segundo lembrete corre em segundo plano: ele passa pela
 * fila dos lembretes, que não tem prazo, e não pode segurar a tela (R-T5-b).
 */
export default function Tomar() {
  const { med, hora, data } = useLocalSearchParams<{ med: string; hora?: string; data?: string }>();
  const router = useRouter();
  const { sessao } = useSessao();
  const userId = sessao?.user.id;

  const [carga, setCarga] = useState<Carga>({ tipo: 'carregando' });
  const [quantidade, setQuantidade] = useState(1);
  const [corrigindo, setCorrigindo] = useState(false);
  /** Qual botão está gravando (mostra o "carregando" nele); `null` = nenhum. */
  const [salvando, setSalvando] = useState<Acao | null>(null);
  const [marcado, setMarcado] = useState(false);
  // O estado só trava os botões na próxima renderização; dois toques no mesmo quadro passariam.
  const ocupado = useRef(false);

  const dataDose = data || diaLocal(new Date());

  const carregar = useCallback(async () => {
    if (!userId) return;
    setCarga({ tipo: 'carregando' });
    try {
      const [lista, tomadas] = await Promise.all([listarMedicacoes(userId), listarTomadas(userId, dataDose, dataDose)]);
      const remedio = lista.find((m) => m.id === med) ?? null;
      const daDose = hora ? tomadas.filter((t) => t.medicacaoId === med && t.dataPrevista === dataDose && t.horaPrevista === hora) : [];
      setCarga({ tipo: 'pronto', remedio, tomadas: daDose, agora: new Date() });
      setQuantidade(previstaDe(remedio, daDose, hora) ?? 1);
    } catch {
      setCarga({ tipo: 'erro' });
    }
  }, [userId, med, hora, dataDose]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    if (!marcado) return;
    // O iOS não lê sozinho a região que mudou (accessibilityLiveRegion é só do Android).
    AccessibilityInfo.announceForAccessibility('Marcado');
    const t = setTimeout(() => router.back(), MS_SAIDA_CONCLUIDA);
    return () => clearTimeout(t);
  }, [marcado, router]);

  if (carga.tipo !== 'pronto') {
    return (
      <Moldura titulo="Tomou?">
        {carga.tipo === 'carregando' ? (
          <ActivityIndicator color={Colors.primary} style={styles.espera} />
        ) : (
          <>
            <Text style={styles.texto}>Não foi possível abrir o remédio agora.</Text>
            <Button label="Tentar de novo" variant="outline" onPress={carregar} style={styles.botao} />
          </>
        )}
      </Moldura>
    );
  }

  const { remedio, tomadas, agora } = carga;
  if (!remedio) {
    return (
      <Moldura titulo="Tomou?">
        <Text style={styles.texto}>Esse remédio não está mais na sua lista.</Text>
      </Moldura>
    );
  }

  const titulo = remedio.dose ? `${remedio.nome} ${remedio.dose}` : remedio.nome;
  const prevista = previstaDe(remedio, tomadas, hora);
  const subtitulo = !hora
    ? 'Se precisar'
    : remedio.doseVariavel || prevista === null
      ? `Dose das ${horaCurta(hora)}`
      : `Dose das ${horaCurta(hora)} · ${formatarQuantidade(prevista, remedio.unidade)}`;

  if (marcado) {
    return (
      <Moldura titulo={titulo} subtitulo={subtitulo}>
        <View style={styles.confirmacao} accessibilityLiveRegion="polite">
          <Text style={styles.confirmacaoTexto}>Marcado ✓</Text>
        </View>
      </Moldura>
    );
  }

  if (hora && !podeMarcar(dataDose, agora)) {
    return (
      <Moldura titulo={titulo} subtitulo={subtitulo}>
        <Text style={styles.texto}>Essa dose já passou do prazo para marcar.</Text>
      </Moldura>
    );
  }

  // Dose que não existe na classificação (horário mudou, ou fora do período do remédio): uma marca
  // gravada ali nunca contaria em lugar nenhum.
  if (hora && !classificarDoses(remedio, tomadas, dataDose, dataDose, agora).some((d) => d.hora === hora)) {
    return (
      <Moldura titulo={titulo} subtitulo={subtitulo}>
        <Text style={styles.texto}>O horário desse remédio mudou.</Text>
      </Moldura>
    );
  }

  const salvar = async (tomou: boolean, modo: 'registrar' | 'substituir', acao: Acao) => {
    if (!userId || ocupado.current) return;
    ocupado.current = true;
    setSalvando(acao);
    const nova = {
      medicacaoId: remedio.id,
      dataPrevista: hora ? dataDose : null,
      horaPrevista: hora ?? null,
      quantidadePrevista: hora ? prevista : null,
      tomou,
      quantidade: tomou ? quantidade : null,
    };
    try {
      if (modo === 'substituir' && hora) {
        await substituirTomadas(userId, { medicacaoId: remedio.id, dataPrevista: dataDose, horaPrevista: hora }, nova);
      } else {
        await registrarTomada(userId, nova);
      }
    } catch (e) {
      ocupado.current = false;
      setSalvando(null);
      Alert.alert('Não foi possível marcar', traduzirErro(e).mensagemUsuario);
      return;
    }
    // Sem esperar: a fila dos lembretes não tem prazo (R-T5-b). A marca já está salva.
    if (hora) cancelarSegundoLembrete(remedio.id, dataDose, hora).catch(() => {});
    setMarcado(true);
  };

  const jaMarcada = tomadas.length > 0 && !corrigindo;
  const ultima = tomadas[tomadas.length - 1];
  const modo = corrigindo ? 'substituir' : 'registrar';

  return (
    <Moldura titulo={titulo} subtitulo={subtitulo}>
      {jaMarcada ? (
        <>
          <View style={styles.aviso}>
            <Text style={styles.avisoTexto}>
              {ultima.tomou
                ? `Você já marcou essa dose às ${horaCurta(horaDe(ultima.marcadoEm))}`
                : `Você marcou que não tomou essa dose às ${horaCurta(horaDe(ultima.marcadoEm))}`}
            </Text>
          </View>
          {ultima.tomou ? (
            <Button label="Tomei de novo" variant="outline" disabled={!!salvando} loading={salvando === 'denovo'} onPress={() => salvar(true, 'registrar', 'denovo')} style={styles.botao} />
          ) : (
            // Marcou "não tomei" e depois tomou: a nova marca vale como tomada (R-T3-a).
            <Button label="✓ Tomei" disabled={!!salvando} loading={salvando === 'tomei'} onPress={() => salvar(true, 'registrar', 'tomei')} style={[styles.botao, styles.principal]} />
          )}
          <Button label="Corrigir" variant="outline" disabled={!!salvando} onPress={() => setCorrigindo(true)} style={styles.botao} />
        </>
      ) : (
        <>
          <Button label="✓ Tomei" disabled={!!salvando} loading={salvando === 'tomei'} onPress={() => salvar(true, modo, 'tomei')} style={[styles.botao, styles.principal]} />
          {hora ? (
            <Button label="Não tomei" variant="outline" disabled={!!salvando} loading={salvando === 'nao'} onPress={() => salvar(false, modo, 'nao')} style={styles.botao} />
          ) : null}
        </>
      )}
      <View style={styles.quantidade}>
        <Text style={styles.pergunta}>{UNIDADES[remedio.unidade].pergunta}</Text>
        <SeletorQuantidade valor={quantidade} unidade={remedio.unidade} onChange={setQuantidade} />
      </View>
    </Moldura>
  );
}

/**
 * Quantidade prevista da dose: a copiada na primeira marca (o cadastro pode ter mudado depois),
 * senão a do horário no cadastro, senão 1. `null` no uso "se precisar", que não tem dose prevista.
 */
function previstaDe(remedio: Medicacao | null, tomadas: Tomada[], hora: string | undefined): number | null {
  if (!hora) return null;
  return tomadas[0]?.quantidadePrevista ?? remedio?.horarios.find((h) => h.hora === hora)?.quantidade ?? 1;
}

function Moldura({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.tela} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Remédios" title={titulo} />
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingTop: Spacing.md },
  subtitulo: { ...Typography.heading, color: Colors.textSecondary, marginTop: -Spacing.md, marginBottom: Spacing.xxl },
  texto: { ...Typography.body, color: Colors.textPrimary, marginBottom: Spacing.lg },
  espera: { marginTop: Spacing.xxxl },
  botao: { width: '100%', marginBottom: Spacing.md },
  principal: { minHeight: 64 },
  quantidade: { marginTop: Spacing.xxl, alignItems: 'center', gap: Spacing.md },
  pergunta: { ...Typography.heading, color: Colors.textPrimary },
  aviso: { backgroundColor: Alerta.amarelo.bg, borderRadius: Radius.linha, padding: Spacing.lg, marginBottom: Spacing.lg },
  avisoTexto: { ...Typography.body, color: Colors.textPrimary },
  confirmacao: { backgroundColor: Alerta.verde.bg, borderRadius: Radius.linha, padding: Spacing.xxl, alignItems: 'center', marginTop: Spacing.lg },
  confirmacaoTexto: { ...Typography.title, color: Alerta.verde.fg },
});
