#!/bin/bash

# 🚀 Script de Setup Automático Completo - Equilibra AI
# Execute com: bash setup-vps.sh
# Este script configura TUDO: Node.js, MySQL, PM2, Nginx, SSL

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    print_error "Este script deve ser executado como root (use: sudo bash setup-vps.sh)"
    exit 1
fi

print_header "🚀 Equilibra AI - Setup Automático Completo"

# ============================================
# PASSO 1: Atualizar Sistema
# ============================================
print_header "PASSO 1: Atualizando Sistema"

apt update && apt upgrade -y
print_status "Sistema atualizado"

# ============================================
# PASSO 2: Instalar Node.js 20
# ============================================
print_header "PASSO 2: Instalando Node.js 20"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_warning "Node.js já instalado: $NODE_VERSION"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    print_status "Node.js 20 instalado"
fi

# ============================================
# PASSO 3: Instalar pnpm
# ============================================
print_header "PASSO 3: Instalando pnpm"

npm install -g pnpm
print_status "pnpm instalado"

# ============================================
# PASSO 4: Instalar PM2
# ============================================
print_header "PASSO 4: Instalando PM2"

npm install -g pm2
pm2 startup
pm2 save
print_status "PM2 instalado e configurado"

# ============================================
# PASSO 5: Instalar MySQL 8
# ============================================
print_header "PASSO 5: Instalando MySQL 8"

if command -v mysql &> /dev/null; then
    print_warning "MySQL já instalado"
else
    apt install -y mysql-server
    print_status "MySQL 8 instalado"
fi

# ============================================
# PASSO 6: Instalar Nginx
# ============================================
print_header "PASSO 6: Instalando Nginx"

if command -v nginx &> /dev/null; then
    print_warning "Nginx já instalado"
else
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    print_status "Nginx instalado e iniciado"
fi

# ============================================
# PASSO 7: Instalar Certbot (SSL)
# ============================================
print_header "PASSO 7: Instalando Certbot"

apt install -y certbot python3-certbot-nginx
print_status "Certbot instalado"

# ============================================
# PASSO 8: Instalar Git
# ============================================
print_header "PASSO 8: Verificando Git"

if command -v git &> /dev/null; then
    print_status "Git já instalado"
else
    apt install -y git
    print_status "Git instalado"
fi

# ============================================
# PASSO 9: Criar Diretório da Aplicação
# ============================================
print_header "PASSO 9: Criando Diretório da Aplicação"

mkdir -p /var/www/equilibra-ai
cd /var/www/equilibra-ai
print_status "Diretório criado: /var/www/equilibra-ai"

# ============================================
# PASSO 10: Clonar Repositório
# ============================================
print_header "PASSO 10: Clonando Repositório"

if [ -d ".git" ]; then
    print_warning "Repositório já existe, fazendo pull..."
    git pull origin main
else
    git clone https://github.com/appequilibraai-hash/equilibra-ai.git .
fi
print_status "Repositório clonado"

# ============================================
# PASSO 11: Instalar Dependências
# ============================================
print_header "PASSO 11: Instalando Dependências"

pnpm install
print_status "Dependências instaladas"

# ============================================
# PASSO 12: Configurar Banco de Dados
# ============================================
print_header "PASSO 12: Configurando Banco de Dados"

print_info "Criando banco de dados e usuário MySQL..."

# Gerar senha aleatória
DB_PASSWORD=$(openssl rand -base64 16)
JWT_SECRET=$(openssl rand -base64 32)

# Criar banco e usuário
mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS equilibra_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'equilibra_user'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON equilibra_ai.* TO 'equilibra_user'@'localhost';
FLUSH PRIVILEGES;
EOF

print_status "Banco de dados criado"

# ============================================
# PASSO 13: Criar Arquivo .env
# ============================================
print_header "PASSO 13: Criando Arquivo .env"

cat > /var/www/equilibra-ai/.env <<EOF
# Database
DATABASE_URL="mysql://equilibra_user:$DB_PASSWORD@localhost:3306/equilibra_ai"

# JWT Secret
JWT_SECRET="$JWT_SECRET"

# Node Environment
NODE_ENV="production"

# App Configuration
VITE_APP_TITLE="Equilibra AI"
VITE_APP_ID="equilibra-ai"
VITE_APP_LOGO="/logo.svg"

# Server Port
PORT=3000
EOF

print_status "Arquivo .env criado"
print_info "Credenciais do banco:"
print_info "  Usuário: equilibra_user"
print_info "  Senha: $DB_PASSWORD"
print_info "  Database: equilibra_ai"

# ============================================
# PASSO 14: Executar Migrações
# ============================================
print_header "PASSO 14: Executando Migrações do Banco"

cd /var/www/equilibra-ai
pnpm db:push
print_status "Migrações executadas"

# ============================================
# PASSO 15: Build da Aplicação
# ============================================
print_header "PASSO 15: Compilando Aplicação"

pnpm build
print_status "Aplicação compilada"

# ============================================
# PASSO 16: Configurar PM2
# ============================================
print_header "PASSO 16: Configurando PM2"

pm2 start npm --name "equilibra-ai" -- start
pm2 save
print_status "Aplicação iniciada com PM2"

# ============================================
# PASSO 17: Configurar Nginx
# ============================================
print_header "PASSO 17: Configurando Nginx"

cat > /etc/nginx/sites-available/equilibra-ai <<'EOF'
server {
    listen 80;
    server_name appequilibraai.com.br www.appequilibraai.com.br;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name appequilibraai.com.br www.appequilibraai.com.br;

    # SSL (será configurado pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/appequilibraai.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appequilibraai.com.br/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy para Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/equilibra-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t
systemctl restart nginx

print_status "Nginx configurado"

# ============================================
# PASSO 18: Configurar SSL com Certbot
# ============================================
print_header "PASSO 18: Configurando SSL com Certbot"

print_warning "Você precisa ter seu domínio (appequilibraai.com.br) apontando para este IP"
print_info "Pressione ENTER para continuar com a configuração de SSL..."
read

certbot certonly --nginx -d appequilibraai.com.br -d www.appequilibraai.com.br

# Renovação automática
systemctl enable certbot.timer
systemctl start certbot.timer

print_status "SSL configurado com sucesso"

# ============================================
# PASSO 19: Configurar Firewall
# ============================================
print_header "PASSO 19: Configurando Firewall (UFW)"

ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3306/tcp

print_status "Firewall configurado"

# ============================================
# PASSO 20: Verificação Final
# ============================================
print_header "PASSO 20: Verificação Final"

print_info "Status da Aplicação:"
pm2 status

print_info "Status do Nginx:"
systemctl status nginx --no-pager

print_info "Status do MySQL:"
systemctl status mysql --no-pager

# ============================================
# CONCLUSÃO
# ============================================
print_header "✅ Setup Completo!"

echo -e "${GREEN}Parabéns! Seu servidor está configurado!${NC}\n"

echo -e "${BLUE}📋 Informações Importantes:${NC}"
echo -e "  Domínio: https://appequilibraai.com.br"
echo -e "  Aplicação: /var/www/equilibra-ai"
echo -e "  Banco de Dados: equilibra_ai"
echo -e "  Usuário DB: equilibra_user"
echo -e "  Senha DB: $DB_PASSWORD"
echo -e "  JWT Secret: $JWT_SECRET"

echo -e "\n${BLUE}📊 Comandos Úteis:${NC}"
echo -e "  Ver logs: ${YELLOW}pm2 logs equilibra-ai${NC}"
echo -e "  Reiniciar app: ${YELLOW}pm2 restart equilibra-ai${NC}"
echo -e "  Ver status: ${YELLOW}pm2 status${NC}"
echo -e "  Parar app: ${YELLOW}pm2 stop equilibra-ai${NC}"
echo -e "  Atualizar código: ${YELLOW}cd /var/www/equilibra-ai && git pull && pnpm install && pnpm db:push && pnpm build && pm2 restart equilibra-ai${NC}"

echo -e "\n${BLUE}🔐 Segurança:${NC}"
echo -e "  ${YELLOW}⚠️  Salve as credenciais do banco em um local seguro!${NC}"
echo -e "  ${YELLOW}⚠️  Altere a senha do MySQL root se não tiver feito${NC}"
echo -e "  ${YELLOW}⚠️  Configure backups automáticos do banco${NC}"

echo -e "\n${GREEN}Seu site estará disponível em alguns minutos em:${NC}"
echo -e "  ${BLUE}https://appequilibraai.com.br${NC}\n"
