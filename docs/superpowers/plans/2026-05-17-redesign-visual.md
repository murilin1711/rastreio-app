# Redesign Visual — Rastreando App

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reformular completamente a identidade visual do app para azul marinho (#0f2d63) + branco, fonte Poppins, caranguejo animado Lottie e 4 padrões de tela modernos cobrindo todas as 29 telas.

**Architecture:** Design System Centralizado em `constants/Theme.ts` exporta todos os tokens (cores, tipografia, espaçamento, raios). Componentes reutilizáveis em `components/ui/` consomem os tokens. Todas as telas são reescritas usando esses componentes — sem StyleSheet inline repetindo valores.

**Tech Stack:** React Native 0.74, Expo Router 3.5, expo-font, lottie-react-native 6.7, Firebase Auth/Firestore, TypeScript 5.3

---

## Mapa de Arquivos

### Criar
- `constants/Theme.ts` — tokens centrais (cores, tipografia, espaçamento, raios, sombras)
- `components/ui/ScreenHeader.tsx` — header Home com card flutuante
- `components/ui/InternalHeader.tsx` — título inline no scroll (Padrão 2)
- `components/ui/Button.tsx` — Primary, Outline, Ghost, Danger, Disabled
- `components/ui/Card.tsx` — card branco com sombra padrão
- `components/ui/ListItem.tsx` — ícone azul + título + subtítulo + chevron
- `components/ui/StatusBadge.tsx` — EM DIA / PENDENTE / URGENTE / N/A
- `components/ui/ProgressBar.tsx` — barra gradiente com label
- `components/ui/SectionTitle.tsx` — label uppercase + linha divisória
- `components/ui/Input.tsx` — campo com ícone, estados normal/focus/error
- `components/ui/CrabLottie.tsx` — wrapper Lottie do caranguejo

### Modificar
- `constants/Colors.ts` — substituir paleta pelos novos tokens
- `components/ThemedText.tsx` — adicionar variants display, title, heading, subheading, body, label
- `components/ThemedView.tsx` — background padrão → #ffffff
- `app/_layout.tsx` — carregar fontes Poppins

### Telas — Padrão 4 (Auth)
- `app/paginaInicial.tsx`
- `app/Login/TelaLogin.tsx`
- `app/Cadastro/TelaCadastro.tsx`

### Telas — Padrão 1 (Home)
- `app/Home/TelaDeHomeUsuario.tsx`
- `app/Home/TelaDeHomeProfissional.tsx`
- `app/Home/TelaDeHomeProfissionalPessoal.tsx`

### Telas — Padrão 2 (Internas — 17 telas)
- `app/PerfilIndividual/PerfilIndividualMulher.tsx`
- `app/PerfilIndividual/PerfilIndividualHomem.tsx`
- `app/PerfilIndividual/SinaisESintomas.tsx`
- `app/PerfilIndividual/SeusExamesDeRastreio/` (7 telas)
- `app/ProximosExames.tsx`
- `app/MarcarConsulta.tsx`
- `app/RastrearMeuPaciente/RastrearMeuPaciente.tsx`
- `app/RastrearMeuPaciente/RastrearHomem.tsx`
- `app/RastrearMeuPaciente/RastrearMulher.tsx`
- `app/RastrearMeuPaciente/RastrearPacienteNeoplasia.tsx`
- `app/RastrearMeuPaciente/IndicacoesRastreio.tsx`
- `app/RastrearMeuPaciente/CondutaManejoResultados.tsx`

### Telas — Padrão 3 (Calculadoras — 6 telas)
- `app/PerfilIndividual/CalculeSeuRisco/` (6 telas)

---

## Task 1: Fontes Poppins

**Files:**
- Modify: `app/_layout.tsx`
- Add: `assets/fonts/Poppins-Regular.ttf`, `Poppins-Medium.ttf`, `Poppins-SemiBold.ttf`, `Poppins-Bold.ttf`, `Poppins-ExtraBold.ttf`

- [ ] **Baixar as fontes Poppins do Google Fonts**

  Acesse https://fonts.google.com/specimen/Poppins, clique em "Download family". Extraia e copie os seguintes arquivos para `assets/fonts/`:
  - `Poppins-Regular.ttf` (400)
  - `Poppins-Medium.ttf` (500)
  - `Poppins-SemiBold.ttf` (600)
  - `Poppins-Bold.ttf` (700)
  - `Poppins-ExtraBold.ttf` (800)

- [ ] **Atualizar `app/_layout.tsx` para carregar as fontes**

  Substituir o conteúdo atual:

  ```tsx
  import { useFonts } from 'expo-font';
  import { Stack } from 'expo-router';
  import * as SplashScreen from 'expo-splash-screen';
  import { useEffect } from 'react';

  SplashScreen.preventAutoHideAsync();

  export default function Layout() {
    const [fontsLoaded] = useFonts({
      'Poppins-Regular':   require('../assets/fonts/Poppins-Regular.ttf'),
      'Poppins-Medium':    require('../assets/fonts/Poppins-Medium.ttf'),
      'Poppins-SemiBold':  require('../assets/fonts/Poppins-SemiBold.ttf'),
      'Poppins-Bold':      require('../assets/fonts/Poppins-Bold.ttf'),
      'Poppins-ExtraBold': require('../assets/fonts/Poppins-ExtraBold.ttf'),
    });

    useEffect(() => {
      if (fontsLoaded) SplashScreen.hideAsync();
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splashScreen" />
        <Stack.Screen name="paginaInicial" />
        <Stack.Screen name="PerfilIndividual" />
      </Stack>
    );
  }
  ```

- [ ] **Verificar que o app abre sem crash**

  ```bash
  npx expo start
  ```
  Abrir no simulador. Deve carregar normalmente (fontes antigas ainda ativas nas telas, isso é esperado).

- [ ] **Commit**

  ```bash
  git add assets/fonts/Poppins-*.ttf app/_layout.tsx
  git commit -m "feat: adiciona fontes Poppins e carrega no layout"
  ```

---

## Task 2: Design Tokens — `constants/Theme.ts`

**Files:**
- Create: `constants/Theme.ts`
- Modify: `constants/Colors.ts`

- [ ] **Criar `constants/Theme.ts`**

  ```ts
  import { Platform } from 'react-native';

  export const Colors = {
    primary:       '#0f2d63',
    primaryLight:  '#1a3a7a',
    accent:        '#2e5dbf',
    background:    '#ffffff',
    surface:       '#f5f7fc',
    border:        '#e8eef8',
    textPrimary:   '#0f2d63',
    textSecondary: '#6b7fa3',
    textMuted:     '#a8b8d0',
    success:       '#16a34a',
    warning:       '#d97706',
    danger:        '#dc2626',
    white:         '#ffffff',
  } as const;

  export const Typography = {
    display:    { fontFamily: 'Poppins-ExtraBold', fontSize: 28, letterSpacing: -0.5 },
    title:      { fontFamily: 'Poppins-Bold',      fontSize: 20 },
    heading:    { fontFamily: 'Poppins-Bold',      fontSize: 16 },
    subheading: { fontFamily: 'Poppins-SemiBold',  fontSize: 14 },
    body:       { fontFamily: 'Poppins-Regular',   fontSize: 14, lineHeight: 22 },
    caption:    { fontFamily: 'Poppins-Regular',   fontSize: 12 },
    label:      { fontFamily: 'Poppins-SemiBold',  fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' as const },
  } as const;

  export const Spacing = {
    xs:  4,
    sm:  8,
    md:  12,
    lg:  16,
    xl:  24,
    xxl: 32,
  } as const;

  export const Radius = {
    sm:   8,
    md:   12,
    lg:   16,
    xl:   24,
    pill: 999,
  } as const;

  export const Shadows = {
    card: Platform.select({
      ios: {
        shadowColor: '#0f2d63',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
    floating: Platform.select({
      ios: {
        shadowColor: '#0f2d63',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  } as const;
  ```

- [ ] **Atualizar `constants/Colors.ts`** para reexportar do Theme (mantém compatibilidade com hooks existentes):

  ```ts
  import { Colors as ThemeColors } from './Theme';

  // Mantém estrutura light/dark esperada pelo useThemeColor
  export const Colors = {
    light: {
      text:            ThemeColors.textPrimary,
      background:      ThemeColors.background,
      tint:            ThemeColors.primary,
      icon:            ThemeColors.textSecondary,
      tabIconDefault:  ThemeColors.textMuted,
      tabIconSelected: ThemeColors.primary,
    },
    dark: {
      text:            ThemeColors.background,
      background:      ThemeColors.primary,
      tint:            ThemeColors.background,
      icon:            ThemeColors.textMuted,
      tabIconDefault:  ThemeColors.textMuted,
      tabIconSelected: ThemeColors.background,
    },
  };
  ```

- [ ] **Verificar que o app ainda abre sem erro de TypeScript**

  ```bash
  npx tsc --noEmit
  ```
  Esperado: 0 erros relacionados a Colors/Theme.

- [ ] **Commit**

  ```bash
  git add constants/Theme.ts constants/Colors.ts
  git commit -m "feat: cria design tokens centralizados em Theme.ts"
  ```

---

## Task 3: Atualizar ThemedText e ThemedView

**Files:**
- Modify: `components/ThemedText.tsx`
- Modify: `components/ThemedView.tsx`

- [ ] **Substituir `components/ThemedText.tsx`**

  ```tsx
  import { Text, type TextProps, StyleSheet } from 'react-native';
  import { Colors, Typography } from '@/constants/Theme';

  export type TextVariant = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'caption' | 'label';

  export type ThemedTextProps = TextProps & {
    variant?: TextVariant;
    color?: string;
  };

  export function ThemedText({ style, variant = 'body', color, ...rest }: ThemedTextProps) {
    return (
      <Text
        style={[
          styles[variant],
          { color: color ?? Colors.textPrimary },
          style,
        ]}
        {...rest}
      />
    );
  }

  const styles = StyleSheet.create({
    display:    { ...Typography.display,    color: Colors.textPrimary },
    title:      { ...Typography.title,      color: Colors.textPrimary },
    heading:    { ...Typography.heading,    color: Colors.textPrimary },
    subheading: { ...Typography.subheading, color: Colors.textSecondary },
    body:       { ...Typography.body,       color: Colors.textSecondary },
    caption:    { ...Typography.caption,    color: Colors.textMuted },
    label:      { ...Typography.label,      color: Colors.textMuted },
  });
  ```

- [ ] **Substituir `components/ThemedView.tsx`**

  ```tsx
  import { View, type ViewProps } from 'react-native';
  import { Colors } from '@/constants/Theme';

  export type ThemedViewProps = ViewProps & {
    variant?: 'background' | 'surface';
  };

  export function ThemedView({ style, variant = 'background', ...rest }: ThemedViewProps) {
    return (
      <View
        style={[
          { backgroundColor: variant === 'surface' ? Colors.surface : Colors.background },
          style,
        ]}
        {...rest}
      />
    );
  }
  ```

- [ ] **Verificar TypeScript**

  ```bash
  npx tsc --noEmit
  ```
  Pode aparecer erros em telas que usavam `type=` da API antiga — serão corrigidos nas tasks de tela.

- [ ] **Commit**

  ```bash
  git add components/ThemedText.tsx components/ThemedView.tsx
  git commit -m "feat: atualiza ThemedText e ThemedView com novos tokens"
  ```

---

## Task 4: Componentes UI — Button, Input, StatusBadge, SectionTitle

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Input.tsx`
- Create: `components/ui/StatusBadge.tsx`
- Create: `components/ui/SectionTitle.tsx`

- [ ] **Criar `components/ui/Button.tsx`**

  ```tsx
  import React from 'react';
  import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, type TouchableOpacityProps } from 'react-native';
  import { Colors, Typography, Radius, Spacing } from '@/constants/Theme';

  type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';

  interface ButtonProps extends TouchableOpacityProps {
    label: string;
    variant?: ButtonVariant;
    loading?: boolean;
    pill?: boolean;
  }

  export function Button({ label, variant = 'primary', loading = false, pill = false, disabled, style, ...rest }: ButtonProps) {
    const isDisabled = disabled || loading;
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        disabled={isDisabled}
        style={[
          styles.base,
          pill && { borderRadius: Radius.pill },
          styles[variant],
          isDisabled && styles.disabled,
          style,
        ]}
        {...rest}
      >
        {loading
          ? <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? Colors.white : Colors.primary} />
          : <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
        }
      </TouchableOpacity>
    );
  }

  const styles = StyleSheet.create({
    base:         { borderRadius: Radius.md, paddingVertical: 13, paddingHorizontal: Spacing.xl, alignItems: 'center', justifyContent: 'center' },
    primary:      { backgroundColor: Colors.primary },
    outline:      { backgroundColor: 'transparent', borderWidth: 2, borderColor: Colors.primary },
    ghost:        { backgroundColor: 'transparent' },
    danger:       { backgroundColor: Colors.danger },
    disabled:     { opacity: 0.5 },
    label:        { ...Typography.subheading },
    primaryLabel: { color: Colors.white },
    outlineLabel: { color: Colors.primary },
    ghostLabel:   { color: Colors.accent },
    dangerLabel:  { color: Colors.white },
  });
  ```

- [ ] **Criar `components/ui/Input.tsx`**

  ```tsx
  import React, { useState } from 'react';
  import { TextInput, View, StyleSheet, type TextInputProps } from 'react-native';
  import { Colors, Typography, Radius, Spacing } from '@/constants/Theme';

  interface InputProps extends TextInputProps {
    icon?: React.ReactNode;
  }

  export function Input({ icon, style, ...rest }: InputProps) {
    const [focused, setFocused] = useState(false);
    return (
      <View style={[styles.container, focused && styles.focused, style]}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.background },
    focused:   { borderColor: Colors.primary },
    icon:      { marginRight: Spacing.sm },
    input:     { flex: 1, ...Typography.body, color: Colors.textPrimary, padding: 0 },
  });
  ```

- [ ] **Criar `components/ui/StatusBadge.tsx`**

  ```tsx
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { Colors, Typography, Radius, Spacing } from '@/constants/Theme';

  export type BadgeStatus = 'ok' | 'pending' | 'urgent' | 'na';

  const config: Record<BadgeStatus, { label: string; bg: string; color: string }> = {
    ok:      { label: 'EM DIA',   bg: '#dcfce7', color: Colors.success },
    pending: { label: 'PENDENTE', bg: '#fef3c7', color: Colors.warning },
    urgent:  { label: 'URGENTE',  bg: '#fee2e2', color: Colors.danger  },
    na:      { label: 'N/A',      bg: Colors.surface, color: Colors.textMuted },
  };

  export function StatusBadge({ status }: { status: BadgeStatus }) {
    const { label, bg, color } = config[status];
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.text, { color }]}>{label}</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    badge: { borderRadius: Radius.sm, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
    text:  { ...Typography.label, fontSize: 9 },
  });
  ```

- [ ] **Criar `components/ui/SectionTitle.tsx`**

  ```tsx
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { Colors, Typography, Spacing } from '@/constants/Theme';

  export function SectionTitle({ label }: { label: string }) {
    return (
      <View style={styles.row}>
        <Text style={styles.text}>{label}</Text>
        <View style={styles.line} />
      </View>
    );
  }

  const styles = StyleSheet.create({
    row:  { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
    text: { ...Typography.label, color: Colors.textMuted, marginRight: Spacing.sm },
    line: { flex: 1, height: 1, backgroundColor: Colors.border },
  });
  ```

- [ ] **Verificar TypeScript**

  ```bash
  npx tsc --noEmit
  ```

- [ ] **Commit**

  ```bash
  git add components/ui/Button.tsx components/ui/Input.tsx components/ui/StatusBadge.tsx components/ui/SectionTitle.tsx
  git commit -m "feat: adiciona componentes Button, Input, StatusBadge, SectionTitle"
  ```

---

## Task 5: Componentes UI — Card, ListItem, ProgressBar

**Files:**
- Create: `components/ui/Card.tsx`
- Create: `components/ui/ListItem.tsx`
- Create: `components/ui/ProgressBar.tsx`

- [ ] **Criar `components/ui/Card.tsx`**

  ```tsx
  import React from 'react';
  import { View, StyleSheet, type ViewProps } from 'react-native';
  import { Colors, Radius, Shadows } from '@/constants/Theme';

  export function Card({ style, children, ...rest }: ViewProps) {
    return (
      <View style={[styles.card, style]} {...rest}>
        {children}
      </View>
    );
  }

  const styles = StyleSheet.create({
    card: {
      backgroundColor: Colors.background,
      borderRadius: Radius.md,
      padding: 12,
      ...Shadows.card,
    },
  });
  ```

- [ ] **Criar `components/ui/ListItem.tsx`**

  ```tsx
  import React from 'react';
  import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
  import { Ionicons } from '@expo/vector-icons';
  import { Colors, Typography, Radius, Spacing } from '@/constants/Theme';

  interface ListItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
  }

  export function ListItem({ icon, title, subtitle, onPress }: ListItemProps) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.row}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={16} color={Colors.white} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={14} color={Colors.border} />
      </TouchableOpacity>
    );
  }

  const styles = StyleSheet.create({
    row:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.sm + 2, gap: Spacing.sm + 2 },
    iconBox: { width: 28, height: 28, backgroundColor: Colors.primary, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1 },
    title:   { ...Typography.subheading, fontSize: 13, color: Colors.textPrimary },
    subtitle:{ ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  });
  ```

- [ ] **Criar `components/ui/ProgressBar.tsx`**

  ```tsx
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { Colors, Typography, Radius, Spacing } from '@/constants/Theme';

  interface ProgressBarProps {
    value: number;        // 0–100
    label?: string;
    labelColor?: string;
    trackColor?: string;
    fillColor?: string;
  }

  export function ProgressBar({
    value,
    label,
    labelColor = 'rgba(255,255,255,0.7)',
    trackColor = 'rgba(255,255,255,0.15)',
    fillColor = '#7eb3ff',
  }: ProgressBarProps) {
    const pct = Math.min(100, Math.max(0, value));
    return (
      <View style={styles.row}>
        <View style={[styles.track, { backgroundColor: trackColor }]}>
          <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: fillColor }]} />
        </View>
        {label && <Text style={[styles.label, { color: labelColor }]}>{label}</Text>}
      </View>
    );
  }

  const styles = StyleSheet.create({
    row:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    track: { flex: 1, height: 4, borderRadius: Radius.pill, overflow: 'hidden' },
    fill:  { height: '100%', borderRadius: Radius.pill },
    label: { ...Typography.label, fontSize: 9 },
  });
  ```

- [ ] **Commit**

  ```bash
  git add components/ui/Card.tsx components/ui/ListItem.tsx components/ui/ProgressBar.tsx
  git commit -m "feat: adiciona componentes Card, ListItem, ProgressBar"
  ```

---

## Task 6: CrabLottie + ScreenHeader + InternalHeader

**Files:**
- Create: `components/ui/CrabLottie.tsx`
- Create: `components/ui/ScreenHeader.tsx`
- Create: `components/ui/InternalHeader.tsx`

- [ ] **Baixar animação do caranguejo**

  Acesse https://lottiefiles.com e pesquise por "crab". Baixe um arquivo `.json` de animação de caranguejo (prefira animações simples e minimalistas). Salve em `assets/lottie/crab-float.json`.

  Alternativa se preferir sem depender do site: use o arquivo `assets/lottie/LOGIN.json` existente como placeholder temporário e renomeie para `crab-float.json` até ter o arquivo definitivo.

- [ ] **Criar `components/ui/CrabLottie.tsx`**

  ```tsx
  import React, { useRef } from 'react';
  import LottieView from 'lottie-react-native';
  import { StyleSheet } from 'react-native';

  interface CrabLottieProps {
    size?: number;
    opacity?: number;
    style?: object;
  }

  export function CrabLottie({ size = 56, opacity = 0.4, style }: CrabLottieProps) {
    const ref = useRef<LottieView>(null);
    return (
      <LottieView
        ref={ref}
        source={require('@/assets/lottie/crab-float.json')}
        autoPlay
        loop
        style={[{ width: size, height: size, opacity }, style]}
        resizeMode="contain"
      />
    );
  }
  ```

- [ ] **Criar `components/ui/ScreenHeader.tsx`**

  ```tsx
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { Colors, Typography, Spacing } from '@/constants/Theme';
  import { ProgressBar } from './ProgressBar';
  import { CrabLottie } from './CrabLottie';

  interface ScreenHeaderProps {
    greeting: string;          // ex: "Olá, Maria."
    progressValue: number;     // 0–100
    nextExamName?: string;     // ex: "Mamografia"
    nextExamDate?: string;     // ex: "Junho 2025"
    onNextExamPress?: () => void;
  }

  export function ScreenHeader({ greeting, progressValue, nextExamName, nextExamDate, onNextExamPress }: ScreenHeaderProps) {
    return (
      <View style={styles.wrapper}>
        {/* Bloco azul */}
        <View style={styles.header}>
          <CrabLottie size={52} opacity={0.4} style={styles.crab} />
          <Text style={styles.appLabel}>Rastreando</Text>
          <Text style={styles.greeting}>{greeting}</Text>
          <ProgressBar
            value={progressValue}
            label={`${progressValue}% em dia`}
          />
        </View>

        {/* Card flutuante */}
        {nextExamName && (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>PRÓXIMO EXAME</Text>
              <Text style={styles.cardName}>{nextExamName}</Text>
              <Text style={styles.cardDate}>{nextExamDate}</Text>
            </View>
            <View style={styles.cardButton}>
              <Text style={styles.cardButtonText}>Agendar</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  const styles = StyleSheet.create({
    wrapper: { position: 'relative', zIndex: 1 },
    header:  { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 28 },
    crab:    { position: 'absolute', top: Spacing.lg, right: Spacing.lg },
    appLabel:{ ...Typography.label, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
    greeting:{ ...Typography.display, color: Colors.white, marginBottom: Spacing.md, fontSize: 22 },
    card: {
      position: 'absolute',
      bottom: -28,
      left: Spacing.lg,
      right: Spacing.lg,
      backgroundColor: Colors.white,
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 10,
    },
    cardInfo:       {},
    cardLabel:      { ...Typography.label, fontSize: 9, color: Colors.textMuted, marginBottom: 2 },
    cardName:       { ...Typography.heading, fontSize: 13, color: Colors.textPrimary },
    cardDate:       { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
    cardButton:     { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 11 },
    cardButtonText: { ...Typography.label, color: Colors.white },
  });
  ```

- [ ] **Criar `components/ui/InternalHeader.tsx`**

  ```tsx
  import React from 'react';
  import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
  import { Ionicons } from '@expo/vector-icons';
  import { useRouter } from 'expo-router';
  import { Colors, Typography, Spacing, Radius } from '@/constants/Theme';

  interface InternalHeaderProps {
    sectionLabel: string;   // ex: "SEUS EXAMES"
    title: string;          // ex: "Exames de Rastreio"
    onBack?: () => void;
  }

  export function InternalHeader({ sectionLabel, title, onBack }: InternalHeaderProps) {
    const router = useRouter();
    const handleBack = onBack ?? (() => router.back());
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={16} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.section}>{sectionLabel}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { paddingTop: Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, backgroundColor: Colors.background },
    backBtn:   { width: 28, height: 28, backgroundColor: Colors.surface, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
    section:   { ...Typography.label, color: Colors.textMuted, marginBottom: 2 },
    title:     { ...Typography.display, fontSize: 22, color: Colors.textPrimary },
  });
  ```

- [ ] **Verificar TypeScript**

  ```bash
  npx tsc --noEmit
  ```

- [ ] **Commit**

  ```bash
  git add components/ui/CrabLottie.tsx components/ui/ScreenHeader.tsx components/ui/InternalHeader.tsx assets/lottie/crab-float.json
  git commit -m "feat: adiciona CrabLottie, ScreenHeader e InternalHeader"
  ```

---

## Task 7: Tela Landing — `app/paginaInicial.tsx`

**Files:**
- Modify: `app/paginaInicial.tsx`

- [ ] **Substituir o conteúdo de `app/paginaInicial.tsx`**

  Mantenha toda a lógica de navegação existente, substitua apenas o visual:

  ```tsx
  import React from 'react';
  import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
  import { useRouter } from 'expo-router';
  import { Button } from '@/components/ui/Button';
  import { CrabLottie } from '@/components/ui/CrabLottie';
  import { Colors, Typography, Spacing, Radius } from '@/constants/Theme';

  export default function PaginaInicial() {
    const router = useRouter();

    return (
      <SafeAreaView style={styles.safe}>
        {/* Hero azul */}
        <View style={styles.hero}>
          <CrabLottie size={80} opacity={0.85} style={styles.crab} />
          <Text style={styles.appName}>Rastreando</Text>
          <Text style={styles.tagline}>Rastreamento oncológico{'\n'}para você e seus pacientes</Text>
          {/* Onda na base do hero */}
          {/* Em React Native use um View com borderBottomRadius para simular a onda */}
        </View>

        {/* Botões */}
        <View style={styles.actions}>
          <Button label="Entrar" onPress={() => router.push('/Login/TelaLogin')} style={styles.btn} />
          <Button label="Criar conta" variant="outline" onPress={() => router.push('/Cadastro/TelaCadastro')} style={styles.btn} />
          <Button label="Sou profissional de saúde →" variant="ghost" onPress={() => router.push('/Login/TelaLogin')} style={styles.btn} />
        </View>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe:    { flex: 1, backgroundColor: Colors.background },
    hero:    { backgroundColor: Colors.primary, alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.xxl + 16, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    crab:    { marginBottom: Spacing.lg },
    appName: { ...Typography.display, color: Colors.white, marginBottom: Spacing.sm },
    tagline: { ...Typography.body, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22 },
    actions: { flex: 1, padding: Spacing.xl, gap: Spacing.md, justifyContent: 'center' },
    btn:     { width: '100%' },
  });
  ```

- [ ] **Testar no simulador:** Landing deve mostrar hero azul com caranguejo animado, dois botões e link de profissional.

- [ ] **Commit**

  ```bash
  git add app/paginaInicial.tsx
  git commit -m "feat: redesign tela landing com hero azul e caranguejo"
  ```

---

## Task 8: Telas Login e Cadastro

**Files:**
- Modify: `app/Login/TelaLogin.tsx`
- Modify: `app/Cadastro/TelaCadastro.tsx`

- [ ] **Substituir visual de `app/Login/TelaLogin.tsx`** (manter toda lógica Firebase):

  Localize o bloco de JSX return e substitua:

  ```tsx
  // Adicionar imports no topo:
  import { Button } from '@/components/ui/Button';
  import { Input } from '@/components/ui/Input';
  import { CrabLottie } from '@/components/ui/CrabLottie';
  import { Colors, Typography, Spacing } from '@/constants/Theme';
  import { Ionicons } from '@expo/vector-icons';

  // Substituir o return:
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Mini hero */}
      <View style={{ backgroundColor: Colors.primary, alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.xxl + 8, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <CrabLottie size={44} opacity={0.75} style={{ marginBottom: Spacing.sm }} />
        <Text style={{ ...Typography.heading, color: Colors.white }}>Bem-vindo de volta</Text>
      </View>

      {/* Formulário */}
      <View style={{ flex: 1, padding: Spacing.xl, gap: Spacing.md, justifyContent: 'center' }}>
        <Input
          icon={<Ionicons name="mail-outline" size={16} color={Colors.textMuted} />}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          icon={<Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} />}
          placeholder="Senha"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />
        <Text
          style={{ ...Typography.caption, color: Colors.accent, textAlign: 'right' }}
          onPress={() => {/* lógica de recuperar senha existente */}}
        >
          Esqueci minha senha
        </Text>
        <Button label="Entrar" onPress={handleLogin} loading={loading} style={{ marginTop: Spacing.sm }} />
        <Text style={{ ...Typography.caption, color: Colors.textMuted, textAlign: 'center' }}>
          Não tem conta?{' '}
          <Text style={{ color: Colors.primary, fontFamily: 'Poppins-SemiBold' }} onPress={() => router.push('/Cadastro/TelaCadastro')}>
            Criar conta
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
  ```

  > Mantenha os estados `email`, `senha`, `loading` e a função `handleLogin` existentes — só o JSX muda.

- [ ] **Substituir visual de `app/Cadastro/TelaCadastro.tsx`** (manter lógica Firebase):

  ```tsx
  // Adicionar imports:
  import { Button } from '@/components/ui/Button';
  import { Input } from '@/components/ui/Input';
  import { Colors, Typography, Spacing } from '@/constants/Theme';
  import { Ionicons } from '@expo/vector-icons';

  // Adicionar estado para tipo de conta:
  const [tipoConta, setTipoConta] = useState<'paciente' | 'profissional'>('paciente');

  // Substituir o return:
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{ backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl + 4, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <Text style={{ ...Typography.label, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>CRIAR CONTA</Text>
        <Text style={{ ...Typography.display, color: Colors.white, fontSize: 20, marginBottom: 4 }}>Crie sua conta</Text>
        <Text style={{ ...Typography.caption, color: 'rgba(255,255,255,0.55)', marginBottom: Spacing.md }}>Paciente ou profissional de saúde</Text>
        {/* Seletor de tipo */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <Button
            label="Paciente"
            variant={tipoConta === 'paciente' ? 'primary' : 'ghost'}
            onPress={() => setTipoConta('paciente')}
            style={{ flex: 1, backgroundColor: tipoConta === 'paciente' ? Colors.white : 'rgba(255,255,255,0.12)', borderRadius: 8, paddingVertical: 8 }}
          />
          <Button
            label="Profissional"
            variant={tipoConta === 'profissional' ? 'primary' : 'ghost'}
            onPress={() => setTipoConta('profissional')}
            style={{ flex: 1, backgroundColor: tipoConta === 'profissional' ? Colors.white : 'rgba(255,255,255,0.12)', borderRadius: 8, paddingVertical: 8 }}
          />
        </View>
      </View>

      <View style={{ flex: 1, padding: Spacing.xl, gap: Spacing.md }}>
        <Input icon={<Ionicons name="person-outline" size={16} color={Colors.textMuted} />} placeholder="Nome completo" value={nome} onChangeText={setNome} />
        <Input icon={<Ionicons name="mail-outline" size={16} color={Colors.textMuted} />} placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <Input icon={<Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} />} placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
        <Button label="Criar conta" onPress={handleCadastro} loading={loading} style={{ marginTop: Spacing.sm }} />
      </View>
    </SafeAreaView>
  );
  ```

- [ ] **Testar Login e Cadastro no simulador:** fluxo de autenticação deve funcionar normalmente.

- [ ] **Commit**

  ```bash
  git add app/Login/TelaLogin.tsx app/Cadastro/TelaCadastro.tsx
  git commit -m "feat: redesign telas Login e Cadastro"
  ```

---

## Task 9: Tela Home Paciente — `app/Home/TelaDeHomeUsuario.tsx`

**Files:**
- Modify: `app/Home/TelaDeHomeUsuario.tsx`

- [ ] **Substituir o JSX return mantendo toda a lógica Firebase/navegação**

  Adicionar imports:

  ```tsx
  import { ScreenHeader } from '@/components/ui/ScreenHeader';
  import { ListItem } from '@/components/ui/ListItem';
  import { Colors, Spacing } from '@/constants/Theme';
  ```

  Substituir o return:

  ```tsx
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header com card flutuante — zIndex necessário */}
      <View style={{ zIndex: 1 }}>
        <ScreenHeader
          greeting={`Olá, ${userName}.`}
          progressValue={65}
          nextExamName="Mamografia"
          nextExamDate="Junho 2025"
          onNextExamPress={() => router.push('/ProximosExames')}
        />
      </View>

      {/* Corpo — paddingTop acomoda metade do card flutuante */}
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.background }}
        contentContainerStyle={{ paddingTop: 44, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.sm }}
        showsVerticalScrollIndicator={false}
      >
        <ListItem icon="person-outline"    title="Perfil Individual"   subtitle={userSexo === 'mulher' ? 'Feminino' : 'Masculino'} onPress={handlePerfilIndividualPress} />
        <ListItem icon="pulse-outline"     title="Calcular Risco"      subtitle="Veja seu risco atual"      onPress={() => router.push('/PerfilIndividual/CalculeSeuRisco')} />
        <ListItem icon="calendar-outline"  title="Exames de Rastreio"  subtitle="3 pendentes"               onPress={() => router.push('/PerfilIndividual/SeusExamesDeRastreio')} />
        <ListItem icon="alert-circle-outline" title="Sinais e Sintomas" subtitle="Sem alertas"             onPress={() => router.push('/PerfilIndividual/SinaisESintomas')} />
        <ListItem icon="time-outline"      title="Próximos Exames"     subtitle="Ver agenda"                onPress={() => router.push('/ProximosExames')} />
      </ScrollView>
    </SafeAreaView>
  );
  ```

  > Adicione `import { ScrollView } from 'react-native'` se ainda não estiver importado.

- [ ] **Testar no simulador:** card deve aparecer sobreposto à borda do header azul. Itens da lista devem navegar corretamente.

- [ ] **Commit**

  ```bash
  git add app/Home/TelaDeHomeUsuario.tsx
  git commit -m "feat: redesign Home Paciente com ScreenHeader e ListItems"
  ```

---

## Task 10: Telas Home Profissional

**Files:**
- Modify: `app/Home/TelaDeHomeProfissional.tsx`
- Modify: `app/Home/TelaDeHomeProfissionalPessoal.tsx`

- [ ] **Aplicar o mesmo padrão do Task 9 em `TelaDeHomeProfissional.tsx`**

  Usar `ScreenHeader` com `greeting="Olá, Dr. [nome]."` e `ListItem`s com as opções do profissional:
  - `person-outline` → "Meu Perfil"
  - `people-outline` → "Rastrear Paciente"
  - `document-text-outline` → "Indicações de Rastreio"
  - `clipboard-outline` → "Conduta e Manejo"

- [ ] **Aplicar o mesmo padrão em `TelaDeHomeProfissionalPessoal.tsx`**

  Usar `ScreenHeader` adaptado para o perfil pessoal do profissional.

- [ ] **Commit**

  ```bash
  git add app/Home/TelaDeHomeProfissional.tsx app/Home/TelaDeHomeProfissionalPessoal.tsx
  git commit -m "feat: redesign Home Profissional"
  ```

---

## Task 11: Telas Internas — Perfil Individual e Rastrear Paciente

**Files:**
- Modify: `app/PerfilIndividual/PerfilIndividualMulher.tsx`
- Modify: `app/PerfilIndividual/PerfilIndividualHomem.tsx`
- Modify: `app/RastrearMeuPaciente/RastrearMeuPaciente.tsx`
- Modify: `app/RastrearMeuPaciente/RastrearHomem.tsx`
- Modify: `app/RastrearMeuPaciente/RastrearMulher.tsx`
- Modify: `app/RastrearMeuPaciente/RastrearPacienteNeoplasia.tsx`

- [ ] **Padrão a aplicar em cada tela (Padrão 2 — título inline)**

  Substituir qualquer header existente por:

  ```tsx
  import { InternalHeader } from '@/components/ui/InternalHeader';
  import { Colors, Spacing } from '@/constants/Theme';

  // No return, no topo do ScrollView:
  <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
    <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
    <ScrollView showsVerticalScrollIndicator={false}>
      <InternalHeader sectionLabel="SEÇÃO" title="Título da Tela" />
      {/* conteúdo existente reestilizado com Colors e Typography */}
    </ScrollView>
  </SafeAreaView>
  ```

  Para cada tela, substituir as cores hardcoded (`#232d97`, `#1A237E`, etc.) pelas constantes do Theme:
  - Fundo: `Colors.background` (`#fff`)
  - Azul: `Colors.primary` (`#0f2d63`)
  - Cards: `Colors.surface` (`#f5f7fc`)
  - Texto principal: `Colors.textPrimary`
  - Texto secundário: `Colors.textSecondary`
  - Fonte: `Poppins-Bold` / `Poppins-SemiBold` / `Poppins-Regular`

- [ ] **Aplicar em `PerfilIndividualMulher.tsx`** com `sectionLabel="SEU PERFIL"` e `title="Perfil Individual"`

- [ ] **Aplicar em `PerfilIndividualHomem.tsx`** com mesmos labels

- [ ] **Aplicar em `RastrearMeuPaciente.tsx`** com `sectionLabel="RASTREAR"` e `title="Meu Paciente"`

- [ ] **Aplicar em `RastrearHomem.tsx`**, `RastrearMulher.tsx`, `RastrearPacienteNeoplasia.tsx`

- [ ] **Commit**

  ```bash
  git add app/PerfilIndividual/PerfilIndividualMulher.tsx app/PerfilIndividual/PerfilIndividualHomem.tsx app/RastrearMeuPaciente/RastrearMeuPaciente.tsx app/RastrearMeuPaciente/RastrearHomem.tsx app/RastrearMeuPaciente/RastrearMulher.tsx app/RastrearMeuPaciente/RastrearPacienteNeoplasia.tsx
  git commit -m "feat: redesign Perfil Individual e Rastrear Paciente"
  ```

---

## Task 12: Telas Internas — Exames de Rastreio (7 telas)

**Files:**
- Modify: `app/PerfilIndividual/SeusExamesDeRastreio/` (todas as telas)

- [ ] **Listar as telas existentes**

  ```bash
  ls "app/PerfilIndividual/SeusExamesDeRastreio/"
  ```

- [ ] **Aplicar Padrão 2 + StatusBadge em cada tela**

  Substituir headers existentes por `InternalHeader`. Nos cards de exame, adicionar `StatusBadge` com status adequado:

  ```tsx
  import { StatusBadge, type BadgeStatus } from '@/components/ui/StatusBadge';
  import { Card } from '@/components/ui/Card';

  // Exemplo de card de exame:
  <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
    <View>
      <Text style={{ ...Typography.subheading, color: Colors.textPrimary }}>Mamografia</Text>
      <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>Junho 2025</Text>
    </View>
    <StatusBadge status="pending" />
  </Card>
  ```

- [ ] **Aplicar nas 7 telas** com `sectionLabel` e `title` correspondentes a cada tipo de exame.

- [ ] **Commit**

  ```bash
  git add "app/PerfilIndividual/SeusExamesDeRastreio/"
  git commit -m "feat: redesign telas Exames de Rastreio com StatusBadge"
  ```

---

## Task 13: Telas Internas — Demais (SinaisESintomas, ProximosExames, MarcarConsulta, IndicacoesRastreio, CondutaManejoResultados)

**Files:**
- Modify: `app/PerfilIndividual/SinaisESintomas.tsx`
- Modify: `app/ProximosExames.tsx`
- Modify: `app/MarcarConsulta.tsx`
- Modify: `app/RastrearMeuPaciente/IndicacoesRastreio.tsx`
- Modify: `app/RastrearMeuPaciente/CondutaManejoResultados.tsx`

- [ ] **Aplicar Padrão 2 nas 5 telas** com `InternalHeader` e substituição de cores/fontes hardcoded.

  Labels sugeridos:
  - `SinaisESintomas`: `sectionLabel="ALERTAS"` / `title="Sinais e Sintomas"`
  - `ProximosExames`: `sectionLabel="AGENDA"` / `title="Próximos Exames"`
  - `MarcarConsulta`: `sectionLabel="CONSULTA"` / `title="Marcar Consulta"`
  - `IndicacoesRastreio`: `sectionLabel="RASTREAR"` / `title="Indicações de Rastreio"`
  - `CondutaManejoResultados`: `sectionLabel="RESULTADOS"` / `title="Conduta e Manejo"`

- [ ] **Commit**

  ```bash
  git add app/PerfilIndividual/SinaisESintomas.tsx app/ProximosExames.tsx app/MarcarConsulta.tsx app/RastrearMeuPaciente/IndicacoesRastreio.tsx app/RastrearMeuPaciente/CondutaManejoResultados.tsx
  git commit -m "feat: redesign telas internas restantes"
  ```

---

## Task 14: Telas Calculadoras — `PerfilIndividual/CalculeSeuRisco/` (6 telas)

**Files:**
- Modify: `app/PerfilIndividual/CalculeSeuRisco/` (6 telas)

- [ ] **Listar as telas existentes**

  ```bash
  ls "app/PerfilIndividual/CalculeSeuRisco/"
  ```

- [ ] **Padrão Calculadora (Padrão 3) a aplicar em cada tela de pergunta**

  ```tsx
  import { Colors, Typography, Spacing, Radius } from '@/constants/Theme';

  // Header azul compacto com steps:
  <View style={{ backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.lg }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
      <TouchableOpacity onPress={() => router.back()} style={{ width: 22, height: 22, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 7, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="chevron-back" size={12} color={Colors.white} />
      </TouchableOpacity>
      <Text style={{ ...Typography.label, color: 'rgba(255,255,255,0.5)' }}>CALCULE SEU RISCO</Text>
    </View>
    <Text style={{ ...Typography.heading, color: Colors.white, marginBottom: Spacing.md }}>Câncer de Mama</Text>
    {/* Steps como barras */}
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < currentStep ? Colors.white : 'rgba(255,255,255,0.25)' }} />
      ))}
      <Text style={{ ...Typography.label, color: 'rgba(255,255,255,0.5)', marginLeft: 6, fontSize: 8 }}>{currentStep} / {totalSteps}</Text>
    </View>
  </View>

  {/* Corpo branco com pergunta e opções */}
  <ScrollView style={{ flex: 1, backgroundColor: Colors.white }} contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}>
    <Text style={{ ...Typography.heading, color: Colors.textPrimary }}>{pergunta}</Text>
    {opcoes.map((opcao, i) => {
      const selected = selectedIndex === i;
      return (
        <TouchableOpacity
          key={i}
          onPress={() => setSelectedIndex(i)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 2, borderColor: selected ? Colors.primary : Colors.border, backgroundColor: selected ? '#f0f4ff' : Colors.background }}
        >
          <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: selected ? Colors.primary : Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? Colors.primary : 'transparent' }}>
            {selected && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white }} />}
          </View>
          <Text style={{ ...Typography.body, color: selected ? Colors.textPrimary : Colors.textSecondary, flex: 1, fontFamily: selected ? 'Poppins-SemiBold' : 'Poppins-Regular' }}>{opcao}</Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>

  {/* Botão fixo no rodapé */}
  <View style={{ padding: Spacing.lg, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border }}>
    <Button label="Próxima →" onPress={handleNext} disabled={selectedIndex === null} />
  </View>
  ```

- [ ] **Aplicar nas 6 telas** de CalculeSeuRisco (3 femininas + 3 masculinas).

- [ ] **Tela de resultado** — aplicar o card flutuante com gauge:

  ```tsx
  // Gauge SVG simples (valor 0-100 → 0°-180°)
  // Usar biblioteca react-native-svg se disponível, ou representar com View + cores:
  <View style={{ alignItems: 'center', padding: Spacing.xl }}>
    <Text style={{ ...Typography.label, color: Colors.textMuted, marginBottom: Spacing.sm }}>SEU RISCO CALCULADO</Text>
    <Text style={{ ...Typography.display, color: Colors.success, fontSize: 32 }}>Baixo</Text>
    <Text style={{ ...Typography.body, color: Colors.textSecondary }}>Risco abaixo da média</Text>
  </View>
  ```

- [ ] **Commit**

  ```bash
  git add "app/PerfilIndividual/CalculeSeuRisco/"
  git commit -m "feat: redesign telas Calculadoras de Risco"
  ```

---

## Task 15: Limpeza Final

**Files:**
- Delete (opcional): `assets/fonts/Helvetica*.ttf`, `assets/fonts/SpaceMono-Regular.ttf`, `assets/fonts/Quicksand-*.ttf`

- [ ] **Verificar que nenhuma tela ainda referencia fontes antigas**

  ```bash
  grep -r "Quicksand\|Helvetica\|SpaceMono" app/ --include="*.tsx" -l
  ```

  Se aparecer algum arquivo, abrir e substituir pela fonte Poppins equivalente.

- [ ] **Verificar que nenhuma tela usa cores hardcoded antigas** (`#232d97`, `#1A237E`, `#3949AB`, `#ff5721`)

  ```bash
  grep -r "#232d97\|#1A237E\|#3949AB\|#ff5721" app/ --include="*.tsx" -l
  ```

  Substituir por `Colors.primary` ou `Colors.accent` do Theme.

- [ ] **Remover fontes não usadas** (após confirmar que nenhuma referência existe):

  ```bash
  rm assets/fonts/Helvetica*.ttf assets/fonts/SpaceMono-Regular.ttf assets/fonts/Quicksand-*.ttf
  ```

- [ ] **Build final para verificar**

  ```bash
  npx expo export --platform ios
  ```
  Esperado: build sem erros.

- [ ] **Commit final**

  ```bash
  git add -A
  git commit -m "chore: remove fontes antigas e limpa cores hardcoded"
  ```

---

## Revisão — Cobertura do Spec

| Requisito do spec | Task |
|---|---|
| `constants/Theme.ts` com todos os tokens | Task 2 |
| `constants/Colors.ts` atualizado | Task 2 |
| Fonte Poppins carregada globalmente | Task 1 |
| Caranguejo Lottie animado | Task 6 |
| `ScreenHeader` com card flutuante correto | Task 6 |
| `InternalHeader` título inline (Padrão C) | Task 6 |
| Todos os 8 componentes UI novos | Tasks 4, 5, 6 |
| Landing com hero azul + caranguejo | Task 7 |
| Login com mini hero + caranguejo | Task 8 |
| Cadastro com seletor Paciente/Profissional | Task 8 |
| 3 telas Home (Padrão 1) | Tasks 9, 10 |
| 17 telas internas (Padrão 2) | Tasks 11, 12, 13 |
| 6 telas Calculadoras (Padrão 3) | Task 14 |
| Limpeza de fontes e cores antigas | Task 15 |
