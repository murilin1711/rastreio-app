# Checklist — preparação para publicação (D-012, D-013)

> Rodar no aparelho depois do `db push` da migração 0014. Marcar e anotar o que quebrou.

## Notificações (canal Android)
- [ ] Android: ao abrir o app pela primeira vez após atualizar, em Configurações → Apps → NERO → Notificações aparece o canal "Lembretes".
- [ ] Agendar um lembrete de medida para daqui a 2 minutos e deixar o app **aberto**: a notificação aparece como banner.
- [ ] Mesmo teste com o app **fechado**: a notificação aparece.

## Exclusão de conta
- [ ] Criar uma conta de teste, anexar 1 documento e gerar 1 relatório com QR.
- [ ] Minha Saúde → "Excluir minha conta": o botão só habilita depois de digitar EXCLUIR.
- [ ] Confirmar: volta para a tela de login.
- [ ] Tentar entrar com o mesmo e-mail/senha: "credenciais inválidas".
- [ ] No dashboard do Supabase: Storage → `laudos` e `relatorios` sem a pasta do usuário; Authentication sem o usuário.
- [ ] Abrir o link do QR gerado antes: não abre mais.
- [ ] Em modo avião, o botão fica desabilitado com a mensagem de sem conexão.

## Permissões (textos em português)
- [ ] iOS: ao anexar por câmera e por galeria, o pedido de permissão mostra o texto do NERO (não o padrão em inglês).
- [ ] Android: não aparece pedido de microfone em nenhum fluxo.
