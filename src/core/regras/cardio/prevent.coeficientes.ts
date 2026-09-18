/**
 * Coeficientes das equações PREVENT — desfecho ASCVD, por sexo e horizonte (10 e 30 anos).
 * GERADO por scripts/gerar-coeficientes-prevent.py a partir do material suplementar oficial de
 * Khan SS et al., Circulation 2024;149:430-49 (docs/nero/referencias/pdf/2024-AHA-PREVENT-supplement-tables.xlsx),
 * Tabelas S12A/B/C/E (10 anos) e S12F/G/H/J (30 anos). NÃO EDITAR À MÃO — regenerar com o script.
 * Modelos: base · +RAC (S12B/G) · +HbA1c (S12C/H) · completo (S12E/J, usado com "SDI ausente" — índice americano não se aplica).
 */
export const VERSAO_COEFICIENTES = 'khan-2024-suppl-S12';
export const DISPONIVEL = true;

export type ModeloPrevent = 'prevent_base' | 'prevent_hba1c' | 'prevent_rac' | 'prevent_hba1c_rac';
export type Sexo = 'feminino' | 'masculino';
export type Horizonte = '10' | '30';

export interface Coeficientes {
  intercepto: number; idade: number; idade2?: number; naoHdl: number; hdl: number; pasBaixa: number; pasAlta: number;
  diabetes: number; tabagismo: number; tfgBaixa: number; tfgAlta: number; antiHipertensivo: number; estatina: number;
  antiHipertensivoXpasAlta: number; estatinaXnaoHdl: number; idadeXnaoHdl: number; idadeXhdl: number; idadeXpasAlta: number;
  idadeXdiabetes: number; idadeXtabagismo: number; idadeXtfgBaixa: number;
  lnRac?: number; racAusente?: number; hba1cComDiabetes?: number; hba1cSemDiabetes?: number; hba1cAusente?: number;
  sdi4a6?: number; sdi7a10?: number; sdiAusente?: number;
}

export const COEFICIENTES: Record<ModeloPrevent, Record<Sexo, Record<Horizonte, Coeficientes>>> = {
  prevent_base: {
    feminino: {
      '10': { idade: 0.719883, naoHdl: 0.1176967, hdl: -0.151185, pasBaixa: -0.0835358, pasAlta: 0.3592852, diabetes: 0.8348585, tabagismo: 0.4831078, tfgBaixa: 0.4864619, tfgAlta: 0.0397779, antiHipertensivo: 0.2265309, estatina: -0.0592374, antiHipertensivoXpasAlta: -0.0395762, estatinaXnaoHdl: 0.0844423, idadeXnaoHdl: -0.0567839, idadeXhdl: 0.0325692, idadeXpasAlta: -0.1035985, idadeXdiabetes: -0.2417542, idadeXtabagismo: -0.0791142, idadeXtfgBaixa: -0.1671492, intercepto: -3.819975 },
      '30': { idade: 0.4669202, idade2: -0.0893118, naoHdl: 0.1256901, hdl: -0.1542255, pasBaixa: -0.0018093, pasAlta: 0.322949, diabetes: 0.6296707, tabagismo: 0.268292, tfgBaixa: 0.100106, tfgAlta: 0.0499663, antiHipertensivo: 0.1875292, estatina: 0.0152476, antiHipertensivoXpasAlta: -0.0276123, estatinaXnaoHdl: 0.0736147, idadeXnaoHdl: -0.0521962, idadeXhdl: 0.0316918, idadeXpasAlta: -0.1046101, idadeXdiabetes: -0.2727793, idadeXtabagismo: -0.1530907, idadeXtfgBaixa: -0.1299149, intercepto: -1.974074 },
    },
    masculino: {
      '10': { idade: 0.7099847, naoHdl: 0.1658663, hdl: -0.1144285, pasBaixa: -0.2837212, pasAlta: 0.3239977, diabetes: 0.7189597, tabagismo: 0.3956973, tfgBaixa: 0.3690075, tfgAlta: 0.0203619, antiHipertensivo: 0.2036522, estatina: -0.0865581, antiHipertensivoXpasAlta: -0.0322916, estatinaXnaoHdl: 0.114563, idadeXnaoHdl: -0.0300005, idadeXhdl: 0.0232747, idadeXpasAlta: -0.0927024, idadeXdiabetes: -0.2018525, idadeXtabagismo: -0.0970527, idadeXtfgBaixa: -0.1217081, intercepto: -3.500655 },
      '30': { idade: 0.3994099, idade2: -0.0937484, naoHdl: 0.1744643, hdl: -0.120203, pasBaixa: -0.0665117, pasAlta: 0.2753037, diabetes: 0.4790257, tabagismo: 0.1782635, tfgBaixa: -0.0218789, tfgAlta: 0.0602553, antiHipertensivo: 0.1421182, estatina: 0.0135996, antiHipertensivoXpasAlta: -0.0218265, estatinaXnaoHdl: 0.1013148, idadeXnaoHdl: -0.0312619, idadeXhdl: 0.020673, idadeXpasAlta: -0.0920935, idadeXdiabetes: -0.2159947, idadeXtabagismo: -0.1548811, idadeXtfgBaixa: -0.0712547, intercepto: -1.736444 },
    },
  },
  prevent_rac: {
    feminino: {
      '10': { idade: 0.7201999, naoHdl: 0.1135771, hdl: -0.1493506, pasBaixa: -0.0726677, pasAlta: 0.3436259, diabetes: 0.7773094, tabagismo: 0.4746662, tfgBaixa: 0.3824646, tfgAlta: 0.0394178, antiHipertensivo: 0.2125182, estatina: -0.0603046, antiHipertensivoXpasAlta: -0.0466053, estatinaXnaoHdl: 0.0733118, idadeXnaoHdl: -0.0534262, idadeXhdl: 0.0325689, idadeXpasAlta: -0.0999887, idadeXdiabetes: -0.2411762, idadeXtabagismo: -0.0826941, idadeXtfgBaixa: -0.1444737, lnRac: 0.1501217, racAusente: 0.0050257, intercepto: -4.174614 },
      '30': { idade: 0.4629669, idade2: -0.0902777, naoHdl: 0.1215214, hdl: -0.1522069, pasBaixa: 0.0092679, pasAlta: 0.3113609, diabetes: 0.581256, tabagismo: 0.263167, tfgBaixa: 0.0391726, tfgAlta: 0.0492959, antiHipertensivo: 0.1786178, estatina: 0.0131058, antiHipertensivoXpasAlta: -0.0325135, estatinaXnaoHdl: 0.0617093, idadeXnaoHdl: -0.0489189, idadeXhdl: 0.0321079, idadeXpasAlta: -0.1003185, idadeXdiabetes: -0.2684574, idadeXtabagismo: -0.1547301, idadeXtfgBaixa: -0.1130703, lnRac: 0.0903471, racAusente: -0.0145818, intercepto: -2.178888 },
    },
    masculino: {
      '10': { idade: 0.7141718, naoHdl: 0.1602194, hdl: -0.1139086, pasBaixa: -0.2719456, pasAlta: 0.3058719, diabetes: 0.6600631, tabagismo: 0.3884022, tfgBaixa: 0.2466316, tfgAlta: 0.0151852, antiHipertensivo: 0.186167, estatina: -0.0894395, antiHipertensivoXpasAlta: -0.0411884, estatinaXnaoHdl: 0.1058212, idadeXnaoHdl: -0.028089, idadeXhdl: 0.0240427, idadeXpasAlta: -0.0912325, idadeXdiabetes: -0.2004894, idadeXtabagismo: -0.096936, idadeXtfgBaixa: -0.1022867, lnRac: 0.1510073, racAusente: 0.0556, intercepto: -3.85146 },
      '30': { idade: 0.3995607, idade2: -0.094557, naoHdl: 0.1686692, hdl: -0.1202145, pasBaixa: -0.0555561, pasAlta: 0.2633566, diabetes: 0.4362036, tabagismo: 0.1716233, tfgBaixa: -0.0775282, tfgAlta: 0.0561236, antiHipertensivo: 0.1319331, estatina: 0.0102428, antiHipertensivoXpasAlta: -0.0269294, estatinaXnaoHdl: 0.0920557, idadeXnaoHdl: -0.0297021, idadeXhdl: 0.0217935, idadeXpasAlta: -0.0893347, idadeXdiabetes: -0.2081467, idadeXtabagismo: -0.1542716, idadeXtfgBaixa: -0.0597254, lnRac: 0.0684872, racAusente: 0.0193962, intercepto: -1.873449 },
    },
  },
  prevent_hba1c: {
    feminino: {
      '10': { idade: 0.7111831, naoHdl: 0.106797, hdl: -0.1425745, pasBaixa: -0.0736824, pasAlta: 0.3480844, diabetes: 0.5112951, tabagismo: 0.4880292, tfgBaixa: 0.4754997, tfgAlta: 0.0438132, antiHipertensivo: 0.2259093, estatina: -0.0648872, antiHipertensivoXpasAlta: -0.0437645, estatinaXnaoHdl: 0.0697082, idadeXnaoHdl: -0.0506382, idadeXhdl: 0.0327475, idadeXpasAlta: -0.0996442, idadeXdiabetes: -0.1924338, idadeXtabagismo: -0.0803539, idadeXtfgBaixa: -0.1682586, hba1cComDiabetes: 0.1339055, hba1cSemDiabetes: 0.1596461, hba1cAusente: 0.0015678, intercepto: -3.838746 },
      '30': { idade: 0.4555574, idade2: -0.0903501, naoHdl: 0.1148321, hdl: -0.1458754, pasBaixa: 0.0089323, pasAlta: 0.3139029, diabetes: 0.386281, tabagismo: 0.2714309, tfgBaixa: 0.0930987, tfgAlta: 0.0532216, antiHipertensivo: 0.1862181, estatina: 0.0106964, antiHipertensivoXpasAlta: -0.0329713, estatinaXnaoHdl: 0.0583609, idadeXnaoHdl: -0.0463273, idadeXhdl: 0.0324717, idadeXpasAlta: -0.1004777, idadeXdiabetes: -0.2266944, idadeXtabagismo: -0.1541859, idadeXtfgBaixa: -0.1286005, hba1cComDiabetes: 0.0875827, hba1cSemDiabetes: 0.1126417, hba1cAusente: 0.0124356, intercepto: -2.011533 },
    },
    masculino: {
      '10': { idade: 0.7064146, naoHdl: 0.1532267, hdl: -0.1082166, pasBaixa: -0.2675288, pasAlta: 0.3173809, diabetes: 0.432604, tabagismo: 0.3958842, tfgBaixa: 0.3665014, tfgAlta: 0.0250243, antiHipertensivo: 0.2061158, estatina: -0.0899988, antiHipertensivoXpasAlta: -0.0334959, estatinaXnaoHdl: 0.1034168, idadeXnaoHdl: -0.0255406, idadeXhdl: 0.0247538, idadeXpasAlta: -0.0917441, idadeXdiabetes: -0.1499195, idadeXtabagismo: -0.098089, idadeXtfgBaixa: -0.1305231, hba1cComDiabetes: 0.1157161, hba1cSemDiabetes: 0.1288303, hba1cAusente: -0.0010001, intercepto: -3.51835 },
      '30': { idade: 0.3883267, idade2: -0.0958114, naoHdl: 0.1613374, hdl: -0.1144418, pasBaixa: -0.0474338, pasAlta: 0.2691281, diabetes: 0.2859773, tabagismo: 0.1759553, tfgBaixa: -0.0242898, tfgAlta: 0.0644523, antiHipertensivo: 0.142874, estatina: 0.0115062, antiHipertensivoXpasAlta: -0.02333, estatinaXnaoHdl: 0.0899664, idadeXnaoHdl: -0.0275478, idadeXhdl: 0.022573, idadeXpasAlta: -0.090802, idadeXdiabetes: -0.1771894, idadeXtabagismo: -0.1548847, idadeXtfgBaixa: -0.0732754, hba1cComDiabetes: 0.0591089, hba1cSemDiabetes: 0.0821158, hba1cAusente: 0.0179755, intercepto: -1.777708 },
    },
  },
  prevent_hba1c_rac: {
    feminino: {
      '10': { idade: 0.7023067, naoHdl: 0.0898765, hdl: -0.1407316, pasBaixa: -0.0256648, pasAlta: 0.314511, diabetes: 0.4799217, tabagismo: 0.4062049, tfgBaixa: 0.3847744, tfgAlta: 0.0495174, antiHipertensivo: 0.2133861, estatina: -0.0678552, antiHipertensivoXpasAlta: -0.0451416, estatinaXnaoHdl: 0.0788187, idadeXnaoHdl: -0.0535985, idadeXhdl: 0.0291762, idadeXpasAlta: -0.0961839, idadeXdiabetes: -0.2001466, idadeXtabagismo: -0.0586472, idadeXtfgBaixa: -0.1537791, sdi4a6: 0.1413965, sdi7a10: 0.228136, sdiAusente: 0.1588908, lnRac: 0.1371824, racAusente: 0.0061613, hba1cComDiabetes: 0.123192, hba1cSemDiabetes: 0.1410572, hba1cAusente: 0.005866, intercepto: -4.291503 },
      '30': { idade: 0.4386739, idade2: -0.0921956, naoHdl: 0.0977728, hdl: -0.1453525, pasBaixa: 0.0590925, pasAlta: 0.2862862, diabetes: 0.3669136, tabagismo: 0.2354695, tfgBaixa: 0.0354338, tfgAlta: 0.0573093, antiHipertensivo: 0.1840085, estatina: 0.0117504, antiHipertensivoXpasAlta: -0.0331945, estatinaXnaoHdl: 0.0664311, idadeXnaoHdl: -0.0492826, idadeXhdl: 0.0288888, idadeXpasAlta: -0.0964709, idadeXdiabetes: -0.2279648, idadeXtabagismo: -0.120405, idadeXtfgBaixa: -0.1157635, sdi4a6: 0.1107632, sdi7a10: 0.1840367, sdiAusente: 0.1308962, lnRac: 0.0810739, racAusente: -0.0147785, hba1cComDiabetes: 0.0794709, hba1cSemDiabetes: 0.1002615, hba1cAusente: 0.017301, intercepto: -2.314066 },
    },
    masculino: {
      '10': { idade: 0.7128741, naoHdl: 0.1465201, hdl: -0.1125794, pasBaixa: -0.3387216, pasAlta: 0.2980252, diabetes: 0.399583, tabagismo: 0.3379111, tfgBaixa: 0.2582604, tfgAlta: 0.0147769, antiHipertensivo: 0.1686621, estatina: -0.1073619, antiHipertensivoXpasAlta: -0.0381038, estatinaXnaoHdl: 0.1034169, idadeXnaoHdl: -0.0228755, idadeXhdl: 0.0267453, idadeXpasAlta: -0.0897449, idadeXdiabetes: -0.1497464, idadeXtabagismo: -0.077206, idadeXtfgBaixa: -0.1198368, sdi4a6: 0.0651121, sdi7a10: 0.2676683, sdiAusente: 0.1388492, lnRac: 0.1375837, racAusente: 0.0652944, hba1cComDiabetes: 0.101282, hba1cSemDiabetes: 0.1092726, hba1cAusente: -0.0112852, intercepto: -3.969788 },
      '30': { idade: 0.3743566, idade2: -0.0995499, naoHdl: 0.1544808, hdl: -0.1215297, pasBaixa: -0.1083968, pasAlta: 0.2555179, diabetes: 0.2696998, tabagismo: 0.1628432, tfgBaixa: -0.077507, tfgAlta: 0.0583407, antiHipertensivo: 0.1120322, estatina: -0.0025063, antiHipertensivoXpasAlta: -0.0256116, estatinaXnaoHdl: 0.0886745, idadeXnaoHdl: -0.0254507, idadeXhdl: 0.0244639, idadeXpasAlta: -0.0869146, idadeXdiabetes: -0.165745, idadeXtabagismo: -0.1244714, idadeXtfgBaixa: -0.0624552, sdi4a6: 0.015675, sdi7a10: 0.1864231, sdiAusente: 0.0845697, lnRac: 0.0560171, racAusente: 0.0252244, hba1cComDiabetes: 0.0501422, hba1cSemDiabetes: 0.0722905, hba1cAusente: 0.0114945, intercepto: -1.985368 },
    },
  },
};
