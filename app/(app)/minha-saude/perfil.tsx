import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calcularIdade, calcularMacosAno } from '@core/perfil/calculos';
import type { PerfilSaude } from '@core/perfil/tipos';
import { usePerfil } from '@core/perfil/usePerfil';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { ListaTexto } from '@modules/minha-saude/ListaTexto';
import { Secao } from '@modules/minha-saude/Secao';
import { CHAVES_CONDICAO, OPCOES_CONDICOES, OPCOES_SEXO, OPCOES_SIM_NAO, OPCOES_TABAGISMO, type CondicaoChave } from '@modules/minha-saude/opcoes';
import { Button, CampoData, Colors, Input, InternalHeader, Opcoes, Spacing, Typography } from '@ui/index';

type Form = Omit<PerfilSaude, 'userId' | 'perfilInicialCompleto'>;

const numero = (v: string) => (v.trim() ? Number(v.replace(',', '.')) : null);
const simNao = (b: boolean | null) => (b == null ? null : b ? 'sim' : 'nao');

export default function MeuPerfil() {
  const router = useRouter();
  const { online } = useSessao();
  const { perfil, carregando, salvar } = usePerfil();
  const [f, setF] = useState<Form | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (perfil && !f) {
      const { userId, perfilInicialCompleto, ...resto } = perfil;
      setF(resto);
    }
  }, [perfil, f]);

  if (carregando || !f) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((a) => (a ? { ...a, [k]: v } : a));
  const condicoesMarcadas = CHAVES_CONDICAO.filter((k) => f[k] === true);
  const alternarCondicao = (c: CondicaoChave) => {
    if (c === 'nenhuma') {
      setF((a) => (a ? { ...a, ...Object.fromEntries(CHAVES_CONDICAO.map((k) => [k, false])) } : a));
      return;
    }
    set(c, !f[c]);
  };

  const gravar = async () => {
    setSalvando(true);
    try {
      await salvar(f);
      router.back();
    } catch (e) {
      Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario);
    } finally {
      setSalvando(false);
    }
  };

  const idade = f.dataNascimento ? calcularIdade(f.dataNascimento) : null;
  const macos = f.tabagismoStatus && f.tabagismoStatus !== 'nunca' ? calcularMacosAno(f.cigarrosDia, f.anosFumando) : null;
  const fuma = f.tabagismoStatus != null && f.tabagismoStatus !== 'nunca';

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Minha Saúde" title="Meu perfil" />

        <Secao titulo="Dados básicos">
          <Input placeholder="Nome" value={f.nome} onChangeText={(v) => set('nome', v)} />
          <CampoData rotulo={idade != null ? `Data de nascimento (${idade} anos)` : 'Data de nascimento'} valor={f.dataNascimento} onChange={(v) => set('dataNascimento', v)} />
          <Text style={styles.rotulo}>Sexo atribuído ao nascimento</Text>
          <Opcoes opcoes={OPCOES_SEXO} valor={f.sexoNascimento} onChange={(v) => set('sexoNascimento', v)} />
          {f.sexoNascimento === 'feminino' ? (
            <>
              <Text style={styles.rotulo}>Tem colo do útero?</Text>
              <Opcoes
                opcoes={[{ valor: 'sim', rotulo: 'Sim' }, { valor: 'nao', rotulo: 'Não', descricao: 'Fiz histerectomia' }]}
                valor={simNao(f.possuiColoUtero)}
                onChange={(v) => { set('possuiColoUtero', v === 'sim'); set('histerectomia', v === 'nao'); }}
              />
            </>
          ) : null}
          <Input placeholder="Altura em cm" keyboardType="decimal-pad" value={f.alturaCm?.toString() ?? ''} onChangeText={(v) => set('alturaCm', numero(v))} />
        </Secao>

        <Secao titulo={macos != null ? `Tabagismo (${macos} maços-ano)` : 'Tabagismo'}>
          <Opcoes opcoes={OPCOES_TABAGISMO} valor={f.tabagismoStatus} onChange={(v) => set('tabagismoStatus', v)} />
          {fuma ? (
            <>
              <Input placeholder="Cigarros por dia, em média" keyboardType="number-pad" value={f.cigarrosDia?.toString() ?? ''} onChangeText={(v) => set('cigarrosDia', numero(v))} />
              <Input placeholder="Anos fumando" keyboardType="decimal-pad" value={f.anosFumando?.toString() ?? ''} onChangeText={(v) => set('anosFumando', numero(v))} />
            </>
          ) : null}
          {f.tabagismoStatus === 'ex' ? <CampoData rotulo="Quando parou?" valor={f.dataCessacao} onChange={(v) => set('dataCessacao', v)} /> : null}
        </Secao>

        <Secao titulo="Condições de saúde">
          <Opcoes opcoes={OPCOES_CONDICOES} valor={condicoesMarcadas.length ? condicoesMarcadas : ['nenhuma']} onChange={alternarCondicao} multiplo />
        </Secao>

        <Secao titulo="Já teve câncer?">
          <ListaTexto comAno placeholder="Tipo de câncer" itens={f.historicoCancerPessoal.map((h) => ({ texto: h.tipo, ano: h.ano }))} onChange={(l) => set('historicoCancerPessoal', l.map((i) => ({ tipo: i.texto, ano: i.ano })))} />
        </Secao>

        <Secao titulo="Lesões precursoras">
          <Text style={styles.ajuda}>Pólipos, NIC, lesões pré-malignas informadas em exames anteriores.</Text>
          <ListaTexto comAno placeholder="Lesão" itens={f.lesoesPrecursoras.map((h) => ({ texto: h.tipo, ano: h.ano }))} onChange={(l) => set('lesoesPrecursoras', l.map((i) => ({ tipo: i.texto, ano: i.ano })))} />
        </Secao>

        <Secao titulo="Doenças genéticas conhecidas">
          <ListaTexto placeholder="Por exemplo BRCA1, Lynch, PAF" itens={f.doencasGeneticas.map((d) => ({ texto: d.nome }))} onChange={(l) => set('doencasGeneticas', l.map((i) => ({ nome: i.texto })))} />
        </Secao>

        <Secao titulo="Fez radioterapia no tórax antes dos 30 anos?">
          <Opcoes opcoes={OPCOES_SIM_NAO} valor={simNao(f.radioterapiaToracica)} onChange={(v) => set('radioterapiaToracica', v === 'sim')} />
        </Secao>

        {!online ? <Text style={styles.offline}>Sem conexão com a internet. Você poderá salvar quando a rede voltar.</Text> : null}
        <Button label="Salvar" onPress={gravar} loading={salvando} disabled={!online} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary },
  ajuda: { ...Typography.caption, color: Colors.textSecondary },
  offline: { ...Typography.caption, color: Colors.warning, textAlign: 'center', marginBottom: Spacing.sm },
});
