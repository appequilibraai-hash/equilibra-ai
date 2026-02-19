# 🎬 Tutorial Visual - Deploy Equilibra AI (Passo-a-Passo com Screenshots em Texto)

## 📺 Como Usar Este Tutorial

Este tutorial mostra **exatamente** o que você vai ver na tela e o que digitar. 

Cada seção tem:
- ✏️ **O que digitar** (copie e cole)
- 📺 **O que você vai ver** (resposta esperada)
- ✅ **Como saber se funcionou**

---

## 🔌 PASSO 1: Conectar ao VPS

### Abra o Terminal/PowerShell no seu computador

**Windows:**
- Pressione `Windows + R`
- Digite `powershell`
- Pressione Enter

**Mac/Linux:**
- Abra o Terminal (Cmd + Espaço, digite "Terminal")

### Você vai ver algo assim:

```
C:\Users\seu_usuario>
```

ou

```
seu-computador:~ seu_usuario$
```

### ✏️ Digite isto:

```bash
ssh root@SEU_IP_DO_VPS
```

**Exemplo (substitua pelo seu IP):**

```bash
ssh root@192.168.1.100
```

### 📺 Você vai ver:

```
The authenticity of host '192.168.1.100 (192.168.1.100)' can't be established.
ECDSA key fingerprint is SHA256:xxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

### ✏️ Digite:

```
yes
```

### 📺 Você vai ver:

```
root@192.168.1.100's password:
```

### ✏️ Digite sua senha (não vai aparecer na tela):

```
(sua_senha_aqui)
```

### 📺 Você vai ver:

```
Welcome to Ubuntu 22.04.1 LTS (GNU/Linux 5.15.0-56-generic x86_64)

Last login: Mon Jan 15 10:30:45 2024 from 192.168.1.50
root@seu-vps:~#
```

✅ **Pronto! Você está dentro do VPS!**

---

## 📥 PASSO 2: Instalar Node.js 20

### ✏️ Digite isto:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

### 📺 Você vai ver muitas linhas. Espere terminar. Vai aparecer:

```
## Installing the NodeSource Node.js 20.x repo...
```

### ✏️ Depois digite:

```bash
apt install -y nodejs
```

### 📺 Você vai ver:

```
Reading package lists... Done
Building dependency tree... Done
Setting up nodejs (20.10.0-1nodesource1) ...
Processing triggers for man-db (2.10.2-1) ...
```

### ✏️ Verifique se funcionou:

```bash
node --version
```

### 📺 Você vai ver:

```
v20.10.0
```

✅ **Node.js instalado!**

---

## 📦 PASSO 3: Instalar pnpm

### ✏️ Digite isto:

```bash
npm install -g pnpm
```

### 📺 Você vai ver:

```
added 163 packages in 5s
```

### ✏️ Verifique:

```bash
pnpm --version
```

### 📺 Você vai ver:

```
8.15.4
```

✅ **pnpm instalado!**

---

## 🔄 PASSO 4: Instalar PM2

### ✏️ Digite isto:

```bash
npm install -g pm2
```

### 📺 Você vai ver:

```
added 45 packages in 3s
```

### ✏️ Verifique:

```bash
pm2 --version
```

### 📺 Você vai ver:

```
5.3.0
```

✅ **PM2 instalado!**

---

## 🗄️ PASSO 5: Instalar MySQL 8

### ✏️ Digite isto:

```bash
apt install -y mysql-server
```

### 📺 Você vai ver (leva alguns minutos):

```
Reading package lists... Done
Setting up mysql-server (8.0.32-0ubuntu0.22.04.1) ...
```

### ✏️ Verifique:

```bash
mysql --version
```

### 📺 Você vai ver:

```
mysql  Ver 8.0.32-0ubuntu0.22.04.1 for Linux on x86_64
```

✅ **MySQL instalado!**

---

## 🌐 PASSO 6: Instalar Nginx

### ✏️ Digite isto:

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 📺 Você vai ver:

```
Setting up nginx (1.18.0-6ubuntu14.3) ...
```

✅ **Nginx instalado!**

---

## 🔒 PASSO 7: Instalar Certbot (SSL)

### ✏️ Digite isto:

```bash
apt install -y certbot python3-certbot-nginx
```

### 📺 Você vai ver:

```
Setting up certbot (1.21.0-1~ubuntu0.22.04.1) ...
```

✅ **Certbot instalado!**

---

## 📂 PASSO 8: Clonar Código do GitHub

### ✏️ Criar pasta:

```bash
mkdir -p /var/www/equilibra-ai
cd /var/www/equilibra-ai
```

### 📺 Você vai ver:

```
root@seu-vps:/var/www/equilibra-ai#
```

### ✏️ Clonar repositório:

```bash
git clone https://github.com/appequilibraai-hash/equilibra-ai.git .
```

### 📺 Você vai ver:

```
Cloning into '.'...
remote: Enumerating objects: 250, done.
remote: Counting objects: 100% (250/250), done.
remote: Compressing objects: 100% (200/200), done.
remote: Receiving objects: 100% (250/250), 5.50 MiB | 2.50 MiB/s
Unpacking objects: 100% (250/250), done.
```

### ✏️ Verifique:

```bash
ls -la
```

### 📺 Você vai ver:

```
total 500
drwxr-xr-x 10 root root  4096 Jan 15 10:45 .
drwxr-xr-x  3 root root  4096 Jan 15 10:40 ..
-rw-r--r--  1 root root   150 Jan 15 10:45 .env.example
-rw-r--r--  1 root root  1234 Jan 15 10:45 .gitignore
drwxr-xr-x  2 root root  4096 Jan 15 10:45 client
drwxr-xr-x  2 root root  4096 Jan 15 10:45 server
drwxr-xr-x  2 root root  4096 Jan 15 10:45 drizzle
-rw-r--r--  1 root root  2000 Jan 15 10:45 package.json
```

✅ **Código clonado do GitHub!**

---

## 🗄️ PASSO 9: Criar Banco de Dados

### ✏️ Digite isto:

```bash
mysql -u root <<EOF
CREATE DATABASE equilibra_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'equilibra_user'@'localhost' IDENTIFIED BY 'senha123456';
GRANT ALL PRIVILEGES ON equilibra_ai.* TO 'equilibra_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF
```

### 📺 Você vai ver:

```
Query OK, 1 row affected (0.01 sec)
Query OK, 0 rows affected (0.01 sec)
Query OK, 0 rows affected (0.00 sec)
Query OK, 0 rows affected (0.00 sec)
```

### ✏️ Verifique:

```bash
mysql -u equilibra_user -p -h localhost equilibra_ai
```

### 📺 Você vai ver:

```
Enter password:
```

### ✏️ Digite a senha:

```
senha123456
```

### 📺 Você vai ver:

```
Welcome to the MySQL monitor.  Commands end with ; or \g.
mysql>
```

### ✏️ Saia:

```bash
EXIT;
```

✅ **Banco de dados criado!**

---

## ⚙️ PASSO 10: Criar Arquivo .env

### ✏️ Digite isto:

```bash
cd /var/www/equilibra-ai
nano .env
```

### 📺 Você vai ver um editor de texto vazio

### ✏️ Cole isto (clique direito e colar):

```
DATABASE_URL="mysql://equilibra_user:senha123456@localhost:3306/equilibra_ai"
JWT_SECRET="sua_chave_secreta_super_longa_e_aleatoria_aqui_12345678"
NODE_ENV="production"
VITE_APP_TITLE="Equilibra AI"
VITE_APP_ID="equilibra-ai"
VITE_APP_LOGO="/logo.svg"
PORT=3000
```

### 📺 Você vai ver o texto na tela

### ✏️ Salve:

```
CTRL + X
```

### 📺 Você vai ver:

```
Save modified buffer (ANSWERING "No" WILL DESTROY CHANGES) ?
```

### ✏️ Digite:

```
y
```

### 📺 Você vai ver:

```
File Name to Write: .env
```

### ✏️ Pressione:

```
ENTER
```

### 📺 Você volta ao prompt:

```
root@seu-vps:/var/www/equilibra-ai#
```

✅ **Arquivo .env criado!**

---

## 📦 PASSO 11: Instalar Dependências

### ✏️ Digite isto:

```bash
cd /var/www/equilibra-ai
pnpm install
```

### 📺 Você vai ver (leva 2-3 minutos):

```
Packages: +450
+++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 450, reused 400, downloaded 50, added 450
```

### 📺 Quando terminar:

```
Done in 2.5s
```

✅ **Dependências instaladas!**

---

## 🗄️ PASSO 12: Executar Migrações do Banco

### ✏️ Digite isto:

```bash
pnpm db:push
```

### 📺 Você vai ver:

```
✔ Drizzle Studio is up on http://localhost:5555

✔ 1 migration file(s) executed successfully
```

✅ **Banco de dados configurado!**

---

## 🔨 PASSO 13: Compilar Aplicação

### ✏️ Digite isto:

```bash
pnpm build
```

### 📺 Você vai ver (leva 1-2 minutos):

```
vite v5.0.0 building for production...
✓ 250 modules transformed.
dist/index.html                  0.50 kB │ gzip: 0.30 kB
dist/assets/index-abc123.js    250.50 kB │ gzip: 75.30 kB
dist/assets/index-def456.css    50.20 kB │ gzip: 10.30 kB

✓ built in 45.23s
```

✅ **Aplicação compilada!**

---

## 🚀 PASSO 14: Iniciar com PM2

### ✏️ Digite isto:

```bash
cd /var/www/equilibra-ai
pm2 start npm --name "equilibra-ai" -- start
```

### 📺 Você vai ver:

```
[PM2] Spawning process with name [equilibra-ai]
[PM2] Done
┌─────┬────────────────┬─────────┬─────────┬─────────┬──────────┐
│ id  │ name           │ version │ pid     │ status  │ restart  │
├─────┼────────────────┼─────────┼─────────┼─────────┼──────────┤
│ 0   │ equilibra-ai   │ 1.0.0   │ 12345   │ online  │ 0        │
└─────┴────────────────┴─────────┴─────────┴─────────┴──────────┘
```

### ✏️ Salve configuração:

```bash
pm2 save
pm2 startup
```

### 📺 Você vai ver:

```
[PM2] Saving current process list...
[PM2] Successfully saved in /root/.pm2/conf.js
```

✅ **Aplicação rodando!**

---

## 🌐 PASSO 15: Configurar Nginx

### ✏️ Digite isto:

```bash
nano /etc/nginx/sites-available/equilibra-ai
```

### 📺 Editor vazio

### ✏️ Cole isto:

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

### ✏️ Salve:

```
CTRL + X → y → ENTER
```

### ✏️ Ative o site:

```bash
ln -sf /etc/nginx/sites-available/equilibra-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
```

### ✏️ Teste:

```bash
nginx -t
```

### 📺 Você vai ver:

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### ✏️ Reinicie:

```bash
systemctl restart nginx
```

✅ **Nginx configurado!**

---

## 🔒 PASSO 16: Configurar SSL com Certbot

### ✏️ Digite isto:

```bash
certbot certonly --nginx -d appequilibraai.com.br -d www.appequilibraai.com.br
```

### 📺 Você vai ver:

```
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Plugins selected: Authenticator nginx, Installer nginx
Enter email address (used for urgent renewal and security notices):
```

### ✏️ Digite seu email:

```
seu_email@gmail.com
```

### 📺 Você vai ver:

```
Please read the Terms of Service at https://letsencrypt.org/documents/LE-SA-v1.2.1-August-1-2016.txt. You must
agree in order to register with the ACME server at https://acme-v02.api.letsencrypt.org/directory
```

### ✏️ Digite:

```
y
```

### 📺 Você vai ver:

```
Would you be willing to share your email address with the Electronic Frontier Foundation?
```

### ✏️ Digite:

```
n
```

### 📺 Você vai ver (leva alguns segundos):

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/appequilibraai.com.br/fullchain.pem
Key is saved at: /etc/letsencrypt/live/appequilibraai.com.br/privkey.pem
```

### ✏️ Ative renovação automática:

```bash
systemctl enable certbot.timer
systemctl start certbot.timer
```

✅ **SSL configurado!**

---

## 🧪 PASSO 17: Testar o Site

### ✏️ Verifique se tudo está rodando:

```bash
pm2 status
```

### 📺 Você vai ver:

```
┌─────┬────────────────┬─────────┬─────────┬─────────┬──────────┐
│ id  │ name           │ version │ pid     │ status  │ restart  │
├─────┼────────────────┼─────────┼─────────┼─────────┼──────────┤
│ 0   │ equilibra-ai   │ 1.0.0   │ 12345   │ online  │ 0        │
└─────┴────────────────┴─────────┴─────────┴─────────┴──────────┘
```

### ✏️ Abra seu navegador e acesse:

```
https://appequilibraai.com.br
```

### 📺 Você vai ver a página inicial do Equilibra AI!

✅ **Site funcionando!**

---

## 🎉 Parabéns!

Seu site está online em **https://appequilibraai.com.br**

### Para testar login:

1. Clique em "Criar Conta"
2. Digite um email: `teste@gmail.com`
3. Digite uma senha: `senha123`
4. Clique em "Registrar"
5. Você deve ser redirecionado para o perfil

---

## 📊 Comandos Úteis (Depois)

### Ver logs da aplicação:

```bash
pm2 logs equilibra-ai
```

### Reiniciar aplicação:

```bash
pm2 restart equilibra-ai
```

### Parar aplicação:

```bash
pm2 stop equilibra-ai
```

### Iniciar aplicação:

```bash
pm2 start equilibra-ai
```

### Atualizar código do GitHub:

```bash
cd /var/www/equilibra-ai
git pull origin main
pnpm install
pnpm db:push
pnpm build
pm2 restart equilibra-ai
```

---

## 🐛 Se Algo Não Funcionar

### Site mostra "502 Bad Gateway":

```bash
pm2 logs equilibra-ai
pm2 restart equilibra-ai
```

### Aplicação não inicia:

```bash
pm2 status
pm2 logs equilibra-ai
```

### Erro de banco de dados:

```bash
mysql -u equilibra_user -p -h localhost equilibra_ai
```

Digite a senha: `senha123456`

---

## ✅ Checklist Final

- [ ] SSH conectado
- [ ] Node.js instalado
- [ ] pnpm instalado
- [ ] PM2 instalado
- [ ] MySQL instalado
- [ ] Nginx instalado
- [ ] Certbot instalado
- [ ] Código clonado
- [ ] Banco criado
- [ ] .env criado
- [ ] Dependências instaladas
- [ ] Migrações executadas
- [ ] Aplicação compilada
- [ ] PM2 iniciado
- [ ] Nginx configurado
- [ ] SSL configurado
- [ ] Site acessível

**Tudo pronto! 🚀**
