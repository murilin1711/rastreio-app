# Checklist manual — Fase 0 (Fundação)

> Executado em: ____/____/2026 · Aparelho: __________________ · Executor: Murilo
> Servidor: Supabase local (`supabase start`) · Metro: `exp://192.168.18.78:8081`

## Entrada
- [ ] Instalação limpa: onboarding aparece (3 slides); "Pular" e "Começar" levam ao login
- [ ] Fechar e reabrir sem login: vai direto ao login (onboarding não repete)

## Cadastro e login
- [ ] Senha com menos de 8 caracteres → mensagem clara, sem travar
- [ ] E-mail inválido → mensagem clara
- [ ] Cadastro válido → entra direto no perfil inicial (passo 1)
- [ ] Sair → login com e-mail/senha errados → "E-mail ou senha incorretos."
- [ ] Login correto → Home com dados intactos

## Perfil inicial
- [ ] Data inválida (31/02/1990) não avança; data válida avança
- [ ] Sexo feminino mostra o passo do colo do útero; masculino não (5 passos)
- [ ] Tabagismo "Já fumei, mas parei" pede data de cessação
- [ ] "Pular" existe só nos passos de altura/peso, tabagismo e condições
- [ ] Concluir → Home; fechar e reabrir → Home direto (não volta ao perfil inicial)

## Home
- [ ] Saudação com o primeiro nome e período do dia correto
- [ ] Bloco "Hoje" lista pendências de perfil; tocar em uma navega para a tela certa
- [ ] Cards Coração & Metabolismo e Saúde & Bem-estar mostram "Em breve" e não reagem ao toque
- [ ] Card Rastreando abre a tela-ponte; card Minha Saúde abre a lista
- [ ] Puxar para baixo atualiza (indicador aparece e some)
- [ ] Abas: Início · Rastreando · Minha Saúde funcionam e mantêm o estado

## Minha Saúde
- [ ] Meu perfil: alterar altura → Salvar → voltar → reabrir: valor persistiu
- [ ] Meu perfil: idade calculada aparece ao lado da data; maços-ano aparece quando fumante
- [ ] Antecedentes: adicionar (escolher "Mãe" preenche grau "1º grau"), editar, remover com confirmação
- [ ] Medicamentos: "Losartana", "50 mg", horários "8, 20h30" → aparece "08h / 20h30"
- [ ] Medicamentos: pausar → vai para "Interrompidos"; reativar → volta
- [ ] Horário inválido ("25:00") → mensagem explicando o formato

## Robustez
- [ ] Modo avião → abrir Meu perfil → botão Salvar desabilitado com aviso; app não trava
- [ ] Segunda conta: criar outro usuário → Home/Perfil/Medicamentos não mostram nada da primeira conta

## Resultado
- [ ] Todos os itens acima passaram
- Observações / bugs encontrados:
  -
