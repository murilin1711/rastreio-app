import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import type { SexoNascimento, TabagismoStatus } from '@core/perfil/tipos';
import { usePerfil } from '@core/perfil/usePerfil';
import { useSessao } from '@core/sessao/SessaoProvider';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { PassoPerfil } from '@modules/minha-saude/PassoPerfil';
import { CHAVES_CONDICAO, OPCOES_CONDICOES, OPCOES_SEXO, OPCOES_TABAGISMO, type CondicaoChave } from '@modules/minha-saude/opcoes';
import { CampoData, Colors, Input, Opcoes, Spacing, Typography } from '@ui/index';

const numero = (v: string) => (v.trim() ? Number(v.replace(',', '.')) : null);

/**
 * Perfil inicial curto (spec §6): nascimento → sexo → colo do útero (se feminino) → altura/peso → tabagismo → condições.
 * O restante do perfil é preenchido em Minha Saúde.
 */
export default function PerfilInicial() {
  const router = useRouter();
  const { sessao } = useSessao();
  const { salvar } = usePerfil();
  const [passo, setPasso] = useState(1);
  const [salvando, setSalvando] = useState(false);

  const [dataNascimento, setDataNascimento] = useState<string | null>(null);
  const [sexo, setSexo] = useState<SexoNascimento | null>(null);
  const [possuiColo, setPossuiColo] = useState<'sim' | 'nao' | null>(null);
  const [altura, setAltura] = useState('');
  const [peso, setPeso] = useState('');
  const [tabagismo, setTabagismo] = useState<TabagismoStatus | null>(null);
  const [cigarros, setCigarros] = useState('');
  const [anos, setAnos] = useState('');
  const [cessacao, setCessacao] = useState<string | null>(null);
  const [condicoes, setCondicoes] = useState<CondicaoChave[]>([]);

  const feminino = sexo === 'feminino';
  const TOTAL = feminino ? 6 : 5;
  // Passo lógico 3 (colo do útero) só existe para sexo feminino.
  const logico = feminino || passo < 3 ? passo : passo + 1;

  const alternarCondicao = (c: CondicaoChave) =>
    setCondicoes((lista) => {
      if (c === 'nenhuma') return ['nenhuma'];
      const semNenhuma = lista.filter((x) => x !== 'nenhuma');
      return semNenhuma.includes(c) ? semNenhuma.filter((x) => x !== c) : [...semNenhuma, c];
    });

  const concluir = async (pularCondicoes = false) => {
    if (!sessao) return;
    setSalvando(true);
    try {
      const fuma = tabagismo != null && tabagismo !== 'nunca';
      const cond = pularCondicoes
        ? {}
        : Object.fromEntries(CHAVES_CONDICAO.map((k) => [k, condicoes.includes(k)]));

      await salvar({
        dataNascimento,
        sexoNascimento: sexo,
        possuiColoUtero: feminino ? possuiColo === 'sim' : false,
        histerectomia: feminino ? possuiColo === 'nao' : null,
        alturaCm: numero(altura),
        tabagismoStatus: tabagismo,
        cigarrosDia: fuma ? numero(cigarros) : null,
        anosFumando: fuma ? numero(anos) : null,
        dataCessacao: tabagismo === 'ex' ? cessacao : null,
        ...cond,
        perfilInicialCompleto: true,
      });

      const kg = numero(peso);
      if (kg) {
        const { error } = await supabase.from('medidas').insert({
          user_id: sessao.user.id,
          tipo: 'peso',
          medido_em: new Date().toISOString(),
          valores: { kg },
        });
        if (error) throw traduzirErro(error);
      }
      router.replace('/');
    } catch (e) {
      Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario);
    } finally {
      setSalvando(false);
    }
  };

  const avancar = () => (passo === TOTAL ? concluir() : setPasso(passo + 1));
  const pular = () => (passo === TOTAL ? concluir(true) : setPasso(passo + 1));
  const comum = {
    passo, total: TOTAL, salvando,
    ultimo: passo === TOTAL,
    onAvancar: avancar,
    onVoltar: passo > 1 ? () => setPasso(passo - 1) : undefined,
  };

  switch (logico) {
    case 1:
      return (
        <PassoPerfil {...comum} titulo="Quando você nasceu?" ajuda="Sua idade define quais acompanhamentos fazem sentido para você." podeAvancar={!!dataNascimento}>
          <CampoData valor={dataNascimento} onChange={setDataNascimento} />
        </PassoPerfil>
      );
    case 2:
      return (
        <PassoPerfil {...comum} titulo="Sexo atribuído ao nascimento" ajuda="Alguns rastreamentos dependem de órgãos presentes ao nascer. Essa informação não define sua identidade." podeAvancar={!!sexo}>
          <Opcoes opcoes={OPCOES_SEXO} valor={sexo} onChange={setSexo} />
        </PassoPerfil>
      );
    case 3:
      return (
        <PassoPerfil {...comum} titulo="Você tem colo do útero?" ajuda="Quem passou por histerectomia total não tem colo do útero. Se não tiver certeza, marque sim e confirme com seu médico." podeAvancar={!!possuiColo}>
          <Opcoes
            opcoes={[{ valor: 'sim', rotulo: 'Sim' }, { valor: 'nao', rotulo: 'Não', descricao: 'Fiz histerectomia' }]}
            valor={possuiColo}
            onChange={setPossuiColo}
          />
        </PassoPerfil>
      );
    case 4:
      return (
        <PassoPerfil {...comum} titulo="Altura e peso" ajuda="A altura fica no seu perfil. O peso você atualiza quando quiser." podeAvancar={!!altura.trim() || !!peso.trim()} podePular onPular={pular}>
          <View style={{ gap: Spacing.md }}>
            <Input placeholder="Altura em cm, por exemplo 165" keyboardType="decimal-pad" value={altura} onChangeText={setAltura} />
            <Input placeholder="Peso em kg, por exemplo 67,5" keyboardType="decimal-pad" value={peso} onChangeText={setPeso} />
          </View>
        </PassoPerfil>
      );
    case 5:
      return (
        <PassoPerfil {...comum} titulo="Você fuma ou já fumou?" ajuda="Essa informação alimenta o risco cardiovascular e o rastreamento de câncer de pulmão." podeAvancar={!!tabagismo} podePular onPular={pular}>
          <View style={{ gap: Spacing.md }}>
            <Opcoes opcoes={OPCOES_TABAGISMO} valor={tabagismo} onChange={setTabagismo} />
            {tabagismo && tabagismo !== 'nunca' ? (
              <>
                <Input placeholder="Cigarros por dia, em média" keyboardType="number-pad" value={cigarros} onChangeText={setCigarros} />
                <Input placeholder="Anos fumando" keyboardType="decimal-pad" value={anos} onChangeText={setAnos} />
              </>
            ) : null}
            {tabagismo === 'ex' ? <CampoData rotulo="Quando parou?" valor={cessacao} onChange={setCessacao} /> : null}
          </View>
        </PassoPerfil>
      );
    default:
      return (
        <PassoPerfil {...comum} titulo="Você tem alguma destas condições?" ajuda="Marque todas que se aplicam." podeAvancar={condicoes.length > 0} podePular onPular={pular}>
          <Opcoes opcoes={OPCOES_CONDICOES} valor={condicoes} onChange={alternarCondicao} multiplo />
          <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xl }}>
            Antecedentes familiares e histórico pessoal podem ser preenchidos depois, em Minha Saúde.
          </Text>
        </PassoPerfil>
      );
  }
}
