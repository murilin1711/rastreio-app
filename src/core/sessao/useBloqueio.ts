import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { bloqueioAtivo, conferirSenha, MS_TOLERANCIA, pedirBiometria } from './bloqueio';

/**
 * Quando pedir a biometria (D-032): ao abrir o app e ao voltar do segundo plano depois de
 * `MS_TOLERANCIA`. Trocar para o WhatsApp e voltar em trinta segundos não pede de novo — pedir
 * toda vez transforma proteção em irritação, e a pessoa acaba desligando.
 *
 * Enquanto `travado` é verdadeiro, a árvore inteira do app fica coberta. Vale para quem ligou o
 * bloqueio; quem não ligou nunca vê nada disto.
 */
export function useBloqueio() {
  const [travado, setTravado] = useState(false);
  const [verificando, setVerificando] = useState(true);
  /**
   * Ligado quando o sistema biométrico falha (D-032, revisto em 24/09). Aí não adianta tentar o
   * rosto de novo: a saída é a senha da conta, que a pessoa cadastrou e sabe.
   */
  const [exigeSenha, setExigeSenha] = useState(false);
  const saiuEm = useRef<number | null>(null);
  const pedindo = useRef(false);

  const desbloquear = useCallback(async () => {
    if (pedindo.current) return;
    pedindo.current = true;
    try {
      const r = await pedirBiometria();
      if (r === 'ok') { setTravado(false); setExigeSenha(false); }
      else if (r === 'erro') setExigeSenha(true);
    } finally {
      pedindo.current = false;
    }
  }, []);

  /** Libera pela senha da conta. Devolve falso quando a senha não confere, para a tela avisar. */
  const desbloquearComSenha = useCallback(async (email: string, senha: string) => {
    if (!(await conferirSenha(email, senha))) return false;
    setTravado(false);
    setExigeSenha(false);
    return true;
  }, []);

  // Abertura do app.
  useEffect(() => {
    let vivo = true;
    (async () => {
      const ativo = await bloqueioAtivo();
      if (!vivo) return;
      setTravado(ativo);
      setVerificando(false);
      if (ativo) desbloquear();
    })();
    return () => { vivo = false; };
  }, [desbloquear]);

  /**
   * Volta do segundo plano.
   *
   * **Só `background` conta como sair** (D-037). O iOS emite `inactive` nas duas pontas —
   * `active → inactive → background` ao sair e `background → inactive → active` ao voltar — então
   * tratar `inactive` como saída fazia o `inactive` da **volta** sobrescrever a hora real da saída,
   * e a conta do tempo dava sempre zero: o app não pedia a biometria nem depois de horas fora.
   * `inactive` sozinho também não é saída nenhuma: é a central de controle, uma chamada chegando ou
   * o próprio prompt do Face ID cobrindo a tela.
   */
  useEffect(() => {
    const aoMudar = async (estado: AppStateStatus) => {
      if (estado === 'background') {
        saiuEm.current = Date.now();
        return;
      }
      if (estado !== 'active' || saiuEm.current == null) return;
      const fora = Date.now() - saiuEm.current;
      saiuEm.current = null;
      if (fora < MS_TOLERANCIA) return;
      if (!(await bloqueioAtivo())) return;
      setTravado(true);
      setExigeSenha(false);
      desbloquear();
    };
    const sub = AppState.addEventListener('change', aoMudar);
    return () => sub.remove();
  }, [desbloquear]);

  return { travado, verificando, exigeSenha, desbloquear, desbloquearComSenha };
}
