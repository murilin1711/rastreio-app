import type { PerfilSaude } from '@core/perfil/tipos';
import { montarItensHoje } from '../montarItensHoje';

const completo: PerfilSaude = {
  userId: 'u', nome: 'Ana', dataNascimento: '1980-01-01', sexoNascimento: 'feminino', possuiColoUtero: true, histerectomia: false, alturaCm: 165,
  tabagismoStatus: 'nunca', cigarrosDia: null, anosFumando: null, dataCessacao: null,
  temDiabetes: false, temHipertensao: false, temDoencaRenal: false, temImunossupressao: false, temHiv: false, temDii: false,
  historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, perfilInicialCompleto: true,
};

test('perfil com campo essencial nulo → "Completar meu perfil" (amarelo)', () => {
  const itens = montarItensHoje({ perfil: { ...completo, tabagismoStatus: null }, antecedentesQtd: 1, medicacoesAtivasQtd: 1 });
  expect(itens.find((i) => i.id === 'perfil_incompleto')?.nivel).toBe('amarelo');
});

test('sem antecedentes → sugestão (cinza)', () => {
  expect(montarItensHoje({ perfil: completo, antecedentesQtd: 0, medicacoesAtivasQtd: 1 }).find((i) => i.id === 'antecedentes')?.nivel).toBe('cinza');
});

test('sem medicações → sugestão (cinza)', () => {
  expect(montarItensHoje({ perfil: completo, antecedentesQtd: 1, medicacoesAtivasQtd: 0 }).map((i) => i.id)).toContain('medicacoes');
});

test('tudo preenchido → um único item positivo', () => {
  const itens = montarItensHoje({ perfil: completo, antecedentesQtd: 1, medicacoesAtivasQtd: 1 });
  expect(itens).toHaveLength(1);
  expect(itens[0]).toMatchObject({ id: 'tudo_em_dia', nivel: 'verde' });
});

test('ordena por gravidade: amarelo antes de cinza', () => {
  const itens = montarItensHoje({ perfil: { ...completo, alturaCm: null }, antecedentesQtd: 0, medicacoesAtivasQtd: 0 });
  expect(itens[0].nivel).toBe('amarelo');
  expect(itens).toHaveLength(3);
});

test('perfil nulo (ainda carregando) → não sugere nada além de perfil', () => {
  const itens = montarItensHoje({ perfil: null, antecedentesQtd: 0, medicacoesAtivasQtd: 0 });
  expect(itens).toHaveLength(0);
});
