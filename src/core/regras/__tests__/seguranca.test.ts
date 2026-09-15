import { aplicarHierarquiaSeguranca } from '../seguranca';
import type { ContextoAvaliacao } from '../tipos';

const vazio: ContextoAvaliacao = { sintomasAlarme: [], pendenciasAbertas: [], emAcompanhamentoEspecializado: [], historicoExames: [] };

describe('hierarquia de segurança (§66)', () => {
  it('nada bloqueia → null', () => {
    expect(aplicarHierarquiaSeguranca('mama', vazio)).toBeNull();
  });

  it('sintoma de alarme tem prioridade máxima, mesmo com pendência', () => {
    const r = aplicarHierarquiaSeguranca('mama', {
      ...vazio,
      sintomasAlarme: ['nodulo_mamario'],
      pendenciasAbertas: [{ programa: 'mama', exameOrigemId: 'x' }],
    });
    expect(r?.motivo).toBe('sintoma_alarme');
    expect(r?.nivelAlerta).toBe('vermelho');
    expect(r?.mensagemPaciente).toMatch(/Não espere pela data/);
  });

  it('pendência aberta bloqueia rotina do mesmo programa', () => {
    const r = aplicarHierarquiaSeguranca('colorretal', { ...vazio, pendenciasAbertas: [{ programa: 'colorretal', exameOrigemId: 'fit1' }] });
    expect(r?.motivo).toBe('pendencia_aberta');
    expect(r?.nivelAlerta).toBe('laranja');
  });

  it('pendência de outro programa não bloqueia', () => {
    expect(aplicarHierarquiaSeguranca('mama', { ...vazio, pendenciasAbertas: [{ programa: 'colorretal', exameOrigemId: 'fit1' }] })).toBeNull();
  });

  it('acompanhamento especializado bloqueia cálculo automático', () => {
    const r = aplicarHierarquiaSeguranca('mama', { ...vazio, emAcompanhamentoEspecializado: ['mama'] });
    expect(r?.motivo).toBe('acompanhamento_especializado');
    expect(r?.nivelAlerta).toBe('cinza');
  });
});
