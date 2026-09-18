/**
 * CKD-EPI 2021 (creatinina, sem raça) — Inker et al., NEJM 2021. Equação usada pelo PREVENT (Khan 2024).
 * TFGe = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^−1,200 × 0,9938^idade × 1,012 [se feminino]
 */
export function ckdEpi2021(creatininaMgDl: number, idade: number, sexo: 'feminino' | 'masculino'): number {
  const k = sexo === 'feminino' ? 0.7 : 0.9;
  const a = sexo === 'feminino' ? -0.241 : -0.302;
  const r = creatininaMgDl / k;
  const tfg = 142 * Math.min(r, 1) ** a * Math.max(r, 1) ** -1.2 * 0.9938 ** idade * (sexo === 'feminino' ? 1.012 : 1);
  return Math.round(tfg * 10) / 10;
}
