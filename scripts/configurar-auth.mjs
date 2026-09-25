/**
 * Configura o Auth do projeto NERO na Supabase (D-019): SMTP do Resend, templates dos e-mails de
 * confirmação e de recuperação de senha com código de 6 dígitos, e limites de envio.
 *
 * NUNCA use `supabase config push` para isto. Verificado em 24/09: o `config.toml` do repositório
 * está desatualizado em relação ao servidor — nele a confirmação de e-mail aparece **desligada** e o
 * SMTP do Resend **não existe**, porque essa configuração foi feita por esta API e não pelo arquivo.
 * Um push empurraria o local por cima e derrubaria o cadastro junto com o envio de e-mails. Este
 * script altera só os campos que lista.
 *
 * Os segredos vêm por variável de ambiente e NUNCA são gravados em disco nem impressos.
 *
 *   SUPABASE_ACCESS_TOKEN=sbp_... RESEND_API_KEY=re_... node scripts/configurar-auth.mjs
 *       → só mostra o que mudaria (padrão, não altera nada)
 *
 *   ... node scripts/configurar-auth.mjs --aplicar
 *       → aplica SMTP, template e limites. NÃO liga a exigência de confirmação.
 *
 *   ... node scripts/configurar-auth.mjs --aplicar --ligar-confirmacao
 *       → aplica tudo e passa a EXIGIR o código no cadastro (mailer_autoconfirm = false).
 *
 * A confirmação é passo separado de propósito: dá para testar se o e-mail chega antes de exigir o
 * código de todo mundo. Ligar antes de o envio funcionar tranca cadastros novos.
 */
const REF = 'ycljqpwpeoonqisqdrws';
const API = `https://api.supabase.com/v1/projects/${REF}/config/auth`;

const token = process.env.SUPABASE_ACCESS_TOKEN;
const chaveResend = process.env.RESEND_API_KEY;
const aplicar = process.argv.includes('--aplicar');
const ligarConfirmacao = process.argv.includes('--ligar-confirmacao');

if (!token) { console.error('Falta SUPABASE_ACCESS_TOKEN.'); process.exit(1); }
// A chave do Resend só é necessária para (re)configurar o SMTP. Com o SMTP já no ar, dá para
// atualizar apenas os textos dos e-mails — e a chave não pode ser lida de volta do servidor, então
// exigi-la obrigaria a gerar uma nova só para trocar uma frase.
if (!chaveResend) console.warn('Sem RESEND_API_KEY: o SMTP não será tocado, só os textos e limites.');

const REMETENTE = 'nao-responda@nerosaude.com.br';

/** Mesma moldura nos dois e-mails; muda só o miolo. */
const moldura = (miolo) => `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #0f2d63; line-height: 1.6; max-width: 480px;">
  <p>Olá!</p>
${miolo}
  <p style="font-size: 40px; font-weight: bold; letter-spacing: 8px; text-align: center; margin: 28px 0; color: #0f2d63;">{{ .Token }}</p>
  <p>O código vale por 1 hora.</p>
</div>`;

const TEMPLATE = moldura(`  <p>Para terminar seu cadastro no <strong>Nero Saúde</strong>, digite este código no aplicativo:</p>`)
  .replace('</div>', `  <p style="font-size: 16px; color: #4A5C7A;">Pedimos esse código para ter certeza de que este e-mail é seu. É por ele que você recupera sua senha, caso um dia esqueça.</p>
  <p style="font-size: 16px; color: #4A5C7A;">Se não foi você quem criou a conta, pode ignorar esta mensagem.</p>
</div>`);

/**
 * Recuperação de senha (D-033). Sem isto, o Supabase manda o template padrão dele: link, em inglês.
 * O app espera **código**, igual ao do cadastro, porque link obriga a sair do app e voltar.
 */
const TEMPLATE_RECUPERACAO = moldura(`  <p>Você pediu uma senha nova no <strong>Nero Saúde</strong>. Digite este código no aplicativo:</p>`)
  .replace('</div>', `  <p style="font-size: 16px; color: #4A5C7A;">Se não foi você quem pediu, pode ignorar esta mensagem: sua senha continua a mesma.</p>
</div>`);

const config = {
  ...(chaveResend ? {
    smtp_host: 'smtp.resend.com',
    smtp_port: '465',
    smtp_user: 'resend',
    smtp_pass: chaveResend,
    smtp_admin_email: REMETENTE,
    smtp_sender_name: 'Nero Saúde',
  } : {}),
  // Um e-mail por minuto para o mesmo endereço: bate com a espera de reenvio da tela (ESPERA_REENVIO_S).
  smtp_max_frequency: 60,
  mailer_subjects_confirmation: 'Seu código do Nero Saúde',
  mailer_templates_confirmation_content: TEMPLATE,
  mailer_subjects_recovery: 'Sua nova senha do Nero Saúde',
  mailer_templates_recovery_content: TEMPLATE_RECUPERACAO,
  mailer_otp_length: 6,
  mailer_otp_exp: 3600,
  // O padrão da Supabase ao ligar SMTP próprio é 30/hora, baixo para cadastro real.
  rate_limit_email_sent: 100,
};

if (ligarConfirmacao) config.mailer_autoconfirm = false;

const cabecalho = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const esconder = (o) => ({ ...o, smtp_pass: o.smtp_pass ? '<oculto>' : undefined });

const antes = await fetch(API, { headers: cabecalho });
if (!antes.ok) { console.error(`Falha ao ler a configuração: ${antes.status} ${await antes.text()}`); process.exit(1); }
const atual = await antes.json();

const relevantes = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_admin_email', 'smtp_sender_name', 'smtp_max_frequency', 'mailer_autoconfirm', 'mailer_subjects_confirmation', 'mailer_subjects_recovery', 'mailer_otp_length', 'mailer_otp_exp', 'rate_limit_email_sent'];
console.log('\nEstado atual → desejado:\n');
for (const k of relevantes) {
  const de = atual[k];
  const para = k in config ? config[k] : '(não muda)';
  const igual = k in config && String(de) === String(para);
  console.log(`  ${k.padEnd(34)} ${String(de).slice(0, 40).padEnd(42)} ${igual ? '=' : '→'}  ${String(para).slice(0, 40)}`);
}
const temTemplate = (atual.mailer_templates_confirmation_content ?? '').includes('{{ .Token }}');
console.log(`\n  template com {{ .Token }}          ${temTemplate ? 'já tem' : 'ainda usa link/padrão'}  →  passa a usar o código`);
const temRecuperacao = (atual.mailer_templates_recovery_content ?? '').includes('{{ .Token }}');
console.log(`  recuperação com {{ .Token }}      ${temRecuperacao ? 'já tem' : 'ainda usa link/padrão'}  →  passa a usar o código`);
console.log(`  mailer_autoconfirm                 ${atual.mailer_autoconfirm}  →  ${ligarConfirmacao ? 'false (EXIGE o código)' : '(não muda nesta execução)'}`);

if (!aplicar) {
  console.log('\nNada foi alterado. Rode de novo com --aplicar para gravar.\n');
  process.exit(0);
}

const r = await fetch(API, { method: 'PATCH', headers: cabecalho, body: JSON.stringify(config) });
if (!r.ok) { console.error(`\nFalha ao gravar: ${r.status} ${await r.text()}`); process.exit(1); }

const depois = await (await fetch(API, { headers: cabecalho })).json();
console.log('\nGravado. Conferindo no servidor:\n');
let ok = true;
for (const [k, v] of Object.entries(esconder(config))) {
  if (k === 'smtp_pass') { console.log(`  ${k.padEnd(34)} gravado (não é devolvido pela API)`); continue; }
  const bate = String(depois[k]) === String(v);
  if (!bate) ok = false;
  console.log(`  ${bate ? 'ok  ' : 'ERRO'} ${k.padEnd(34)} ${String(depois[k]).slice(0, 50)}`);
}
console.log(ok ? '\nTudo conferido.\n' : '\nAlgum campo não bateu — ver acima.\n');
