import { Platform } from 'react-native';

/** Paleta NERO — ver docs/nero/03-DESIGN.md */
export const Colors = {
  primary:       '#0f2d63', // marinho
  primaryLight:  '#1a3a7a',
  accent:        '#5B8DB8', // aço — listras do Nero
  background:    '#F3F0EA', // areia
  surface:       '#ffffff', // porcelana
  surfaceAlt:    '#EAE6DE', // areia mais funda (itens desativados, fundos internos)
  border:        '#DED8CE',
  textPrimary:   '#0f2d63',
  textSecondary: '#4A5C7A', // grafite-azul
  textMuted:     '#8A97AD',
  success:       '#16a34a',
  warning:       '#d97706',
  danger:        '#dc2626',
  white:         '#ffffff',
} as const;

/** Níveis de alerta clínico (§43): sempre par fundo pastel + cor forte. */
export const Alerta = {
  verde:    { bg: '#dcfce7', fg: '#16a34a' },
  amarelo:  { bg: '#fef3c7', fg: '#d97706' },
  laranja:  { bg: '#ffedd5', fg: '#ea580c' },
  vermelho: { bg: '#fee2e2', fg: '#dc2626' },
  cinza:    { bg: '#ECEEF2', fg: '#6b7280' },
} as const;
export type NivelAlertaUI = keyof typeof Alerta;

export const Typography = {
  display:    { fontFamily: 'Poppins-ExtraBold', fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  title:      { fontFamily: 'Poppins-Bold',      fontSize: 22, lineHeight: 28 },
  heading:    { fontFamily: 'Poppins-SemiBold',  fontSize: 17, lineHeight: 23 },
  subheading: { fontFamily: 'Poppins-SemiBold',  fontSize: 15, lineHeight: 21 },
  body:       { fontFamily: 'Poppins-Regular',   fontSize: 15, lineHeight: 23 },
  caption:    { fontFamily: 'Poppins-Regular',   fontSize: 13, lineHeight: 18 },
  /** Só para chips de status — nunca como rótulo acima de títulos. */
  chip:       { fontFamily: 'Poppins-SemiBold',  fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' as const },
} as const;

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

/** Dois raios codificam hierarquia: `bloco` para módulos/cartões grandes, `linha` para linhas, campos e chips. */
export const Radius = { chip: 8, linha: 12, bloco: 20, pill: 999 } as const;

export const Shadows = {
  card: Platform.select({
    ios: { shadowColor: '#0f2d63', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12 },
    android: { elevation: 3 },
  }),
  floating: Platform.select({
    ios: { shadowColor: '#0f2d63', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 18 },
    android: { elevation: 7 },
  }),
} as const;
