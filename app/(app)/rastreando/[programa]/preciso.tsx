import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AntecedenteFamiliar, PerfilSaude } from '@core/perfil/tipos';
import { usePerfil } from '@core/perfil/usePerfil';
import type { Programa } from '@core/regras/tipos';
import { PROGRAMAS } from '@core/rastreando/tipos';
import { useRastreando } from '@core/rastreando/useRastreando';
import { OPCOES_CONDICAO_FAMILIAR, OPCOES_GRAU, OPCOES_PARENTESCO, OPCOES_RACA_COR, OPCOES_SEXO, OPCOES_SIM_NAO, OPCOES_TABAGISMO, grauPorParentesco } from '@modules/minha-saude/opcoes';
import { PassoPerfil } from '@modules/minha-saude/PassoPerfil';
import { CONTEUDO } from '@modules/rastreando/conteudo';
import { STATUS_UI, dataBr } from '@modules/rastreando/componentes/statusUI';
import { perguntasFaltantes, type CampoFaltante } from '@modules/rastreando/perguntasFaltantes';
import { Button, CampoData, Card, Colors, Input, InternalHeader, Opcoes, Select, Spacing, StatusBadge, Typography } from '@ui/index';

const TITULOS: Record<CampoFaltante, string> = {
  dataNascimento: 'Quando você nasceu?', sexoNascimento: 'Sexo atribuído ao nascimento', antecedentes: 'Alguém na família teve câncer?',
  radioterapiaToracica: 'Fez radioterapia no tórax antes dos 30 anos?', possuiColoUtero: 'Você tem colo do útero?', jaTeveAtividadeSexual: 'Já teve atividade sexual?',
  temHiv: 'Você vive com HIV?', temImunossupressao: 'Tem alguma condição de imunossupressão?', temDii: 'Tem doença inflamatória intestinal?',
  tabagismoStatus: 'Você fuma ou já fumou?', cigarrosDia: 'Quantos cigarros por dia, em média?', anosFumando: 'Por quantos anos fumou?', dataCessacao: 'Quando parou de fumar?', racaCor: 'Raça/cor (autodeclarada)',
};
const AJUDA: Partial<Record<CampoFaltante, string>> = {
  antecedentes: 'Registre casos de câncer em parentes. Se não houver, marque "Não há casos na família".',
  temImunossupressao: 'Transplante, quimioterapia, corticoide prolongado ou doenças que baixam a imunidade.',
  temDii: 'Doença de Crohn ou retocolite ulcerativa.',
  racaCor: 'As sociedades de urologia recomendam começar a conversa sobre rastreamento mais cedo para homens negros.',
  jaTeveAtividadeSexual: 'O rastreamento do colo do útero só é indicado para quem já teve atividade sexual.',
};

type Antecedente = Omit<AntecedenteFamiliar, 'id'>;

/** §29.2: pergunta só o que falta no perfil para este programa e mostra a orientação do motor. */
export default function Preciso() {
  const router = useRouter();
  const { programa } = useLocalSearchParams<{ programa: string }>();
  const { perfil, antecedentes, salvar, salvarAntecedente, carregando } = usePerfil();
  const rastreando = useRastreando();
  const [indice, setIndice] = useState(0);
  const [valor, setValor] = useState<string | null>(null);
  const [novoAnt, setNovoAnt] = useState<Partial<Antecedente>>({});
  const [antsPendentes, setAntsPendentes] = useState<Antecedente[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [concluido, setConcluido] = useState(false);

  const valido = PROGRAMAS.includes(programa as Programa);
  const p = (valido ? programa : 'mama') as Programa;
  const c = CONTEUDO[p];

  const faltantes = useMemo(() => (perfil ? perguntasFaltantes(p, perfil, antecedentes.length, perfil.semAntecedentesFamiliares) : []), [perfil, antecedentes.length, p]);

  if (!valido) return <Redirect href="/(app)/rastreando" />;
  if (carregando || !perfil) return <View style={styles.centro}><ActivityIndicator color={Colors.primary} /></View>;

  const campo = faltantes[indice];
  const mostrarResultado = concluido || faltantes.length === 0;

  const avancar = async (dados: Partial<Omit<PerfilSaude, 'userId'>>) => {
    setSalvando(true);
    try {
      await salvar(dados);
      setValor(null);
      if (indice + 1 >= faltantes.length) { await rastreando.recarregar(); setConcluido(true); }
      else setIndice(indice + 1);
    } catch (e) { Alert.alert('Não foi possível salvar', (e as { mensagemUsuario?: string }).mensagemUsuario ?? 'Tente novamente.'); }
    finally { setSalvando(false); }
  };

  const concluirAntecedentes = async (nenhum: boolean) => {
    setSalvando(true);
    try {
      for (const a of antsPendentes) await salvarAntecedente(a);
      await salvar({ semAntecedentesFamiliares: nenhum && antsPendentes.length === 0 });
      setAntsPendentes([]);
      if (indice + 1 >= faltantes.length) { await rastreando.recarregar(); setConcluido(true); }
      else setIndice(indice + 1);
    } catch (e) { Alert.alert('Não foi possível salvar', (e as { mensagemUsuario?: string }).mensagemUsuario ?? 'Tente novamente.'); }
    finally { setSalvando(false); }
  };

  if (mostrarResultado) {
    const av = rastreando.avaliacoes?.[p];
    const st = av ? STATUS_UI[av.status] : null;
    return (
      <SafeAreaView style={styles.tela} edges={['top']}>
        <ScrollView contentContainerStyle={styles.conteudo}>
          <InternalHeader sectionLabel={c.titulo} title="Preciso fazer rastreamento?" />
          {av && st ? (
            <Card style={{ gap: Spacing.md }}>
              <StatusBadge nivel={st.nivel} label={st.rotulo} />
              <Text style={styles.mensagem}>{av.mensagem}</Text>
              {av.proximaData ? <Text style={styles.proxima}>Próximo exame previsto: {dataBr(av.proximaData)}</Text> : null}
              {av.regraId ? <Text style={styles.regra}>Regra aplicada: {av.regraVersao ? `versão ${av.regraVersao}` : ''}</Text> : null}
            </Card>
          ) : <ActivityIndicator color={Colors.primary} />}
          <View style={{ gap: Spacing.sm, marginTop: Spacing.xxl }}>
            <Button label="Registrar um exame" onPress={() => router.push({ pathname: '/(app)/rastreando/[programa]/registrar', params: { programa: p } })} />
            <Button label="Ver sinais de alerta" variant="outline" onPress={() => router.push({ pathname: '/(app)/rastreando/[programa]/sinais', params: { programa: p } })} />
          </View>
          <Text style={styles.rodape}>Este resultado organiza as recomendações das diretrizes para o seu perfil e não substitui a avaliação do seu médico. Fontes: {c.fonteResumo}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const comum = { passo: indice + 1, total: faltantes.length, salvando, ultimo: indice + 1 === faltantes.length, onVoltar: indice > 0 ? () => setIndice(indice - 1) : undefined };
  const simNao = (chave: keyof PerfilSaude) => (
    <PassoPerfil {...comum} titulo={TITULOS[campo]} ajuda={AJUDA[campo]} podeAvancar={!!valor} onAvancar={() => avancar({ [chave]: valor === 'sim' } as Partial<PerfilSaude>)}>
      <Opcoes opcoes={OPCOES_SIM_NAO} valor={valor as 'sim' | 'nao' | null} onChange={setValor} />
    </PassoPerfil>
  );

  switch (campo) {
    case 'dataNascimento': return <PassoPerfil {...comum} titulo={TITULOS[campo]} podeAvancar={!!valor} onAvancar={() => avancar({ dataNascimento: valor })}><CampoData valor={valor} onChange={setValor} /></PassoPerfil>;
    case 'dataCessacao': return <PassoPerfil {...comum} titulo={TITULOS[campo]} podeAvancar={!!valor} onAvancar={() => avancar({ dataCessacao: valor })}><CampoData valor={valor} onChange={setValor} /></PassoPerfil>;
    case 'sexoNascimento': return <PassoPerfil {...comum} titulo={TITULOS[campo]} podeAvancar={!!valor} onAvancar={() => avancar({ sexoNascimento: valor as PerfilSaude['sexoNascimento'] })}><Opcoes opcoes={OPCOES_SEXO} valor={valor as never} onChange={setValor} /></PassoPerfil>;
    case 'tabagismoStatus': return <PassoPerfil {...comum} titulo={TITULOS[campo]} podeAvancar={!!valor} onAvancar={() => avancar({ tabagismoStatus: valor as PerfilSaude['tabagismoStatus'] })}><Opcoes opcoes={OPCOES_TABAGISMO} valor={valor as never} onChange={setValor} /></PassoPerfil>;
    case 'racaCor': return <PassoPerfil {...comum} titulo={TITULOS[campo]} ajuda={AJUDA[campo]} podeAvancar={!!valor} onAvancar={() => avancar({ racaCor: valor as PerfilSaude['racaCor'] })}><Opcoes opcoes={OPCOES_RACA_COR} valor={valor as never} onChange={setValor} /></PassoPerfil>;
    case 'cigarrosDia': return <PassoPerfil {...comum} titulo={TITULOS[campo]} podeAvancar={!!valor && Number(valor) > 0} onAvancar={() => avancar({ cigarrosDia: Number(valor) })}><Input placeholder="Ex.: 20" keyboardType="number-pad" value={valor ?? ''} onChangeText={setValor} /></PassoPerfil>;
    case 'anosFumando': return <PassoPerfil {...comum} titulo={TITULOS[campo]} podeAvancar={!!valor && Number(valor.replace(',', '.')) > 0} onAvancar={() => avancar({ anosFumando: Number(valor!.replace(',', '.')) })}><Input placeholder="Ex.: 15" keyboardType="decimal-pad" value={valor ?? ''} onChangeText={setValor} /></PassoPerfil>;
    case 'possuiColoUtero': return (
      <PassoPerfil {...comum} titulo={TITULOS[campo]} ajuda="Quem passou por histerectomia total não tem colo do útero." podeAvancar={!!valor} onAvancar={() => avancar({ possuiColoUtero: valor === 'sim', histerectomia: valor === 'nao' })}>
        <Opcoes opcoes={[{ valor: 'sim', rotulo: 'Sim' }, { valor: 'nao', rotulo: 'Não', descricao: 'Fiz histerectomia' }]} valor={valor as never} onChange={setValor} />
      </PassoPerfil>);
    case 'radioterapiaToracica': return simNao('radioterapiaToracica');
    case 'jaTeveAtividadeSexual': return simNao('jaTeveAtividadeSexual');
    case 'temHiv': return simNao('temHiv');
    case 'temImunossupressao': return simNao('temImunossupressao');
    case 'temDii': return simNao('temDii');
    case 'antecedentes': {
      const pronto = !!novoAnt.condicao && !!novoAnt.parentesco && !!novoAnt.grau;
      return (
        <PassoPerfil {...comum} titulo={TITULOS[campo]} ajuda={AJUDA[campo]} podeAvancar={antsPendentes.length > 0} onAvancar={() => concluirAntecedentes(false)} podePular onPular={() => concluirAntecedentes(true)}>
          <View style={{ gap: Spacing.md }}>
            {antsPendentes.map((a, i) => <Text key={i} style={styles.antItem}>• {OPCOES_CONDICAO_FAMILIAR.find((o) => o.valor === a.condicao)?.rotulo} — {OPCOES_PARENTESCO.find((o) => o.valor === a.parentesco)?.rotulo}{a.idadeDiagnostico ? `, aos ${a.idadeDiagnostico} anos` : ''}</Text>)}
            <Select placeholder="Qual câncer?" opcoes={OPCOES_CONDICAO_FAMILIAR} valor={novoAnt.condicao ?? null} onChange={(v) => setNovoAnt({ ...novoAnt, condicao: v })} />
            <Select placeholder="Parentesco" opcoes={OPCOES_PARENTESCO} valor={novoAnt.parentesco ?? null} onChange={(v) => setNovoAnt({ ...novoAnt, parentesco: v, grau: grauPorParentesco(v) ?? novoAnt.grau })} />
            <Select placeholder="Grau" opcoes={OPCOES_GRAU} valor={novoAnt.grau ?? null} onChange={(v) => setNovoAnt({ ...novoAnt, grau: v })} />
            <Input placeholder="Idade no diagnóstico, se souber" keyboardType="number-pad" value={novoAnt.idadeDiagnostico?.toString() ?? ''} onChangeText={(v) => setNovoAnt({ ...novoAnt, idadeDiagnostico: v ? Number(v) : null })} />
            <Button label="Adicionar este parente" variant="outline" disabled={!pronto} onPress={() => { setAntsPendentes([...antsPendentes, { condicao: novoAnt.condicao!, parentesco: novoAnt.parentesco!, grau: novoAnt.grau!, idadeDiagnostico: novoAnt.idadeDiagnostico ?? null, observacao: null }]); setNovoAnt({}); }} />
            <Text style={styles.dica}>Sem casos na família? Toque em "Pular" — vamos registrar que não há antecedentes.</Text>
          </View>
        </PassoPerfil>
      );
    }
    default: return <Redirect href="/(app)/rastreando" />;
  }
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  mensagem: { ...Typography.body, color: Colors.textPrimary },
  proxima: { ...Typography.subheading, color: Colors.accent },
  regra: { ...Typography.caption, color: Colors.textMuted },
  rodape: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xxl },
  antItem: { ...Typography.body, color: Colors.textPrimary },
  dica: { ...Typography.caption, color: Colors.textSecondary },
});
