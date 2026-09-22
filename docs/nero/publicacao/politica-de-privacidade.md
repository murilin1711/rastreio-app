# Política de Privacidade — NERO

> **RASCUNHO (18/09/2026)** — escrito a partir do que o app realmente faz (tabelas em `supabase/migrations/`, buckets `laudos` e `relatorios`, código em `src/core/`). Os campos entre `[[ ]]` só o Murilo pode preencher. Depois de revisado, publicar em URL pública (decisão pendente: GitHub Pages) e apontar em `app.json`, na App Store Connect e no Play Console.

**Última atualização:** [[data da publicação]]

## 1. Quem é o responsável

O aplicativo NERO é mantido por **[[nome completo ou razão social]]**, [[CPF ou CNPJ]], com endereço em [[cidade/UF]] ("nós"). Para qualquer assunto sobre seus dados, incluindo o exercício dos direitos previstos na LGPD, escreva para **nerosaude@gmail.com**. Encarregado pelo tratamento de dados (art. 41 da LGPD): [[nome ou "o próprio responsável"]].

## 2. O que o NERO é — e o que não é

O NERO organiza informações de saúde que **você mesmo registra**: exames de rastreamento, pressão arterial, glicemia, medidas corporais, hábitos, medicações, documentos e consultas. Ele mostra, para cada registro, o que as diretrizes médicas brasileiras recomendam, com a fonte.

O NERO **não faz diagnóstico, não prescreve e não substitui a consulta com um profissional de saúde**. Os relatórios organizam o que você registrou; a interpretação é sempre do seu médico. Em caso de sintomas de alarme, procure atendimento — o app orienta isso e não tenta avaliar urgência por conta própria.

## 3. Quais dados tratamos

Todos os dados abaixo são fornecidos por você, no app. Não coletamos dados de outras fontes.

**Conta**
- E-mail e senha (a senha é armazenada apenas como hash, pelo nosso provedor de autenticação; nunca temos acesso a ela).

**Perfil de saúde** (dado pessoal sensível, art. 5º, II da LGPD)
- Nome, data de nascimento, sexo ao nascer, altura.
- Condições que mudam as recomendações: diabetes, hipertensão, doença renal, insuficiência cardíaca, imunossupressão, HIV, doença inflamatória intestinal, tabagismo (situação, cigarros por dia, tempo), histórico pessoal de câncer, lesões precursoras, doenças genéticas, radioterapia torácica, histerectomia.
- Antecedentes familiares de câncer e de doença cardiovascular (parentesco, idade ao diagnóstico) — sem identificação dos familiares.

**Registros que você faz**
- Exames de rastreamento (tipo, data, resultado) e pendências geradas a partir deles.
- Medidas: pressão arterial (inclusive sessões de MRPA), glicemia, peso, cintura, quadril, composição corporal, sono.
- Exames laboratoriais e estimativa de risco cardiovascular calculada a partir deles.
- Medicações e horários; sintomas de alarme assinalados.
- Refeições, atividades físicas, check-ins de bem-estar, metas.
- Ingestão de água (quantidade e horário de cada registro) e a meta diária, calculada a partir do seu peso.
- Consultas (data, especialidade, anotações) e lembretes.

**Uso do app**
- Os dias em que você registrou alguma coisa (só a data, nunca o que foi registrado), para mostrar sua sequência de dias seguidos, e quais marcos de meta e conquistas de uso já foram comemorados. Esses dados servem apenas para o app não repetir a mesma comemoração; não são compartilhados nem entram nos relatórios.

**Documentos** (dado sensível)
- Imagens e PDFs de laudos, receitas e exames que você anexa por foto, galeria ou arquivo. Ficam em área de armazenamento privada, acessível só pela sua conta.

**Relatórios**
- PDFs gerados a partir dos seus registros. Se você escolher compartilhar por QR Code, o PDF é guardado em área privada e um link temporário é criado (ver seção 6).

**O que não coletamos**
- Localização, contatos, microfone, dados de outros apps, identificadores de publicidade.
- Não usamos ferramentas de analytics, rastreadores nem anúncios. Não há SDK de terceiros para esse fim no app.

## 4. Para que usamos os dados

- Mostrar suas recomendações de rastreamento e acompanhamento conforme as diretrizes cadastradas no app, calculadas a partir do seu perfil e registros.
- Gerar pendências, lembretes e relatórios que você pede.
- Manter sua conta e sincronizar seus dados entre sessões.

Não usamos seus dados para outra finalidade, não os vendemos e não os usamos para publicidade ou perfilamento comercial.

## 5. Base legal

- Dados de saúde: **consentimento específico e destacado** (art. 11, I da LGPD), dado quando você cria a conta e preenche o perfil. Você pode revogá-lo a qualquer momento excluindo a conta (seção 8).
- E-mail e senha: execução do serviço que você contratou ao criar a conta (art. 7º, V).

## 6. Com quem os dados são compartilhados

- **Ninguém recebe seus dados por padrão.** Só você acessa o que registrou; as regras de acesso do banco de dados impedem que uma conta leia dados de outra.
- **Compartilhamento por QR Code:** quando você gera um relatório com QR, criamos um link assinado válido por **7 dias**; quem tiver o link (por exemplo, seu médico, ao escanear o QR) consegue abrir aquele PDF nesse período. Você pode revogar o link antes do prazo na tela do relatório. Depois de 7 dias o link deixa de funcionar.
- **Operador de infraestrutura:** os dados ficam hospedados na Supabase (banco de dados, autenticação e armazenamento de arquivos), em servidores localizados em **São Paulo, Brasil**, com criptografia em trânsito (TLS) e em repouso. A Supabase atua como operadora, sob nossas instruções, mantém as cópias de segurança citadas na seção 8 e não usa os dados para fins próprios. Política da Supabase: https://supabase.com/privacy.
- **Operador de envio de e-mail:** para enviar o código de confirmação de cadastro e a recuperação de senha, seu endereço de e-mail é transmitido ao serviço **Resend**, que atua como operador e o utiliza exclusivamente para entregar essas mensagens. Nenhum dado de saúde é enviado por e-mail.
- Autoridades: apenas se houver obrigação legal ou ordem judicial.

## 7. Lembretes e notificações

Os lembretes são notificações **locais**, agendadas no seu aparelho — de medicações, consultas, exames pendentes e, se você ligar, de ingestão de água (nesse caso você escolhe a janela do dia e o intervalo entre os avisos; começa desligado). Não usamos servidor de notificações push nem enviamos e-mails de marketing. Os únicos e-mails que você recebe são os da sua própria conta — o código de confirmação do cadastro e a recuperação de senha. Você controla cada tipo de lembrete nas preferências e pode desligar tudo nas configurações do sistema.

## 8. Por quanto tempo guardamos — e como excluir

- Guardamos seus dados enquanto sua conta existir.
- **Excluir a conta:** em **Minha Saúde → Excluir minha conta** (D-013). A exclusão apaga a conta e **todos** os registros, documentos e relatórios vinculados a ela, de forma irreversível. Links de QR ainda ativos deixam de funcionar.
- Os dados são apagados imediatamente do banco. Nosso operador de infraestrutura mantém cópias de segurança diárias por **7 dias**, para o caso de falha; essas cópias são sobrescritas nesse prazo, e depois disso não resta nenhum registro seu. Não guardamos cópias fora dele.
- Você também pode pedir a exclusão pelo e-mail da seção 1.

## 9. Seus direitos (art. 18 da LGPD)

Você pode, a qualquer momento: confirmar que tratamos seus dados; acessá-los (o relatório completo em PDF é uma forma de exportação); corrigi-los (editando no app); pedir anonimização, bloqueio ou eliminação; saber com quem compartilhamos; e revogar o consentimento. Pedidos pelo e-mail da seção 1 são respondidos em até 15 dias.

## 10. Segurança

Acesso por senha; regras de acesso por linha no banco (cada conta só enxerga o que é seu); arquivos em áreas privadas com links assinados e temporários; criptografia em trânsito e em repouso. Nenhum sistema é infalível: se identificarmos um incidente que possa causar risco a você, comunicaremos você e a ANPD conforme a lei.

## 11. Idade mínima

O NERO é destinado a pessoas com **18 anos ou mais**. Não coletamos intencionalmente dados de menores; se isso ocorrer, excluiremos ao tomar conhecimento.

## 12. Alterações

Se esta política mudar, a nova versão será publicada nesta mesma página com a data atualizada, e avisaremos no app quando a mudança for relevante.

## 13. Contato

nerosaude@gmail.com · [[URL pública desta política]]

---

### Referências
- Lei nº 13.709/2018 (LGPD), especialmente arts. 5º, 7º, 11, 18, 41 e 48.
- Especificação NERO §26 e §40 (ressalvas de não interpretação).
- Decisões D-007 (QR de 7 dias, revogável) e D-008 (bucket privado `laudos`) em `02-DECISOES.md`.
