#!/usr/bin/env python3
"""
Gera src/core/regras/cardio/prevent.coeficientes.ts a partir do material suplementar oficial de
Khan et al., Circulation 2024 (docs/nero/referencias/pdf/2024-AHA-PREVENT-supplement-tables.xlsx),
Tabelas S12A/B/C/E (10 anos) e S12F/G/H/J (30 anos), desfecho ASCVD, por sexo.
Sem digitação manual: qualquer regeneração deve produzir o mesmo arquivo.
"""
import openpyxl, sys, pathlib

RAIZ = pathlib.Path(__file__).resolve().parents[1]
XLSX = RAIZ / 'docs/nero/referencias/pdf/2024-AHA-PREVENT-supplement-tables.xlsx'
SAIDA = RAIZ / 'src/core/regras/cardio/prevent.coeficientes.ts'

MAPA = {  # rótulo na planilha (normalizado) -> chave TS
    'age, per 10 years': 'idade', 'age, 10 years': 'idade', 'age squared': 'idade2',
    'non-hdl-c per 1 mmol/l': 'naoHdl', 'hdl-c per 0.3 mmol/l': 'hdl',
    'sbp <110 per 20 mmhg': 'pasBaixa', 'sbp ≥110 per 20 mmhg': 'pasAlta',
    'diabetes': 'diabetes', 'current smoking': 'tabagismo',
    'egfr <60, per -15 ml': 'tfgBaixa', 'egfr 60+, per -15 ml': 'tfgAlta',
    'anti-hypertensive use': 'antiHipertensivo', 'statin use': 'estatina',
    'treated sbp ≥110 mm hg per 20 mm hg': 'antiHipertensivoXpasAlta', 'treated non-hdl-c': 'estatinaXnaoHdl',
    'age per 10yr * non-hdl-c per 1 mmol/l': 'idadeXnaoHdl', 'age per 10yr * hdl-c per 1 mml/l': 'idadeXhdl', 'age per 10yr * hdl-c per 0.3 mmol/l': 'idadeXhdl',
    'age per 10yr * sbp ≥110 mm hg per 20 mmhg': 'idadeXpasAlta', 'age per 10yr * diabetes': 'idadeXdiabetes',
    'age per 10yr * current smoking': 'idadeXtabagismo', 'age per 10yr * egfr <60, per -15 ml': 'idadeXtfgBaixa',
    'ln-acr, mg/g, per 1 ln unit': 'lnRac', 'missing acr/pcr/dipstick': 'racAusente',
    'hba1c in dm, per 1%': 'hba1cComDiabetes', 'hba1c no dm, per 1%': 'hba1cSemDiabetes', 'missing hba1c': 'hba1cAusente',
    'sdi decile categories 4-6 vs. 1-3': 'sdi4a6', 'sdi decile categories 7-10 vs. 1-3': 'sdi7a10', 'missing sdi': 'sdiAusente',
    'constant': 'intercepto',
}
IGNORAR = {'r-square', 'beta'}
ABAS = {
    ('prevent_base', '10'): 'Table S12A base 10yr', ('prevent_rac', '10'): 'Table S12B ACR 10yr',
    ('prevent_hba1c', '10'): 'Table S12C A1c 10yr', ('prevent_hba1c_rac', '10'): 'Table S12E full 10yr',
    ('prevent_base', '30'): 'Table S12F base 30yr', ('prevent_rac', '30'): 'Table S12G ACR 30yr',
    ('prevent_hba1c', '30'): 'Table S12H A1c 30yr', ('prevent_hba1c_rac', '30'): 'Table S12J full 30yr',
}

wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)

def ler(aba):
    ws = wb[aba]
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    hdr = next(r for r in rows if r and any(isinstance(c, str) and c.strip() == 'ASCVD' for c in r))
    col = hdr.index('ASCVD')
    fem, masc = {}, {}
    for r in rows:
        if not r or not isinstance(r[0], str): continue
        k = ' '.join(r[0].strip().lower().split())
        if k in IGNORAR: continue
        vw, vm = r[col], r[col + 1]
        if not (isinstance(vw, (int, float)) and isinstance(vm, (int, float))): continue
        if k not in MAPA: sys.exit(f'Rótulo não mapeado em {aba}: {r[0]!r}')
        fem[MAPA[k]] = vw; masc[MAPA[k]] = vm
    return fem, masc

def ts_obj(d):
    return '{ ' + ', '.join(f'{k}: {v}' for k, v in d.items()) + ' }'

modelos = {}
for (modelo, hor), aba in ABAS.items():
    fem, masc = ler(aba)
    modelos.setdefault(modelo, {}).setdefault('feminino', {})[hor] = fem
    modelos[modelo].setdefault('masculino', {})[hor] = masc

linhas = [
    '/**',
    ' * Coeficientes das equações PREVENT — desfecho ASCVD, por sexo e horizonte (10 e 30 anos).',
    ' * GERADO por scripts/gerar-coeficientes-prevent.py a partir do material suplementar oficial de',
    ' * Khan SS et al., Circulation 2024;149:430-49 (docs/nero/referencias/pdf/2024-AHA-PREVENT-supplement-tables.xlsx),',
    ' * Tabelas S12A/B/C/E (10 anos) e S12F/G/H/J (30 anos). NÃO EDITAR À MÃO — regenerar com o script.',
    ' * Modelos: base · +RAC (S12B/G) · +HbA1c (S12C/H) · completo (S12E/J, usado com "SDI ausente" — índice americano não se aplica).',
    ' */',
    "export const VERSAO_COEFICIENTES = 'khan-2024-suppl-S12';",
    'export const DISPONIVEL = true;',
    '',
    "export type ModeloPrevent = 'prevent_base' | 'prevent_hba1c' | 'prevent_rac' | 'prevent_hba1c_rac';",
    "export type Sexo = 'feminino' | 'masculino';",
    "export type Horizonte = '10' | '30';",
    '',
    'export interface Coeficientes {',
    '  intercepto: number; idade: number; idade2?: number; naoHdl: number; hdl: number; pasBaixa: number; pasAlta: number;',
    '  diabetes: number; tabagismo: number; tfgBaixa: number; tfgAlta: number; antiHipertensivo: number; estatina: number;',
    '  antiHipertensivoXpasAlta: number; estatinaXnaoHdl: number; idadeXnaoHdl: number; idadeXhdl: number; idadeXpasAlta: number;',
    '  idadeXdiabetes: number; idadeXtabagismo: number; idadeXtfgBaixa: number;',
    '  lnRac?: number; racAusente?: number; hba1cComDiabetes?: number; hba1cSemDiabetes?: number; hba1cAusente?: number;',
    '  sdi4a6?: number; sdi7a10?: number; sdiAusente?: number;',
    '}',
    '',
    'export const COEFICIENTES: Record<ModeloPrevent, Record<Sexo, Record<Horizonte, Coeficientes>>> = {',
]
for modelo, sexos in modelos.items():
    linhas.append(f'  {modelo}: {{')
    for sexo, hors in sexos.items():
        linhas.append(f'    {sexo}: {{')
        for hor, d in hors.items():
            linhas.append(f"      '{hor}': {ts_obj(d)},")
        linhas.append('    },')
    linhas.append('  },')
linhas.append('};')
SAIDA.write_text('\n'.join(linhas) + '\n', encoding='utf-8')
print(f'gerado {SAIDA.relative_to(RAIZ)} — {sum(len(h) for s in modelos.values() for h in s.values())} conjuntos')
