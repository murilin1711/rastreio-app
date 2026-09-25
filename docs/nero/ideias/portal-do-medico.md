# Ideia: portal do médico no site

**Registrada em:** 24/09/2026 · **Status:** ideia, nada decidido. O Murilo disse "bem em breve".

## O que ele descreveu

O site deixa de ser só a política e passa a ter área logada **para o médico**:

1. O médico faz cadastro e entra na conta dele.
2. Informa o **CPF do paciente**.
3. **Cola o prontuário** da consulta (texto livre).
4. Salva, e o conteúdo vai **direto para a conta do paciente no app**, já distribuído nos lugares
   certos: a pressão medida no consultório em `medidas`, o plano em `planos`, os remédios em
   `medicacoes`, e assim por diante.

A promessa é forte: "vai ler e salvar nos lugares certos".

## Por que isso muda o produto

Hoje o NERO é alimentado **só pelo paciente** — está escrito assim na política de privacidade,
seção 3: *"Todos os dados abaixo são fornecidos por você, no app. Não coletamos dados de outras
fontes."* Um portal que escreve na conta do paciente quebra essa frase e obriga a reescrever a
política, o questionário de privacidade das lojas e a base legal do tratamento.

## As três perguntas que precisam de resposta antes de qualquer código

### 1. Como o paciente autoriza?

**Este é o ponto crítico.** Escrever no prontuário de alguém sabendo só o CPF não pode existir: o
CPF não é segredo, e qualquer pessoa com um deles escreveria na conta alheia. Dado de saúde é
**sensível** (LGPD art. 11) e exige consentimento específico e destacado, ou outra base legal
igualmente específica (tutela da saúde por profissional, art. 11, II, "f" — que tem requisitos
próprios).

Desenhos possíveis, do mais simples ao mais completo:

- **Código temporário**: o paciente abre o app, gera um código de 6 dígitos válido por minutos, e o
  médico digita. Mesmo mecanismo do QR de relatório que já existe (D-007), invertido.
- **Aprovação no app**: o médico envia, o paciente recebe um aviso e confirma antes de virar dado.
- **Vínculo duradouro**: o paciente autoriza aquele médico uma vez, e ele passa a poder escrever até
  o vínculo ser revogado. Mais cômodo, exige tela de gestão de vínculos.

### 2. Quem garante que o médico é médico?

CRM verificado? Autodeclarado? Sem verificação, o portal vira uma porta de escrita para qualquer um
que se cadastre.

### 3. Quem responde pelo que foi salvo errado?

Se a leitura automática do prontuário classificar mal um dado clínico, o dado errado vai para a conta
do paciente e para os relatórios que ele leva ao próximo médico. Quem revisa antes de virar verdade:
o médico que colou, o paciente que recebeu, ou ninguém?

## O que já existe no projeto e serve de base

- **Auth do Supabase** com confirmação por código de 6 dígitos (D-019), que dá o molde do fluxo de
  autorização por código.
- **RLS por dono** em todas as tabelas: hoje cada conta só enxerga o que é dela. Escrita por terceiro
  exige política nova, e é onde um erro vaza prontuário.
- **Compartilhamento por URL assinada e revogável** (D-007), que é o mesmo problema na direção
  oposta e já foi resolvido uma vez.

## O que isto significa para o site agora

O site deixa de ser uma página estática e passa a ser aplicação. Vale já tratá-lo como parte do
projeto — versionado aqui, com deploy reproduzível — em vez de arquivo subido à mão no painel.
