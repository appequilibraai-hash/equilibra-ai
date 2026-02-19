# ⚡ Deploy Rápido - Equilibra AI

## 🚀 Uma Linha de Comando (Recomendado)

Execute este comando **uma única vez** no seu VPS como root:

```bash
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/appequilibraai-hash/equilibra-ai/main/setup-vps.sh)"
```

Ou, se preferir fazer download primeiro:

```bash
ssh root@seu_ip_do_vps
cd /tmp
wget https://raw.githubusercontent.com/appequilibraai-hash/equilibra-ai/main/setup-vps.sh
sudo bash setup-vps.sh
```

---

## ✅ O que o Script Faz Automaticamente

- ✅ Atualiza o sistema
- ✅ Instala Node.js 20
- ✅ Instala pnpm
- ✅ Instala PM2
- ✅ Instala MySQL 8
- ✅ Instala Nginx
- ✅ Instala Certbot (SSL)
- ✅ Clona o repositório
- ✅ Instala dependências
- ✅ Cria banco de dados
- ✅ Executa migrações
- ✅ Compila a aplicação
- ✅ Inicia com PM2
- ✅ Configura Nginx
- ✅ Configura SSL com Certbot
- ✅ Configura Firewall

---

## 📋 Pré-requisitos

1. **VPS com Ubuntu 22.04** (Hostinger, DigitalOcean, AWS, etc.)
2. **Acesso SSH como root** (ou com sudo)
3. **Domínio appequilibraai.com.br** apontando para o IP do VPS
4. **Porta 22 (SSH), 80 (HTTP) e 443 (HTTPS) abertas**

---

## 🎯 Passos

### 1️⃣ Conectar ao VPS

```bash
ssh root@seu_ip_do_vps
# ou
ssh seu_usuario@seu_ip_do_vps
```

### 2️⃣ Executar Script de Setup

```bash
cd /tmp
wget https://raw.githubusercontent.com/appequilibraai-hash/equilibra-ai/main/setup-vps.sh
sudo bash setup-vps.sh
```

### 3️⃣ Seguir as Instruções

O script vai:
- Instalar tudo automaticamente
- Pedir para confirmar a configuração de SSL (pressione ENTER)
- Mostrar as credenciais do banco de dados

### 4️⃣ Acessar o Site

Após 2-3 minutos, acesse:

```
https://appequilibraai.com.br
```

---

## 🔄 Atualizar Código (Depois)

Quando quiser atualizar o código do repositório:

```bash
ssh root@seu_ip_do_vps
cd /var/www/equilibra-ai
bash deploy.sh
```

Ou manualmente:

```bash
cd /var/www/equilibra-ai
git pull origin main
pnpm install
pnpm db:push
pnpm build
pm2 restart equilibra-ai
```

---

## 📊 Monitorar Aplicação

```bash
# Ver logs em tempo real
pm2 logs equilibra-ai

# Ver status
pm2 status

# Reiniciar
pm2 restart equilibra-ai

# Parar
pm2 stop equilibra-ai

# Iniciar
pm2 start equilibra-ai
```

---

## 🐛 Troubleshooting

### Site mostra "502 Bad Gateway"
```bash
pm2 logs equilibra-ai
pm2 restart equilibra-ai
```

### Erro de conexão com banco de dados
```bash
# Verificar credenciais em .env
cat /var/www/equilibra-ai/.env

# Testar conexão MySQL
mysql -u equilibra_user -p -h localhost equilibra_ai
```

### Nginx não inicia
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### SSL não funciona
```bash
sudo certbot renew --dry-run
sudo systemctl restart nginx
```

---

## 📝 Informações Salvas

Após o setup, você terá:

- **Aplicação**: `/var/www/equilibra-ai`
- **Logs**: `pm2 logs equilibra-ai`
- **Banco de dados**: `equilibra_ai`
- **Arquivo .env**: `/var/www/equilibra-ai/.env`

---

## 🆘 Precisa de Ajuda?

1. Verifique os logs: `pm2 logs equilibra-ai`
2. Verifique Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Verifique MySQL: `sudo tail -f /var/log/mysql/error.log`

---

## ✨ Pronto!

Seu site estará disponível em **https://appequilibraai.com.br** em poucos minutos! 🎉
