import { EMAIL_CONTATO } from '@core/publicacao';

/**
 * E-mail de contato (D-057). A versão do app e do sistema ajuda a entender um defeito sem perguntar de
 * volta. O corpo pede para não mandar resultado de exame: a política promete que dado de saúde não
 * trafega por e-mail, e a caixa do NERO não é prontuário.
 */
export function urlEmailContato(info: { versaoApp: string; build: string | null; sistema: string }): string {
  const versao = `NERO ${info.versaoApp}${info.build ? ` (${info.build})` : ''} · ${info.sistema}`;
  const corpo = [
    'Escreva aqui sua dúvida, problema ou sugestão:',
    '',
    '',
    '',
    '(Evite colocar resultados de exames ou outros dados de saúde neste e-mail.)',
    versao,
  ].join('\n');
  return `mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent('Ajuda com o NERO')}&body=${encodeURIComponent(corpo)}`;
}
