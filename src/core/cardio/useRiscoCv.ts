import { useCallback, useEffect, useState } from 'react';
import { usePerfil } from '@core/perfil/usePerfil';
import { calcularIdade } from '@core/perfil/calculos';
import { montarEntradasPrevent } from '@core/regras/cardio/dadoRecente';
import { extrairParametrosRisco } from '@core/regras/cardio/parametrosRisco';
import { calcularPrevent, categoriaPrevent, elegivelPrevent, type EntradasPrevent } from '@core/regras/cardio/prevent';
import type { AgravanteCV, EntradaPrevent, ParametrosRisco } from '@core/regras/cardio/tiposRisco';
import { useSessao } from '@core/sessao/SessaoProvider';
import { carregarRegrasCardio } from './regras';
import * as repo from './riscoCv';
import { hojeISO } from './usePressao';

/** Meu Risco (§13–§18, C-013/C-014): elegibilidade, entradas com estado, cálculo e histórico. */
export function useRiscoCv() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const { perfil, salvar: salvarPerfil, recarregar: recarregarPerfil } = usePerfil();
  const [parametros, setParametros] = useState<ParametrosRisco | null>(null);
  const [ultimo, setUltimo] = useState<repo.RiscoSalvo | null>(null);
  const [entradas, setEntradas] = useState<EntradaPrevent[] | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try {
      const regras = await carregarRegrasCardio('risco_cv');
      const p = extrairParametrosRisco(regras);
      setParametros(p);
      const [u, fontes] = await Promise.all([repo.ultimoRisco(userId), repo.montarFontesPrevent(userId, p.dadoRecente.paCasualDias)]);
      setUltimo(u);
      setEntradas(montarEntradasPrevent(fontes, hojeISO(), p));
    } finally {
      setCarregando(false);
    }
  }, [userId]);
  useEffect(() => { recarregar(); }, [recarregar]);

  const idade = perfil?.dataNascimento ? calcularIdade(perfil.dataNascimento) : null;
  const elegibilidade = parametros && perfil ? elegivelPrevent({ idade, eventoCvPrevio: perfil.eventoCvPrevio }, parametros) : null;

  /** Calcula com as entradas confirmadas na tela e salva com origem/data de cada valor. */
  const calcular = async (e: EntradasPrevent, entradasUsadas: EntradaPrevent[]) => {
    if (!userId || !parametros || !perfil) throw new Error('Sessão indisponível');
    const r = calcularPrevent(e);
    const salvo = await repo.salvarRisco(userId, { modelo: r.modelo, ascvd10: r.ascvd10, ascvd30: r.ascvd30, categoria: categoriaPrevent(r.ascvd10, parametros), entradas: entradasUsadas, agravantesPresentes: perfil.agravantesCv.itens as AgravanteCV[], versaoCoeficientes: r.versaoCoeficientes });
    setUltimo(salvo);
    return salvo;
  };

  const salvarAgravantes = async (itens: AgravanteCV[]) => {
    await salvarPerfil({ agravantesCv: { itens, atualizadoEm: hojeISO() } });
    await recarregarPerfil();
  };

  return { perfil, parametros, ultimo, entradas, elegibilidade, carregando, calcular, salvarAgravantes, salvarPerfil, recarregar };
}
