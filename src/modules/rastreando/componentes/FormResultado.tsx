import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TipoExameRastreamento } from '@core/rastreando/tipos';
import { CampoData, Colors, Input, Opcoes, Select, Spacing, Typography, type Opcao } from '@ui/index';

export type Resultado = Record<string, unknown>;

interface Props {
  tipo: TipoExameRastreamento;
  valor: Resultado;
  onChange: (r: Resultado) => void;
}

const SIM_NAO: Opcao<'sim' | 'nao'>[] = [{ valor: 'sim', rotulo: 'Sim' }, { valor: 'nao', rotulo: 'Não' }];
const bool = (v: unknown) => (v === true ? 'sim' : v === false ? 'nao' : null);

const BIRADS: Opcao<'0' | '1' | '2' | '3' | '4' | '5' | '6'>[] = [
  { valor: '0', rotulo: 'BI-RADS 0', descricao: 'Inconclusivo — precisa de complementação' },
  { valor: '1', rotulo: 'BI-RADS 1', descricao: 'Negativo' },
  { valor: '2', rotulo: 'BI-RADS 2', descricao: 'Achado benigno' },
  { valor: '3', rotulo: 'BI-RADS 3', descricao: 'Provavelmente benigno — controle em curto intervalo' },
  { valor: '4', rotulo: 'BI-RADS 4', descricao: 'Suspeito — investigação' },
  { valor: '5', rotulo: 'BI-RADS 5', descricao: 'Altamente suspeito' },
  { valor: '6', rotulo: 'BI-RADS 6', descricao: 'Malignidade já confirmada por biópsia' },
];
const DENSIDADE: Opcao<'a' | 'b' | 'c' | 'd'>[] = [
  { valor: 'a', rotulo: 'A — predominantemente adiposa' }, { valor: 'b', rotulo: 'B — densidade fibroglandular esparsa' },
  { valor: 'c', rotulo: 'C — heterogeneamente densa' }, { valor: 'd', rotulo: 'D — extremamente densa' },
];
const HPV: Opcao<'negativo' | '16_18' | 'outros_oncogenicos' | 'invalido'>[] = [
  { valor: 'negativo', rotulo: 'Negativo', descricao: 'HPV oncogênico não detectado' },
  { valor: '16_18', rotulo: 'HPV 16 e/ou 18 detectado' },
  { valor: 'outros_oncogenicos', rotulo: 'Outros tipos oncogênicos detectados', descricao: 'Não 16/18 — o laudo costuma trazer a citologia reflexa' },
  { valor: 'invalido', rotulo: 'Inválido / inconclusivo', descricao: 'Precisa de nova coleta' },
];
const CITOLOGIA: Opcao<string>[] = [
  { valor: 'negativa', rotulo: 'Negativa (sem alterações)' }, { valor: 'insatisfatoria', rotulo: 'Amostra insatisfatória' },
  { valor: 'asc_us', rotulo: 'ASC-US' }, { valor: 'asc_h', rotulo: 'ASC-H' }, { valor: 'lsil', rotulo: 'LSIL (baixo grau)' },
  { valor: 'hsil', rotulo: 'HSIL (alto grau)' }, { valor: 'agc', rotulo: 'AGC (células glandulares atípicas)' },
  { valor: 'ais', rotulo: 'AIS (adenocarcinoma in situ)' }, { valor: 'suspeita_malignidade', rotulo: 'Suspeita de malignidade' },
];
const COLPO: Opcao<string>[] = [
  { valor: 'normal', rotulo: 'Sem alterações' }, { valor: 'nic1', rotulo: 'NIC 1' }, { valor: 'nic2', rotulo: 'NIC 2' }, { valor: 'nic3', rotulo: 'NIC 3' },
  { valor: 'ais', rotulo: 'AIS' }, { valor: 'carcinoma', rotulo: 'Carcinoma' }, { valor: 'inconclusiva', rotulo: 'Inconclusiva' },
];
const FIT: Opcao<'negativo' | 'positivo'>[] = [{ valor: 'negativo', rotulo: 'Negativo', descricao: 'Sem sangue oculto' }, { valor: 'positivo', rotulo: 'Positivo', descricao: 'Sangue oculto detectado' }];
const ACHADO_COLONO: Opcao<string>[] = [
  { valor: 'normal', rotulo: 'Sem alterações' }, { valor: 'polipos', rotulo: 'Pólipos' }, { valor: 'massa_suspeita', rotulo: 'Massa ou lesão suspeita' }, { valor: 'incompleta', rotulo: 'Exame incompleto' },
];
const HISTO: Opcao<string>[] = [
  { valor: 'aguardando', rotulo: 'Aguardando resultado' }, { valor: 'hiperplasico', rotulo: 'Pólipo hiperplásico' }, { valor: 'adenoma', rotulo: 'Adenoma' },
  { valor: 'adenoma_avancado', rotulo: 'Adenoma avançado' }, { valor: 'carcinoma', rotulo: 'Carcinoma' },
];
const LUNGRADS: Opcao<string>[] = [
  { valor: '0', rotulo: 'Lung-RADS 0', descricao: 'Incompleto' }, { valor: '1', rotulo: 'Lung-RADS 1', descricao: 'Negativo' }, { valor: '2', rotulo: 'Lung-RADS 2', descricao: 'Benigno' },
  { valor: '3', rotulo: 'Lung-RADS 3', descricao: 'Provavelmente benigno' }, { valor: '4A', rotulo: 'Lung-RADS 4A', descricao: 'Suspeito' }, { valor: '4B', rotulo: 'Lung-RADS 4B', descricao: 'Muito suspeito' }, { valor: '4X', rotulo: 'Lung-RADS 4X' },
];

/** Verifica se o resultado tem o mínimo para o motor classificar. */
export function resultadoValido(tipo: TipoExameRastreamento, r: Resultado): boolean {
  switch (tipo) {
    case 'mamografia': return typeof r.birads === 'number';
    case 'dna_hpv': return typeof r.hpv === 'string';
    case 'citologia': return typeof r.citologia === 'string';
    case 'colposcopia': return typeof r.achado === 'string';
    case 'fit': return typeof r.fit === 'string';
    case 'colonoscopia': {
      if (typeof r.achado !== 'string') return false;
      if (r.achado === 'normal') return typeof r.qualidade_adequada === 'boolean';
      if (r.achado === 'polipos') return typeof (r.polipos as { histopatologico?: string } | undefined)?.histopatologico === 'string';
      return true;
    }
    case 'tcbd': return typeof r.lungrads === 'string';
    case 'psa': return typeof r.psa_total === 'number' && typeof r.referencia_max === 'number';
  }
}

const num = (v: string) => (v.trim() ? Number(v.replace(',', '.')) : undefined);

/** Campos estruturados por tipo de exame (spec §4.3). */
export function FormResultado({ tipo, valor, onChange }: Props) {
  const set = (patch: Resultado) => onChange({ ...valor, ...patch });
  const polipos = (valor.polipos as Record<string, unknown> | undefined) ?? {};
  const setPolipo = (patch: Resultado) => set({ polipos: { ...polipos, ...patch } });

  switch (tipo) {
    case 'mamografia':
      return (
        <View style={styles.grupo}>
          <Text style={styles.rotulo}>Categoria BI-RADS do laudo</Text>
          <Opcoes opcoes={BIRADS} valor={valor.birads != null ? String(valor.birads) as never : null} onChange={(v) => set({ birads: Number(v) })} />
          {valor.birads === 3 ? <Input placeholder="Intervalo de controle indicado no laudo (meses)" keyboardType="number-pad" value={valor.intervalo_laudo_meses?.toString() ?? ''} onChangeText={(v) => set({ intervalo_laudo_meses: num(v) })} /> : null}
          <Text style={styles.rotulo}>Densidade mamária (opcional)</Text>
          <Select placeholder="Não informada" opcoes={DENSIDADE} valor={(valor.densidade as never) ?? null} onChange={(v) => set({ densidade: v })} />
        </View>
      );
    case 'dna_hpv':
      return (
        <View style={styles.grupo}>
          <Text style={styles.rotulo}>Resultado do teste de DNA-HPV</Text>
          <Opcoes opcoes={HPV} valor={(valor.hpv as never) ?? null} onChange={(v) => set({ hpv: v, citologia_reflexa: v === 'outros_oncogenicos' ? valor.citologia_reflexa : undefined })} />
          {valor.hpv === 'outros_oncogenicos' ? (<>
            <Text style={styles.rotulo}>Citologia reflexa (no mesmo laudo)</Text>
            <Select placeholder="Não informada no laudo" opcoes={CITOLOGIA} valor={(valor.citologia_reflexa as string) ?? null} onChange={(v) => set({ citologia_reflexa: v })} />
            <Text style={styles.dica}>Sem a citologia reflexa o NERO não consegue definir a próxima etapa — o exame fica pendente até você completar.</Text>
          </>) : null}
        </View>
      );
    case 'citologia':
      return <View style={styles.grupo}><Text style={styles.rotulo}>Resultado da citologia</Text><Select placeholder="Selecione" opcoes={CITOLOGIA} valor={(valor.citologia as string) ?? null} onChange={(v) => set({ citologia: v })} /></View>;
    case 'colposcopia':
      return <View style={styles.grupo}><Text style={styles.rotulo}>Achado da colposcopia / biópsia</Text><Select placeholder="Selecione" opcoes={COLPO} valor={(valor.achado as string) ?? null} onChange={(v) => set({ achado: v })} /></View>;
    case 'fit':
      return <View style={styles.grupo}><Text style={styles.rotulo}>Resultado do FIT</Text><Opcoes opcoes={FIT} valor={(valor.fit as never) ?? null} onChange={(v) => set({ fit: v })} /></View>;
    case 'colonoscopia':
      return (
        <View style={styles.grupo}>
          <Text style={styles.rotulo}>Achado principal</Text>
          <Opcoes opcoes={ACHADO_COLONO} valor={(valor.achado as never) ?? null} onChange={(v) => set({ achado: v })} />
          {valor.achado === 'normal' || valor.achado === 'polipos' ? (<>
            <Text style={styles.rotulo}>O exame foi completo e com preparo adequado?</Text>
            <Opcoes opcoes={SIM_NAO} valor={bool(valor.qualidade_adequada)} onChange={(v) => set({ qualidade_adequada: v === 'sim' })} />
          </>) : null}
          {valor.achado === 'polipos' ? (<>
            <Input placeholder="Quantidade de pólipos" keyboardType="number-pad" value={polipos.quantidade?.toString() ?? ''} onChangeText={(v) => setPolipo({ quantidade: num(v) })} />
            <Input placeholder="Tamanho do maior (mm)" keyboardType="decimal-pad" value={polipos.maior_mm?.toString() ?? ''} onChangeText={(v) => setPolipo({ maior_mm: num(v) })} />
            <Text style={styles.rotulo}>Foram removidos?</Text>
            <Opcoes opcoes={SIM_NAO} valor={bool(polipos.removidos)} onChange={(v) => setPolipo({ removidos: v === 'sim' })} />
            <Text style={styles.rotulo}>Histopatológico</Text>
            <Select placeholder="Selecione" opcoes={HISTO} valor={(polipos.histopatologico as string) ?? null} onChange={(v) => setPolipo({ histopatologico: v })} />
            {polipos.histopatologico === 'adenoma' || polipos.histopatologico === 'adenoma_avancado' ? <Input placeholder="Intervalo de controle indicado no laudo (meses)" keyboardType="number-pad" value={valor.intervalo_laudo_meses?.toString() ?? ''} onChangeText={(v) => set({ intervalo_laudo_meses: num(v) })} /> : null}
          </>) : null}
        </View>
      );
    case 'tcbd':
      return (
        <View style={styles.grupo}>
          <Text style={styles.rotulo}>Categoria Lung-RADS do laudo</Text>
          <Opcoes opcoes={LUNGRADS} valor={(valor.lungrads as never) ?? null} onChange={(v) => set({ lungrads: v })} />
          <Text style={styles.rotulo}>Modificador S (achado relevante não relacionado ao pulmão)?</Text>
          <Opcoes opcoes={SIM_NAO} valor={bool(valor.modificador_s)} onChange={(v) => set({ modificador_s: v === 'sim' })} />
        </View>
      );
    case 'psa':
      return (
        <View style={styles.grupo}>
          <Input placeholder="PSA total (ng/mL)" keyboardType="decimal-pad" value={valor.psa_total?.toString() ?? ''} onChangeText={(v) => set({ psa_total: num(v) })} />
          <Input placeholder="Valor de referência máximo do laboratório (ng/mL)" keyboardType="decimal-pad" value={valor.referencia_max?.toString() ?? ''} onChangeText={(v) => set({ referencia_max: num(v) })} />
          <Text style={styles.dica}>A referência vem impressa no laudo. Sem ela, o NERO não interpreta o valor — nunca usamos um ponto de corte único.</Text>
          <Input placeholder="PSA livre (ng/mL, opcional)" keyboardType="decimal-pad" value={valor.psa_livre?.toString() ?? ''} onChangeText={(v) => set({ psa_livre: num(v) })} />
          <CampoData rotulo="Seu médico pediu para repetir em (opcional)" futuro valor={(valor.repetir_em as string) ?? null} onChange={(v) => set({ repetir_em: v ?? undefined })} />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  grupo: { gap: Spacing.md },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary },
  dica: { ...Typography.caption, color: Colors.textSecondary },
});
