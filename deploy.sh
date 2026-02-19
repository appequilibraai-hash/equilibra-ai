#!/bin/bash

# 🚀 Script de Deploy Automatizado - Equilibra AI
# Execute com: bash deploy.sh

set -e

echo "================================"
echo "🚀 Equilibra AI - Deploy Script"
echo "================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    print_error "package.json não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    print_error ".env não encontrado!"
    print_warning "Crie o arquivo .env com as variáveis de ambiente necessárias."
    exit 1
fi

print_status "Iniciando deploy..."

# 1. Atualizar repositório
echo ""
echo "📥 Atualizando repositório..."
git pull origin main || print_warning "Não foi possível fazer git pull"

# 2. Instalar dependências
echo ""
echo "📦 Instalando dependências..."
pnpm install

# 3. Executar migrações
echo ""
echo "🗄️  Executando migrações do banco..."
pnpm db:push

# 4. Build
echo ""
echo "🔨 Compilando aplicação..."
pnpm build

# 5. Parar aplicação anterior (se existir)
echo ""
echo "🛑 Parando aplicação anterior..."
pm2 stop equilibra-ai 2>/dev/null || print_warning "Aplicação não estava rodando"

# 6. Iniciar com PM2
echo ""
echo "🚀 Iniciando aplicação com PM2..."
pm2 start npm --name "equilibra-ai" -- start --update-env || pm2 restart equilibra-ai

# 7. Salvar configuração PM2
pm2 save

print_status "Deploy concluído com sucesso!"
echo ""
echo "📊 Status da aplicação:"
pm2 status

echo ""
echo "📋 Logs da aplicação:"
pm2 logs equilibra-ai --lines 10

echo ""
print_status "Aplicação disponível em: https://appequilibraai.com.br"
