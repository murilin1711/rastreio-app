import type { AcaoModulo } from '@ui/index';

interface Entrada {
  /** Sessão de MRPA em andamento (`dia` vem de `useMrpa`), ou `null`. */
  mrpa: { id: string; dia: number; diasPrevistos: number } | null;
  subtituloPrevencao?: string;
}

/**
 * Ações do módulo "Pressão, coração e diabetes" no molde único (spec de navegação §6.5, D-065).
 * O MRPA dura de 4 a 6 dias (C-011): o nome não fixa a duração e o progresso usa `diasPrevistos`.
 */
export function acoesCoracao({ mrpa, subtituloPrevencao }: Entrada): AcaoModulo[] {
  const diaMrpa = mrpa ? Math.min(Math.max(mrpa.dia, 1), mrpa.diasPrevistos) : 0;
  return [
    { chave: 'pressao', icone: 'pulse-outline', titulo: 'Minha pressão', subtitulo: 'anotar e ver como está', rota: '/(app)/coracao/pressao' },
    mrpa
      ? { chave: 'mrpa', icone: 'calendar-outline', titulo: `Continuar o MRPA — dia ${diaMrpa} de ${mrpa.diasPrevistos}`, subtitulo: 'quando o médico pedir', rota: `/(app)/coracao/mrpa/${mrpa.id}` }
      : { chave: 'mrpa', icone: 'calendar-outline', titulo: 'Medir a pressão por alguns dias (MRPA)', subtitulo: 'quando o médico pedir', rota: '/(app)/coracao/mrpa/iniciar' },
    { chave: 'glicemia', icone: 'eyedrop-outline', titulo: 'Minha glicemia', subtitulo: 'anotar, plano e relatório', rota: '/(app)/coracao/glicemia' },
    { chave: 'exames', icone: 'flask-outline', titulo: 'Ver meus exames', subtitulo: 'todos os exames num lugar só', rota: '/(app)/(tabs)/minha-saude/exames' },
    { chave: 'risco', icone: 'heart-outline', titulo: 'Calcular o risco do meu coração', rota: '/(app)/coracao/risco' },
    { chave: 'prevencao', icone: 'checkmark-circle-outline', titulo: 'Como está minha prevenção?', subtitulo: subtituloPrevencao, rota: '/(app)/coracao/checkup' },
    { chave: 'sinais', icone: 'alert-circle-outline', titulo: 'Quando procurar o pronto-socorro', rota: '/(app)/coracao/sinais' },
  ];
}
