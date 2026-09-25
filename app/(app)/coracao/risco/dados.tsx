import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMedicacoes } from '@core/medicacoes/useMedicacoes';
import { useRiscoCv } from '@core/cardio/useRiscoCv';
import { ckdEpi2021 } from '@core/regras/cardio/ckdEpi';
import { imcDe } from '@core/regras/cardio/dadoRecente';
import { CoeficientesIndisponiveis, type EntradasPrevent } from '@core/regras/cardio/prevent';
import type { EntradaPrevent } from '@core/regras/cardio/tiposRisco';
import { traduzirErro } from '@core/supabase/erros';
import { dataLongaBr } from '@modules/coracao/componentes/formato';
import { coeficientesPendentes, ROTULO_ESTADO } from '@modules/coracao/conteudo/risco';
import { Button, Colors, completarPiso, EsperaNero, Input, InternalHeader, Opcoes, Radius, Spacing, Typography } from '@ui/index';

type Resp = Record<string, string>;
const numero = (t: string | undefined) => (!t || t.trim() === '' ? null : Number(t.replace(',', '.')));

/** "Deseja utilizar seus dados mais recentes?" (§14, C-014): cada variável com valor, data, origem e estado. */
export default function DadosRisco() {
  const router = useRouter();
  const { entradas, parametros, carregando, calcular, salvarPerfil, perfil } = useRiscoCv();
  const { ativas } = useMedicacoes();
  const [resp, setResp] = useState<Resp>({});
  const [usarAntigo, setUsarAntigo] = useState<Record<string, 'sim' | 'nao'>>({});
  const [antiHt, setAntiHt] = useState<'sim' | 'nao' | null>(null);
  const [estatina, setEstatina] = useState<'sim' | 'nao' | null>(null);
  const [fuma, setFuma] = useState<'sim' | 'nao' | null>(null);
  const [calculando, setCalculando] = useState(false);
  const cancelado = useRef(false);

  useEffect(() => {
    if (!entradas) return;
    const tab = entradas.find((e) => e.chave === 'tabagismo');
    if (tab?.valor != null && fuma === null) setFuma(tab.valor ? 'sim' : 'nao');
    // Medicações: o app não classifica fármacos; sugere "sim" se há medicação ativa e o paciente confirma
    if (antiHt === null && ativas.length === 0) setAntiHt('nao');
    if (estatina === null && ativas.length === 0) setEstatina('nao');
  }, [entradas, ativas.length, fuma, antiHt, estatina]);

  if (!entradas || !parametros) return <SafeAreaView style={styles.tela} edges={['top']}><View style={styles.conteudo}><InternalHeader sectionLabel="Meu Risco" title="Seus dados" /><Text style={styles.texto}>{carregando ? 'Reunindo seus dados…' : 'Não foi possível carregar.'}</Text></View></SafeAreaView>;

  const por = Object.fromEntries(entradas.map((e) => [e.chave, e])) as Record<EntradaPrevent['chave'], EntradaPrevent>;
  const valorDe = (e: EntradaPrevent): number | null => {
    const digitado = numero(resp[e.chave]);
    if (digitado != null) return digitado;
    if (e.estado === 'atual') return typeof e.valor === 'number' ? e.valor : null;
    if (e.estado === 'antigo' && usarAntigo[e.chave] === 'sim') return typeof e.valor === 'number' ? e.valor : null;
    return null;
  };

  const linhas: { e: EntradaPrevent; placeholder: string }[] = [
    { e: por.pas, placeholder: 'Sistólica em mmHg' },
    { e: por.colesterolTotal, placeholder: 'mg/dL' },
    { e: por.hdl, placeholder: 'mg/dL' },
    { e: por.tfg, placeholder: 'TFG (ou deixe e informe creatinina abaixo)' },
    { e: por.hba1c, placeholder: '% (opcional)' },
    { e: por.rac, placeholder: 'mg/g (opcional)' },
  ];

  const calcularAgora = async () => {
    const pas = valorDe(por.pas);
    const ct = valorDe(por.colesterolTotal);
    const hdl = valorDe(por.hdl);
    let tfg = valorDe(por.tfg);
    const creat = numero(resp.creatinina);
    const peso = numero(resp.peso);
    const imc = peso && perfil?.alturaCm ? imcDe(peso, perfil.alturaCm) : valorDe(por.imc);
    const idade = por.idade.valor as number | null;
    const sexo = por.sexo.valor as 'feminino' | 'masculino' | null;
    if (tfg == null && creat != null && idade != null && sexo) tfg = ckdEpi2021(creat, idade, sexo);
    if (pas == null || ct == null || hdl == null || tfg == null || imc == null || idade == null || !sexo || antiHt === null || estatina === null || fuma === null || por.diabetes.valor == null) {
      Alert.alert('Faltam dados', 'Preencha ou confirme todos os itens obrigatórios (pressão, colesterol total, HDL, função renal, peso, remédios e tabagismo).');
      return;
    }
    const e: EntradasPrevent = { sexo, idade, colesterolTotal: ct, hdl, pas, antiHipertensivo: antiHt === 'sim', estatina: estatina === 'sim', diabetes: Boolean(por.diabetes.valor), tabagismoAtual: fuma === 'sim', imc, tfg, hba1c: valorDe(por.hba1c) ?? undefined, rac: valorDe(por.rac) ?? undefined };
    const usadas: EntradaPrevent[] = entradas.map((x) => {
      const v = x.chave === 'antiHipertensivo' ? antiHt === 'sim' : x.chave === 'estatina' ? estatina === 'sim' : x.chave === 'tabagismo' ? fuma === 'sim' : x.chave === 'imc' ? imc : x.chave === 'tfg' ? tfg : ['pas', 'colesterolTotal', 'hdl', 'hba1c', 'rac'].includes(x.chave) ? valorDe(x) : x.valor;
      const digitado = resp[x.chave] != null && resp[x.chave] !== '';
      return { ...x, valor: v, origem: digitado ? 'digitado' : x.origem, data: digitado ? new Date().toISOString().slice(0, 10) : x.data, estado: v == null ? 'faltando' : x.estado };
    });
    cancelado.current = false;
    const inicio = Date.now();
    setCalculando(true);
    try {
      if (perfil && fuma !== null) await salvarPerfil({ tabagismoStatus: fuma === 'sim' ? 'atual' : perfil.tabagismoStatus === 'atual' ? 'ex' : perfil.tabagismoStatus }).catch(() => {});
      await calcular(e, usadas);
      // O PREVENT roda local e termina quase instantâneo — sem o piso o Nero só piscaria (D-023).
      await completarPiso(inicio);
      // Cancelar só impede a ida ao resultado: o cálculo em si já rodou e fica guardado,
      // então quem desistir e voltar a calcular não perde nada.
      if (!cancelado.current) router.replace('/(app)/coracao/risco/resultado');
    } catch (err) {
      if (cancelado.current) return;
      if (err instanceof CoeficientesIndisponiveis) Alert.alert('Ainda não disponível', coeficientesPendentes);
      else Alert.alert('Não foi possível calcular', traduzirErro(err).mensagemUsuario);
    } finally {
      setCalculando(false);
    }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Meu Risco" title="Deseja utilizar seus dados mais recentes?" />
        <Text style={styles.sub}>Confira cada item. O que está atual entra direto; o que está antigo ou faltando você atualiza aqui.</Text>

        <View style={styles.linha}><Text style={styles.rotulo}>Idade e sexo</Text><Text style={styles.texto}>{por.idade.valor ?? '—'} anos · {por.sexo.valor === 'feminino' ? 'feminino' : por.sexo.valor === 'masculino' ? 'masculino' : '—'}</Text></View>
        <View style={styles.linha}><Text style={styles.rotulo}>Diabetes</Text><Text style={styles.texto}>{por.diabetes.valor === true ? 'Sim' : por.diabetes.valor === false ? 'Não' : 'Não informado no perfil'}</Text></View>

        {linhas.map(({ e, placeholder }) => (
          <View key={e.chave} style={styles.linha}>
            <View style={styles.cab}><Text style={styles.rotulo}>{e.rotulo}</Text><Text style={[styles.estado, e.estado === 'atual' ? styles.estadoOk : e.estado === 'antigo' ? styles.estadoAntigo : styles.estadoFalta]}>{ROTULO_ESTADO[e.estado]}</Text></View>
            {e.valor != null && typeof e.valor === 'number' ? <Text style={styles.texto}>{String(e.valor).replace('.', ',')} {e.unidade ?? ''}{e.data ? ` · ${dataLongaBr(e.data)}` : ''}</Text> : null}
            {e.estado === 'antigo' ? (
              <Opcoes<'sim' | 'nao'> opcoes={[{ valor: 'sim', rotulo: 'Usar este valor mesmo assim' }, { valor: 'nao', rotulo: 'Tenho um mais recente' }]} valor={usarAntigo[e.chave] ?? null} onChange={(v) => setUsarAntigo({ ...usarAntigo, [e.chave]: v })} />
            ) : null}
            {e.estado === 'faltando' || usarAntigo[e.chave] === 'nao' ? <Input value={resp[e.chave] ?? ''} onChangeText={(v) => setResp({ ...resp, [e.chave]: v })} placeholder={placeholder} keyboardType="decimal-pad" /> : null}
            {e.chave === 'tfg' && (e.estado === 'faltando' || usarAntigo.tfg === 'nao') ? <Input value={resp.creatinina ?? ''} onChangeText={(v) => setResp({ ...resp, creatinina: v })} placeholder="ou creatinina em mg/dL" keyboardType="decimal-pad" style={{ marginTop: Spacing.sm }} /> : null}
            {e.chave === 'pas' && e.estado === 'faltando' ? <Text style={styles.nota}>Sem medidas recentes: meça agora (sentado, após 5 minutos de repouso) ou inicie uma MRPA.</Text> : null}
          </View>
        ))}

        <View style={styles.linha}>
          <View style={styles.cab}><Text style={styles.rotulo}>{por.imc.rotulo}</Text><Text style={[styles.estado, por.imc.estado === 'atual' ? styles.estadoOk : por.imc.estado === 'antigo' ? styles.estadoAntigo : styles.estadoFalta]}>{ROTULO_ESTADO[por.imc.estado]}</Text></View>
          {typeof por.imc.valor === 'number' ? <Text style={styles.texto}>IMC {String(por.imc.valor).replace('.', ',')}{por.imc.data ? ` · peso de ${dataLongaBr(por.imc.data)}` : ''}</Text> : null}
          {por.imc.estado !== 'atual' ? <Input value={resp.peso ?? ''} onChangeText={(v) => setResp({ ...resp, peso: v })} placeholder={perfil?.alturaCm ? 'Peso atual em kg' : 'Informe a altura no perfil'} keyboardType="decimal-pad" /> : null}
        </View>

        <View style={styles.linha}><Text style={styles.rotulo}>Você usa remédio para pressão?</Text><Opcoes<'sim' | 'nao'> opcoes={[{ valor: 'sim', rotulo: 'Sim' }, { valor: 'nao', rotulo: 'Não' }]} valor={antiHt} onChange={setAntiHt} />{ativas.length ? <Text style={styles.nota}>Seus medicamentos: {ativas.map((m) => m.nome).join(', ')}.</Text> : null}</View>
        <View style={styles.linha}><Text style={styles.rotulo}>Você usa estatina (remédio para colesterol)?</Text><Opcoes<'sim' | 'nao'> opcoes={[{ valor: 'sim', rotulo: 'Sim' }, { valor: 'nao', rotulo: 'Não' }]} valor={estatina} onChange={setEstatina} /></View>
        <View style={styles.linha}><Text style={styles.rotulo}>Fuma atualmente?</Text><Opcoes<'sim' | 'nao'> opcoes={[{ valor: 'sim', rotulo: 'Sim' }, { valor: 'nao', rotulo: 'Não' }]} valor={fuma} onChange={setFuma} /></View>

        <Button label="Calcular meu risco" onPress={calcularAgora} disabled={calculando} style={{ marginTop: Spacing.xxl }} />
        <EsperaNero
          visivel={calculando}
          titulo="Calculando seu risco…"
          detalhe="Isso leva alguns segundos."
          onCancelar={() => { cancelado.current = true; setCalculando(false); }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  sub: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  linha: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
  cab: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary },
  texto: { ...Typography.body, color: Colors.textPrimary },
  nota: { ...Typography.caption, color: Colors.textSecondary },
  estado: { ...Typography.caption, borderRadius: Radius.chip, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  estadoOk: { color: Colors.success, backgroundColor: '#dcfce7' },
  estadoAntigo: { color: Colors.warning, backgroundColor: '#fef3c7' },
  estadoFalta: { color: Colors.textSecondary, backgroundColor: Colors.surfaceAlt },
});
