# Equilibra AI - TODO

## Funcionalidades Principais

- [x] Sistema de autenticação de usuários com perfil pessoal
- [x] Interface de captura/upload de foto da refeição com preview
- [x] Análise nutricional por IA (visão computacional)
  - [x] Identificação de alimentos na foto
  - [x] Calorias totais estimadas
  - [x] Quantidade estimada de cada alimento
  - [x] Ingredientes e molhos detectados
  - [x] Macronutrientes (proteínas, carboidratos, gorduras)
  - [x] Micronutrientes relevantes
- [x] Dashboard com histórico de refeições
  - [x] Lista com fotos em miniatura
  - [x] Data/hora de cada refeição
  - [x] Resumo calórico
- [x] Gráficos de progresso
  - [x] Consumo calórico diário vs meta
  - [x] Distribuição de macronutrientes ao longo do tempo
- [x] Sistema de recomendações inteligentes para próxima refeição
  - [x] Baseado em calorias já consumidas no dia
  - [x] Baseado na meta calórica diária
  - [x] Baseado no balanço de macronutrientes
- [x] Página de configuração de perfil
  - [x] Definir meta calórica diária
  - [x] Preferências alimentares

## Design e UX

- [x] Design responsivo (mobile-first)
- [x] Paleta de cores verde/azul (inspirada no logo)
- [x] Tipografia limpa e moderna
- [x] Logo Equilibra AI integrado

## Backend

- [x] Schema do banco de dados (users, meals, userProfile)
- [x] Rotas tRPC para CRUD de refeições
- [x] Integração com LLM para análise de imagens
- [x] Sistema de upload de imagens para S3

## Melhorias

- [x] Melhorar logotipo com design mais moderno e profissional
- [x] Gerar imagens ilustrativas para o app (hero, features, etc)
- [x] Redesenhar landing page com visual mais moderno e atrativo
- [x] Adicionar ilustrações e elementos visuais às páginas internas
- [x] Melhorar animações e micro-interações

## Reestruturação Conforme Novas Instruções

### Navegação
- [x] Menu fixo com apenas 3 itens + Logo (Logo, Sobre, Analisar Refeição, Login)
- [x] Logo redireciona para página Analisar Refeição (Home)
- [x] Após login, "Login" vira "Meu Perfil"

### Página Analisar Refeição (Home)
- [x] Hero section limpa com foco na ação
- [x] Botão central grande "Fotografar Refeição" ou "Carregar da Galeria"
- [x] Após análise: botões "Guardar Refeição no Diário" e "Sugerir Próximo Prato"
- [x] Gatilho de login se usuário não estiver logado ao clicar nos botões

### Página Sobre
- [x] Landing page informativa
- [x] Explicar a IA e benefícios
- [x] Gráficos ilustrativos sobre saúde e tecnologia

### Login e Registro (Onboarding)
- [x] Formulário com Nome, Email, Senha, Nome de Usuário
- [x] Dados biométricos: Sexo, Data Nascimento, Altura, Peso Atual, Peso Desejado
- [x] Seletor visual de atividade física com cards (Futebol, Academia, Basquete, Dança, Corrida, Sedentário)

### Área Logada (Dashboard)
- [x] Aba Progresso: Gráfico de evolução do peso + Estimativa de peso futuro
- [x] Aba Dados: Calendário/Timeline com diário alimentar
- [x] Aba Recomendações: Nutricionista IA esportivo com sugestões
- [x] Aba Configurações: Edição de perfil, senha, metas, notificações

## Edições Visuais (Feedback do Usuário)

- [x] Adicionar logo correto na navegação (PublicLayout)
- [x] Adicionar logo correto no footer (PublicLayout)
- [x] Substituir imagem quebrada na AnalyzeMeal por ilustração de buffet self-service
- [x] Centralizar a área de upload/captura de foto na AnalyzeMeal

## Lógica de Seleção de Atividade

- [x] Sedentário exclui todas as outras opções quando selecionado
- [x] Permitir seleção de múltiplos esportes (exceto Sedentário)

## Edições Página Recomendações

- [x] Remover botão desnecessário na página de recomendações
- [x] Remover seção desnecessária na página de recomendações
- [x] Garantir que todos os ingredientes sejam sempre listados nas recomendações

## Refatoração Arquitetural v2

### Navegação
- [x] Remover aba "Dados" e fundir conteúdo na aba "Progresso"
- [x] Menu com apenas 3 abas: Progresso, Recomendações, Configurações

### Aba Progresso
- [x] Seletor de data (calendário/DatePicker) rotulado "Hoje"
- [x] Recarregar todos os dados ao mudar a data
- [x] Filtro/dropdown "Visualizar Nutrientes" para selecionar cards visíveis
- [x] Gráfico semanal com seletor de métrica no eixo Y
- [x] Seção "Meus Dados" - Extrato Nutricional completo (micro e macro)
- [x] Botão "Compartilhar Relatório" (texto formatado para WhatsApp/Email)

### Aba Recomendações
- [x] Ler estado atual da aba Progresso (dados do dia)
- [x] Sugestão de próxima refeição baseada no saldo calórico restante
- [x] Seção "Sugestão de Suplementação" para micronutrientes abaixo da meta

### Aba Configurações
- [x] Modo read-only por padrão com botão "Editar"
- [x] Toast ao salvar e trancar campos novamente
- [x] Sedentário oculta opções extras de frequência
- [x] Input numérico "Frequência semanal (dias)" para atividades não-sedentárias
- [x] Cálculo automático de metas (Harris-Benedict revisada)
- [x] Metas calculadas trancadas com botão "Personalizar Metas"
- [x] Blacklist de alimentos (restrições/alergias)

## Correções de Layout

- [x] Ingredientes não podem ultrapassar a borda - quebrar texto quando necessário
- [x] Extrato nutricional deve permitir selecionar data e compartilhar para outros apps
- [x] Remover botão desnecessário na aba Progresso (linha ~163)
- [x] Remover botão desnecessário na linha ~222 do ProfileSettings
- [x] Renomear blacklist para "Deseja evitar algum alimento?" com barra de adição e opção de remover
- [x] Remover seção desnecessária na linha ~536 do ProfileSettings
- [x] Frequência semanal individual para cada atividade selecionada
- [x] Macros interligados: ao definir 3, o 4o é calculado automaticamente (ou ajustado ao mais próximo)
- [x] Blacklist persistente: alimentos ficam guardados até o usuário remover manualmente

## Correções Pendentes

- [x] AnalyzeMeal: permitir captura de foto E upload de galeria
- [x] ProfileSettings: corrigir problema de edição dos campos
- [x] Consolidar botões "Tirar Foto" e "Galeria" em um único botão com dropdown/menu

## Implementações Avançadas

### Metas Nutricionais - Reatividade Matemática
- [x] Cenário A: Alterar Calorias Totais recalcula Proteína (30%), Carboidratos (40%), Gordura (30%)
- [x] Cenário B: Alterar um Macro mantém Calorias fixas e recalcula os outros dois proporcionalmente
- [x] Feedback visual: "Total dos macros" atualiza em tempo real (P*4 + C*4 + G*9)
- [x] Aviso visual em vermelho se soma de macros ultrapassar meta calórica
- [x] Testes unitários para reatividade de macros (10 testes passando)

### Blacklist - Integração com Recomendações
- [x] Blacklist funciona como filtro negativo obrigatório nas recomendações
- [x] IA lê a lista de alimentos bloqueados antes de gerar sugestões
- [x] Receitas com ingredientes da blacklist são descartadas e substituídas
- [x] Feedback visual: "Alimentos adicionados aqui ficam guardados permanentemente"
- [x] Testes unitários para filtragem de blacklist (17 testes passando)


## Proteção Contra Edições Acidentais - Metas Nutricionais

- [x] Implementar estado de bloqueio/desbloqueio para campos de macros
- [x] Campos desabilitados por padrão (somente leitura)
- [x] Botão "Editar" com ícone de lápis para ativar modo de edição
- [x] Botão muda para "Salvar" (verde) quando em modo de edição
- [x] Lógica matemática continua funcionando apenas em modo de edição
- [x] Testar proteção contra edições acidentais
- [x] Remover botão "Salvar Configurações" do final da página
- [x] Atualizar descrição da seção "Metas Nutricionais Diárias" para ser mais clara e intuitiva


## Expansão de Informações Pessoais

- [x] Adicionar campo Nome Completo
- [x] Adicionar campo Data de Nascimento
- [x] Adicionar campo Sexo Biológico (seletor)
- [x] Adicionar campo Objetivo Principal (seletor)
- [x] Implementar modo de edição/bloqueio para Informações Pessoais
- [x] Botão "Editar" com ícone de lápis
- [x] Botão muda para "Salvar" quando em modo de edição
- [x] Conexão inteligente com cálculo de metas nutricionais
- [x] Testar integração de dados com cálculo de metas
- [x] Remover opção "Registrar Peso" da seção de Dados Físicos
- [x] Renomear "Sexo Biológico" para "Sexo"
- [x] Bloquear campos físicos até clicar em "editar"


## Correção de Persistência de Dados

- [x] Atualizar schema do banco para incluir campos: fullName, dateOfBirth, biologicalSex, mainObjective
- [x] Atualizar mutation de salvamento de perfil para incluir novos campos
- [x] Atualizar query de carregamento de perfil para ler novos campos
- [x] Testar salvamento e carregamento dos novos campos


## Correção Crítica - Botão Calcular

- [x] Corrigir perda de dados pessoais ao clicar em "Calcular"
- [x] Impedir que "Atividade Física" mude para "Ciclismo" automaticamente
- [x] Implementar preservação de estado com prevState
- [x] Garantir que apenas macros sejam atualizados
- [x] Testar que nome, nascimento, sexo e objetivo não são alterados


## Persistência Real de Dados

- [x] Verificar que handleSave está enviando TODOS os campos para o banco
- [x] Adicionar feedback visual "Salvando..." durante a requisição
- [x] Adicionar feedback "Dados salvos com sucesso!" após sucesso
- [x] Garantir que useEffect carrega dados ao montar a página
- [x] Remover refetch() que causava sobrescrita de dados
- [x] Testar que dados persistem após atualizar a página


## Prompt Avançado de Análise Nutricional

- [x] Integrar prompt avançado com estimativa volumétrica e de densidade
- [x] Atualizar frontend para exibir novos campos (volume, densidade, confiança, dica de feedback)

## Deploy no VPS - Correções OAuth

- [x] Remover completamente Manus OAuth do código
- [x] Corrigir rota /api/oauth/callback para redirecionar para login
- [x] Testar site no VPS appequilibraai.com.br

## Sistema de Recuperação de Senha

- [ ] Adicionar campo password_reset_token na tabela users
- [ ] Adicionar campo password_reset_expires na tabela users
- [ ] Criar rota tRPC para solicitar reset de senha (enviar email)
- [ ] Criar rota tRPC para validar token de reset
- [ ] Criar rota tRPC para atualizar senha com token válido
- [ ] Criar página de "Esqueci Minha Senha" (formulário com email)
- [ ] Criar página de "Redefinir Senha" (com token na URL)
- [ ] Integrar links de email com token
- [ ] Testar fluxo completo de reset de senha

## Sistema de Recuperação de Senha - CONCLUÍDO

- [x] Adicionar campo password_reset_token na tabela users
- [x] Adicionar campo password_reset_expires na tabela users
- [x] Criar rota tRPC para solicitar reset de senha (enviar email)
- [x] Criar rota tRPC para validar token de reset
- [x] Criar rota tRPC para atualizar senha com token válido
- [x] Criar página de "Esqueci Minha Senha" (formulário com email)
- [x] Criar página de "Redefinir Senha" (com token na URL)
- [x] Integrar links de email com token
- [x] Adicionar link "Esqueci Minha Senha" na página de Login

## Tradução e Email Verification

- [x] Traduzir página de Login para Português do Brasil
- [x] Traduzir página de Signup para Português do Brasil
- [x] Atualizar schema do banco de dados para email verification
- [x] Implementar lógica de verificação de email no backend
- [x] Criar página de confirmação de email no frontend
- [x] Testar fluxo completo de email verification (7 testes passando)
- [ ] Fazer deploy no VPS

## Confirmação de Senha no Registro

- [x] Adicionar campo "Confirmar Senha" no formulário de registro
- [x] Validar que as duas senhas coincidem
- [x] Mostrar mensagem de erro se senhas não coincidem
- [x] Validar comprimento mínimo de 6 caracteres
