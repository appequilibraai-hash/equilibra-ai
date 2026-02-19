# 🚀 Guia Completo de Deploy - Equilibra AI no VPS

## ✅ Pré-requisitos
- VPS com Ubuntu 22.04 (Hostinger ou similar)
- Node.js 20+ instalado
- MySQL 8+ instalado
- PM2 instalado globalmente
- Nginx configurado
- Domínio appequilibraai.com.br apontando para seu VPS

---

## 📋 Passo 1: Preparar o Servidor

### 1.1 Conectar ao VPS via SSH
```bash
ssh root@seu_ip_do_vps
# ou
ssh seu_usuario@seu_ip_do_vps
```

### 1.2 Atualizar sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Verificar Node.js e npm
```bash
node --version  # Deve ser v20+
npm --version
```

Se não tiver Node.js 20, instale:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 1.4 Instalar pnpm (gerenciador de pacotes)
```bash
npm install -g pnpm
pnpm --version
```

### 1.5 Instalar PM2 (gerenciador de processos)
```bash
npm install -g pm2
pm2 --version
```

---

## 📂 Passo 2: Clonar Repositório

### 2.1 Criar diretório para aplicação
```bash
sudo mkdir -p /var/www/equilibra-ai
sudo chown $USER:$USER /var/www/equilibra-ai
cd /var/www/equilibra-ai
```

### 2.2 Clonar repositório GitHub
```bash
git clone https://github.com/appequilibraai-hash/equilibra-ai.git .
```

### 2.3 Instalar dependências
```bash
pnpm install
```

---

## 🗄️ Passo 3: Configurar Banco de Dados

### 3.1 Criar arquivo `.env` na raiz do projeto
```bash
nano /var/www/equilibra-ai/.env
```

### 3.2 Adicionar variáveis de ambiente
```env
# Database
DATABASE_URL="mysql://usuario:senha@localhost:3306/equilibra_ai"

# JWT Secret (gere uma string aleatória segura)
JWT_SECRET="sua_chave_secreta_muito_longa_e_aleatoria_aqui_12345678"

# Node Environment
NODE_ENV="production"

# App Configuration
VITE_APP_TITLE="Equilibra AI"
VITE_APP_ID="equilibra-ai"
```

**Para gerar JWT_SECRET seguro:**
```bash
openssl rand -base64 32
```

### 3.3 Criar banco de dados MySQL
```bash
mysql -u root -p
```

Dentro do MySQL:
```sql
CREATE DATABASE equilibra_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'equilibra_user'@'localhost' IDENTIFIED BY 'senha_super_segura';
GRANT ALL PRIVILEGES ON equilibra_ai.* TO 'equilibra_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3.4 Executar migrações do banco
```bash
cd /var/www/equilibra-ai
pnpm db:push
```

Isso criará todas as tabelas automaticamente.

---

## 🔧 Passo 4: Compilar Aplicação

### 4.1 Build do frontend (Vite)
```bash
cd /var/www/equilibra-ai
pnpm build
```

Isso gera arquivos otimizados em `dist/`.

---

## 🚀 Passo 5: Configurar PM2

### 5.1 Iniciar aplicação com PM2
```bash
cd /var/www/equilibra-ai
pm2 start npm --name "equilibra-ai" -- start
```

### 5.2 Salvar configuração PM2
```bash
pm2 save
pm2 startup
```

Copie e execute o comando que aparecer na tela.

### 5.3 Verificar status
```bash
pm2 status
pm2 logs equilibra-ai
```

---

## 🌐 Passo 6: Configurar Nginx

### 6.1 Criar arquivo de configuração Nginx
```bash
sudo nano /etc/nginx/sites-available/equilibra-ai
```

### 6.2 Adicionar configuração
```nginx
server {
    listen 80;
    server_name appequilibraai.com.br www.appequilibraai.com.br;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name appequilibraai.com.br www.appequilibraai.com.br;

    # SSL (use Certbot para gerar certificados)
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
```

### 6.3 Ativar site
```bash
sudo ln -s /etc/nginx/sites-available/equilibra-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Passo 7: Configurar SSL com Certbot

### 7.1 Instalar Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Gerar certificado SSL
```bash
sudo certbot certonly --nginx -d appequilibraai.com.br -d www.appequilibraai.com.br
```

### 7.3 Renovação automática
```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## 🧪 Passo 8: Testar Aplicação

### 8.1 Verificar se aplicação está rodando
```bash
curl http://localhost:3000
```

### 8.2 Acessar site
Abra no navegador: `https://appequilibraai.com.br`

### 8.3 Testar login
1. Clique em "Criar Conta"
2. Preencha email e senha
3. Clique em "Registrar"
4. Você deve ser redirecionado para o perfil

---

## 📊 Passo 9: Monitoramento

### 9.1 Ver logs em tempo real
```bash
pm2 logs equilibra-ai
```

### 9.2 Ver status da aplicação
```bash
pm2 status
pm2 monit
```

### 9.3 Reiniciar aplicação
```bash
pm2 restart equilibra-ai
```

### 9.4 Parar aplicação
```bash
pm2 stop equilibra-ai
```

---

## 🐛 Troubleshooting

### Problema: "Cannot find module"
**Solução:**
```bash
cd /var/www/equilibra-ai
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Problema: "Database connection error"
**Solução:**
1. Verificar `.env` tem `DATABASE_URL` correto
2. Testar conexão MySQL:
   ```bash
   mysql -u equilibra_user -p -h localhost equilibra_ai
   ```

### Problema: "Port 3000 already in use"
**Solução:**
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Problema: "Nginx 502 Bad Gateway"
**Solução:**
1. Verificar se Node.js está rodando: `pm2 status`
2. Ver logs: `pm2 logs equilibra-ai`
3. Reiniciar: `pm2 restart equilibra-ai`

---

## 📝 Variáveis de Ambiente Completas

Se precisar adicionar mais variáveis no futuro:

```env
# Database
DATABASE_URL="mysql://usuario:senha@localhost:3306/equilibra_ai"

# JWT Secret
JWT_SECRET="sua_chave_secreta_aqui"

# Node Environment
NODE_ENV="production"

# App Configuration
VITE_APP_TITLE="Equilibra AI"
VITE_APP_ID="equilibra-ai"
VITE_APP_LOGO="/logo.svg"

# Server Port (opcional, padrão 3000)
PORT=3000
```

---

## ✅ Checklist Final

- [ ] SSH conectado ao VPS
- [ ] Node.js 20+ instalado
- [ ] Repositório clonado
- [ ] `.env` configurado
- [ ] Banco de dados criado
- [ ] Migrações executadas (`pnpm db:push`)
- [ ] Build compilado (`pnpm build`)
- [ ] PM2 iniciado
- [ ] Nginx configurado
- [ ] SSL instalado
- [ ] Site acessível em https://appequilibraai.com.br
- [ ] Login funcionando

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas durante o deploy, verifique:
1. Logs da aplicação: `pm2 logs equilibra-ai`
2. Logs do Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Logs do MySQL: `sudo tail -f /var/log/mysql/error.log`

Boa sorte com seu deploy! 🎉
