import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Colors } from '@ui/theme';

/**
 * Barra de abas nativa (D-022): no iOS 26 o sistema entrega Liquid Glass, ícone ativo em
 * `.fill`, adaptação clara/escura pelo conteúdo atrás, minimizar ao rolar e os modos de
 * acessibilidade (Reduce Transparency, Increase Contrast, Reduce Motion). No Android vira
 * a barra do Material 3.
 *
 * As abas são os **eixos transversais** — o que a pessoa faz em qualquer módulo. Os módulos
 * (Rastreando, Coração, Bem-estar) ficam fora deste grupo e são alcançados pela grade da
 * Home: `hidden` aqui tornaria a rota inalcançável, não apenas invisível.
 *
 * Ícones: `sf` só vale em plataformas Apple (licença dos SF Symbols); `md` é o par do Android.
 */
export default function TabsLayout() {
  return (
    <NativeTabs tintColor={Colors.primary} minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Início</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="agenda">
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        <NativeTabs.Trigger.Label>Agenda</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="historico">
        <NativeTabs.Trigger.Icon sf={{ default: 'clock', selected: 'clock.fill' }} md="history" />
        <NativeTabs.Trigger.Label>Histórico</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="minha-saude">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md="account_circle"
        />
        <NativeTabs.Trigger.Label>Minha Saúde</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
