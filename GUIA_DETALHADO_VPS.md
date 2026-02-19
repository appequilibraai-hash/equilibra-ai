# 📖 Guia Detalhado - Deploy Equilibra AI no VPS (Passo-a-Passo)

## 🎯 Objetivo Final
Fazer seu site funcionar em **https://appequilibraai.com.br** usando seu VPS próprio

---

## 📋 O Que Você Precisa Ter

1. **Um VPS** (Hostinger, DigitalOcean, AWS, etc.) com:
   - Ubuntu 22.04
   - Acesso SSH (você recebeu IP e senha)
   
2. **Um Domínio** (appequilibraai.com.br) que já aponta para o IP do VPS

3. **GitHub** - Seu código está aqui: https://github.com/appequilibraai-hash/equilibra-ai

---

## 🚀 PASSO 1: Conectar ao VPS via SSH

### O que é SSH?
SSH é uma forma segura de acessar seu servidor remotamente. É como abrir um terminal do seu computador, mas dentro do servidor.

### Como fazer:

**No seu computador (Windows, Mac ou Linux), abra o terminal/PowerShell e execute:**

```bash
ssh root@SEU_IP_DO_VPS
```

**Substitua `SEU_IP_DO_VPS` pelo IP que você recebeu. Exemplo:**

```bash
ssh root@192.168.1.100
```

**Vai pedir senha. Digite a senha que você recebeu.**

Se funcionar, você verá algo assim:
```
root@seu-vps:~#
```

✅ **Pronto! Você está dentro do VPS!**

---

## 📥 PASSO 2: Preparar o VPS (Instalar Ferramentas Necessárias)

Agora você vai copiar e colar estes comandos **um por um** no terminal do VPS.

### 2.1 Atualizar o sistema

```bash
apt update && apt upgrade -y
```

Vai levar alguns minutos. Espere terminar.

### 2.2 Instalar Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
```

Verifique se funcionou:
```bash
node --version
npm --version
```

Deve mostrar versões (ex: v20.10.0).

### 2.3 Instalar pnpm (gerenciador de pacotes)

```bash
npm install -g pnpm
pnpm --version
```

### 2.4 Instalar PM2 (para manter app rodando)

```bash
npm install -g pm2
pm2 --version
```

### 2.5 Instalar MySQL 8

```bash
apt install -y mysql-server
```

Verifique:
```bash
mysql --version
```

### 2.6 Instalar Nginx (servidor web)

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 2.7 Instalar Certbot (para SSL/HTTPS)

```bash
apt install -y certbot python3-certbot-nginx
```

### 2.8 Instalar Git

```bash
apt install -y git
git --version
```

✅ **Todas as ferramentas instaladas!**

---

## 📂 PASSO 3: Clonar o Repositório do GitHub

Agora você vai trazer o código do seu projeto para o VPS.

### 3.1 Criar pasta para a aplicação

```bash
mkdir -p /var/www/equilibra-ai
cd /var/www/equilibra-ai
```

### 3.2 Clonar o repositório

```bash
git clone https://github.com/appequilibraai-hash/equilibra-ai.git .
```

**O ponto (`.`) no final é importante!** Significa "clonar aqui nesta pasta".

Vai baixar todos os arquivos do GitHub. Espere terminar.

### 3.3 Verificar se funcionou

```bash
ls -la
```

Deve mostrar muitos arquivos e pastas (client, server, drizzle, etc).

✅ **Código do GitHub está no VPS!**

---

## 🗄️ PASSO 4: Configurar Banco de Dados MySQL

### 4.1 Criar banco de dados

```bash
mysql -u root <<EOF
CREATE DATABASE equilibra_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'equilibra_user'@'localhost' IDENTIFIED BY 'senha123456';
GRANT ALL PRIVILEGES ON equilibra_ai.* TO 'equilibra_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF
```

**Nota:** Você pode trocar `'senha123456'` por uma senha mais segura.

### 4.2 Verificar se funcionou

```bash
mysql -u equilibra_user -p -h localhost equilibra_ai
```

Vai pedir a senha que você colocou. Digite.

Se entrar no MySQL (prompt muda para `mysql>`), funcionou!

Saia digitando:
```bash
EXIT;
```

✅ **Banco de dados criado!**

---

## ⚙️ PASSO 5: Criar Arquivo .env (Configurações)

O arquivo `.env` contém as configurações secretas da aplicação.

### 5.1 Criar o arquivo

```bash
cd /var/www/equilibra-ai
nano .env
```

Vai abrir um editor de texto. **Cole isto:**

```
DATABASE_URL="mysql://equilibra_user:senha123456@localhost:3306/equilibra_ai"
JWT_SECRET="sua_chave_secreta_super_longa_e_aleatoria_aqui_12345678"
NODE_ENV="production"
VITE_APP_TITLE="Equilibra AI"
VITE_APP_ID="equilibra-ai"
VITE_APP_LOGO="/logo.svg"
PORT=3000
```

**Importante:** Substitua `senha123456` pela senha que você usou no passo 4.1.

### 5.2 Salvar o arquivo

Pressione: `CTRL + X` → `Y` → `ENTER`

✅ **Arquivo .env criado!**

---

## 📦 PASSO 6: Instalar Dependências e Configurar Banco

### 6.1 Instalar dependências do projeto

```bash
cd /var/www/equilibra-ai
pnpm install
```

Vai levar alguns minutos. Espere terminar.

### 6.2 Executar migrações (criar tabelas no banco)

```bash
pnpm db:push
```

Vai criar todas as tabelas automaticamente.

### 6.3 Compilar a aplicação

```bash
pnpm build
```

Vai gerar arquivos otimizados. Espere terminar.

✅ **Aplicação pronta!**

---

## 🚀 PASSO 7: Iniciar Aplicação com PM2

PM2 é um programa que mantém sua aplicação rodando 24/7.

### 7.1 Iniciar a aplicação

```bash
cd /var/www/equilibra-ai
pm2 start npm --name "equilibra-ai" -- start
```

### 7.2 Salvar configuração PM2

```bash
pm2 save
pm2 startup
```

Vai mostrar um comando. **Copie e execute esse comando.**

### 7.3 Verificar se está rodando

```bash
pm2 status
```

Deve mostrar `equilibra-ai` com status `online`.

### 7.4 Ver logs (se houver erro)

```bash
pm2 logs equilibra-ai
```

✅ **Aplicação rodando!**

---

## 🌐 PASSO 8: Configurar Nginx (Servidor Web)

Nginx é o servidor que recebe requisições do navegador e passa para sua aplicação.

### 8.1 Criar arquivo de configuração

```bash
nano /etc/nginx/sites-available/equilibra-ai
```

**Cole isto:**

```nginx
server {
    listen 80;
    server_name appequilibraai.com.br www.appequilibraai.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name appequilibraai.com.br www.appequilibraai.com.br;

    ssl_certificate /etc/letsencrypt/live/appequilibraai.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appequilibraai.com.br/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

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

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Salve:** `CTRL + X` → `Y` → `ENTER`

### 8.2 Ativar o site

```bash
ln -sf /etc/nginx/sites-available/equilibra-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
```

### 8.3 Testar configuração

```bash
nginx -t
```

Deve mostrar: `test is successful`

### 8.4 Reiniciar Nginx

```bash
systemctl restart nginx
```

✅ **Nginx configurado!**

---

## 🔒 PASSO 9: Configurar SSL (HTTPS)

SSL faz seu site usar `https://` em vez de `http://`.

### 9.1 Gerar certificado SSL

```bash
certbot certonly --nginx -d appequilibraai.com.br -d www.appequilibraai.com.br
```

Vai fazer perguntas:
- Email: digite seu email
- Concorda com termos: digite `y`
- Compartilhar email: digite `n` (opcional)

Se funcionar, mostra: `Successfully received certificate`

### 9.2 Ativar renovação automática

```bash
systemctl enable certbot.timer
systemctl start certbot.timer
```

✅ **SSL configurado!**

---

## 🧪 PASSO 10: Testar o Site

### 10.1 Verificar se tudo está rodando

```bash
# Ver status da aplicação
pm2 status

# Ver status do Nginx
systemctl status nginx

# Ver status do MySQL
systemctl status mysql
```

Todos devem estar `active (running)`.

### 10.2 Acessar o site

Abra seu navegador e vá para:

```
https://appequilibraai.com.br
```

Se funcionar, você verá a página inicial do Equilibra AI!

### 10.3 Testar login

1. Clique em "Criar Conta"
2. Preencha email e senha
3. Clique em "Registrar"
4. Você deve ser redirecionado para o perfil

✅ **Site funcionando!**

---

## 📊 PASSO 11: Monitorar e Manter

### Ver logs em tempo real

```bash
pm2 logs equilibra-ai
```

### Reiniciar aplicação

```bash
pm2 restart equilibra-ai
```

### Parar aplicação

```bash
pm2 stop equilibra-ai
```

### Iniciar aplicação

```bash
pm2 start equilibra-ai
```

### Atualizar código do GitHub

```bash
cd /var/www/equilibra-ai
git pull origin main
pnpm install
pnpm db:push
pnpm build
pm2 restart equilibra-ai
```

---

## 🐛 Troubleshooting (Se Algo Não Funcionar)

### Problema: Site mostra "502 Bad Gateway"

**Solução:**
```bash
pm2 logs equilibra-ai
pm2 restart equilibra-ai
```

### Problema: "Connection refused" ao acessar site

**Solução:**
```bash
# Verificar se aplicação está rodando
pm2 status

# Se não estiver, iniciar
pm2 start equilibra-ai

# Ver logs de erro
pm2 logs equilibra-ai
```

### Problema: Erro de conexão com banco de dados

**Solução:**
```bash
# Verificar arquivo .env
cat /var/www/equilibra-ai/.env

# Testar conexão MySQL
mysql -u equilibra_user -p -h localhost equilibra_ai
```

### Problema: Nginx não inicia

**Solução:**
```bash
# Testar configuração
nginx -t

# Ver erro
systemctl status nginx

# Reiniciar
systemctl restart nginx
```

### Problema: SSL não funciona

**Solução:**
```bash
# Verificar certificado
certbot certificates

# Renovar manualmente
certbot renew

# Reiniciar Nginx
systemctl restart nginx
```

---

## ✅ Checklist Final

- [ ] SSH conectado ao VPS
- [ ] Node.js 20+ instalado
- [ ] pnpm instalado
- [ ] PM2 instalado
- [ ] MySQL instalado
- [ ] Nginx instalado
- [ ] Certbot instalado
- [ ] Repositório clonado do GitHub
- [ ] Banco de dados criado
- [ ] Arquivo .env criado
- [ ] Dependências instaladas (`pnpm install`)
- [ ] Migrações executadas (`pnpm db:push`)
- [ ] Aplicação compilada (`pnpm build`)
- [ ] PM2 iniciado
- [ ] Nginx configurado
- [ ] SSL configurado
- [ ] Site acessível em https://appequilibraai.com.br
- [ ] Login funcionando

---

## 🎉 Parabéns!

Seu site está online e funcionando! 

**URL:** https://appequilibraai.com.br

Se precisar de ajuda, verifique os logs:
```bash
pm2 logs equilibra-ai
```

Boa sorte! 🚀
