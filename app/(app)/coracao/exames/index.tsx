import { Redirect, type Href } from 'expo-router';
import { comVolta } from '@core/navegacao/voltarPara';

/**
 * Os exames moram numa lista só, em Minha Saúde › Meus exames (D-065). A rota antiga fica, como
 * redirecionamento, por causa de links e notificações antigas; a seta volta ao módulo.
 */
export default function ExamesCoracao() {
  return <Redirect href={comVolta('/(app)/(tabs)/minha-saude/exames', '/coracao') as Href} />;
}
