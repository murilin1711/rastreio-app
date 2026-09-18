import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAtividades } from '@core/bemestar/useAtividades';
import { useCorpo } from '@core/bemestar/useCorpo';
import { useSono } from '@core/bemestar/useSono';
import { formatarHm } from '@core/regras/bemestar/sono';
import type { Meta, TipoMeta } from '@core/regras/bemestar/tipos';
import { traduzirErro } from '@core/supabase/erros';
import { ROTULO_OBJETIVO } from '@modules/bem-estar/conteudo/corpo';
import { Button, Card, Colors, Input, InternalHeader, Opcoes, Select, Spacing, Typography } from '@ui/index';

const fmt = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
const ROTULO_TIPO: Record<TipoMeta, string> = { peso: 'Peso (kg)', cintura: 'Circunferência abdominal (cm)', atividade_min: 'Atividade (minutos por semana)', atividade_dias: 'Dias ativos por semana', fortalecimento_dias: 'Fortalecimento (dias por semana)', sono_min: 'Sono (horas por noite)', pressao: 'Pressão (definida pelo médico)' };
const TIPOS_FORM: TipoMeta[] = ['peso', 'cintura', 'atividade_min', 'atividade_dias', 'fortalecimento_dias', 'sono_min'];
type Origem = 'usuario' | 'profissional';

/** Minhas Metas (§82): objetivos definidos pelo usuário ou com o profissional. O app nunca impõe meta de peso. */
export default function Metas() {
  const router = useRouter();
  const { ultimos, perfil, salvarObjetivo } = useCorpo();
  const { semana, metas } = useAtividades();
  const { resumo: sono } = useSono();
  const [tipo, setTipo] = useState<TipoMeta | null>(null);
  const [valor, setValor] = useState('');
  const [origem, setOrigem] = useState<Origem>('usuario');
  useFocusEffect(useCallback(() => { metas.recarregar(); }, [metas.recarregar]));

  const atualDe = (m: Meta): string | null => {
    switch (m.tipo) {
      case 'peso': return ultimos.peso?.valores.kg != null ? `${fmt(ultimos.peso.valores.kg)} kg` : null;
      case 'cintura': return ultimos.cintura?.valores.cm != null ? `${fmt(ultimos.cintura.valores.cm)} cm` : null;
      case 'atividade_min': return semana ? `${semana.minutosQueContam} min esta semana` : null;
      case 'atividade_dias': return semana ? `${semana.diasAtivos} dias esta semana` : null;
      case 'fortalecimento_dias': return semana ? `${semana.diasFortalecimento} dias esta semana` : null;
      case 'sono_min': return sono?.mediaMin != null ? `${formatarHm(sono.mediaMin)} por noite` : null;
      default: return null;
    }
  };
  const valorDe = (m: Meta) => (m.tipo === 'sono_min' ? `${formatarHm(m.valor)} por noite` : `${fmt(m.valor)} ${m.tipo === 'peso' ? 'kg' : m.tipo === 'cintura' ? 'cm' : m.tipo === 'atividade_min' ? 'min/semana' : 'dias/semana'}`);
  const distancia = (m: Meta): string | null => {
    if (m.tipo === 'peso' && ultimos.peso?.valores.kg != null) { const d = ultimos.peso.valores.kg - m.valor; return d === 0 ? 'Na meta' : `${fmt(Math.abs(d))} kg ${d > 0 ? 'acima' : 'abaixo'} da meta`; }
    if (m.tipo === 'cintura' && ultimos.cintura?.valores.cm != null) { const d = ultimos.cintura.valores.cm - m.valor; return d === 0 ? 'Na meta' : `${fmt(Math.abs(d))} cm ${d > 0 ? 'acima' : 'abaixo'} da meta`; }
    return null;
  };

  const definir = async () => {
    if (!tipo) { Alert.alert('Faltou algo', 'Escolha o tipo da meta.'); return; }
    let v = Number(valor.replace(',', '.'));
    if (tipo === 'sono_min') v = Math.round(v * 60);
    if (!valor.trim() || Number.isNaN(v) || v <= 0) { Alert.alert('Confira o valor', 'Informe um número maior que zero.'); return; }
    if (tipo === 'peso' && (perfil?.objetivoPeso === 'manutencao' || perfil?.objetivoPeso === 'sem_meta')) { Alert.alert('Objetivo de peso', 'Você escolheu manutenção ou sem meta de peso. Para definir um peso-alvo, mude o objetivo em Meu Corpo.'); return; }
    try { await metas.definir({ tipo, valor: v, origem }); setTipo(null); setValor(''); } catch (e) { Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario); }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <InternalHeader sectionLabel="Saúde & Bem-estar" title="Minhas Metas" onBack={() => router.back()} />
        <Text style={styles.sub}>Objetivos definidos por você ou junto com seu profissional. O NERO mostra a distância; não define metas de peso por conta própria.</Text>

        <Text style={styles.secao}>Objetivo de peso</Text>
        <Opcoes opcoes={(Object.keys(ROTULO_OBJETIVO) as (keyof typeof ROTULO_OBJETIVO)[]).map((o) => ({ valor: o, rotulo: ROTULO_OBJETIVO[o] }))} valor={perfil?.objetivoPeso ?? null} onChange={(o) => salvarObjetivo(o).catch(() => Alert.alert('Não foi possível salvar'))} />

        <Text style={styles.secao}>Metas ativas</Text>
        {metas.metas.length === 0 ? <Text style={styles.vazio}>Nenhuma meta definida. Isso é normal — use o módulo só para acompanhar, se preferir.</Text> : null}
        <View style={{ gap: Spacing.sm }}>
          {metas.metas.map((m) => (
            <Card key={m.id} style={styles.card}>
              <Text style={styles.titulo}>{ROTULO_TIPO[m.tipo]}</Text>
              <Text style={styles.valor}>Meta: {valorDe(m)}{m.origem === 'profissional' ? ' · definida com profissional' : m.origem === 'app' ? ' · sugerida' : ''}</Text>
              {atualDe(m) ? <Text style={styles.texto}>Atual: {atualDe(m)}</Text> : null}
              {distancia(m) ? <Text style={styles.nota}>{distancia(m)}</Text> : null}
              <Button label="Encerrar meta" variant="ghost" onPress={() => metas.desativar(m.id).catch(() => {})} />
            </Card>
          ))}
        </View>

        <Text style={styles.secao}>Nova meta</Text>
        <Select opcoes={TIPOS_FORM.map((t) => ({ valor: t, rotulo: ROTULO_TIPO[t] }))} valor={tipo} onChange={setTipo} placeholder="Tipo da meta" />
        <Input value={valor} onChangeText={setValor} placeholder={tipo === 'sono_min' ? 'Horas por noite (ex.: 7,5)' : 'Valor'} keyboardType="decimal-pad" style={{ marginTop: Spacing.sm }} />
        <Text style={styles.rotulo}>Quem definiu</Text>
        <Opcoes<Origem> opcoes={[{ valor: 'usuario', rotulo: 'Eu' }, { valor: 'profissional', rotulo: 'Meu médico ou outro profissional' }]} valor={origem} onChange={setOrigem} />
        <Button label="Salvar meta" onPress={definir} style={{ marginTop: Spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  sub: { ...Typography.body, color: Colors.textSecondary },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  card: { padding: Spacing.lg, gap: Spacing.xs },
  titulo: { ...Typography.subheading, color: Colors.textPrimary },
  valor: { ...Typography.body, color: Colors.textPrimary },
  texto: { ...Typography.body, color: Colors.textSecondary },
  nota: { ...Typography.caption, color: Colors.textSecondary },
  vazio: { ...Typography.body, color: Colors.textSecondary },
});
