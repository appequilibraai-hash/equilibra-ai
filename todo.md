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
