/**
 * Regressão (25/09/2026): ao tocar em "Desfazer" na Home, a pendência sumia e voltava — um piscar.
 * `salvar` só atualizava o perfil depois da resposta do servidor, e nesse intervalo o item não
 * estava nem na lista de saída nem nas pendências. Agora a tela muda na hora e volta atrás se a
 * gravação falhar (D-040).
 */
import React from 'react';
import { act, create } from 'react-test-renderer';

let mockResolver: (() => void) | null = null;
let mockRejeitar: ((e: Error) => void) | null = null;

jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } } }) }));
jest.mock('../repositorio', () => ({
  obterPerfil: async () => ({ userId: 'u1', semMedicacoes: true }),
  listarAntecedentes: async () => [],
  salvarPerfil: () => new Promise<void>((res, rej) => { mockResolver = res; mockRejeitar = rej; }),
}));

const { usePerfil } = require('../usePerfil');

function montar() {
  const ref: { atual: ReturnType<typeof usePerfil> | null } = { atual: null };
  function Sonda() { ref.atual = usePerfil(); return null; }
  return { ref, elemento: <Sonda /> };
}

it('salvar muda o perfil na hora, sem esperar o servidor', async () => {
  const { ref, elemento } = montar();
  await act(async () => { create(elemento); });
  expect(ref.atual!.perfil.semMedicacoes).toBe(true);

  let gravacao!: Promise<void>;
  await act(async () => { gravacao = ref.atual!.salvar({ semMedicacoes: false }); });
  expect(ref.atual!.perfil.semMedicacoes).toBe(false); // servidor ainda não respondeu

  await act(async () => { mockResolver!(); await gravacao; });
  expect(ref.atual!.perfil.semMedicacoes).toBe(false);
});

it('se a gravação falha, o perfil volta ao que era e o erro chega a quem chamou', async () => {
  const { ref, elemento } = montar();
  await act(async () => { create(elemento); });

  let gravacao!: Promise<void>;
  await act(async () => { gravacao = ref.atual!.salvar({ semMedicacoes: false }); });
  expect(ref.atual!.perfil.semMedicacoes).toBe(false);

  await act(async () => {
    mockRejeitar!(new Error('sem rede'));
    await expect(gravacao).rejects.toThrow('sem rede');
  });
  expect(ref.atual!.perfil.semMedicacoes).toBe(true);
});
