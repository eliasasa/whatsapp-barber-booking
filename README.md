# 💈 WhatsApp Barber Booking

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

Sistema de agendamento para barbearia via WhatsApp, com backend em Node.js, TypeScript, Prisma, PostgreSQL e integração com WAHA. O bot conversa com o cliente, cadastra dados, mostra serviços, consulta horários disponíveis, agenda e cancela compromissos.

---

## ✨ Funcionalidades

## 🔐 Painel Administrativo & Autenticação

O projeto inclui um painel administrativo protegido por autenticação JWT para gerenciar disponibilidade, bloqueios e outros recursos.

- Modelo `AdminUser` (Prisma) foi adicionado para armazenar admins.
- Endpoints principais:
  - `POST /auth/login` — autentica admin e retorna um JWT (Bearer token).
  - `POST /auth/setup` — cria o primeiro admin (pode exigir `AUTH_SETUP_KEY`).
  - `GET /auth/me` — valida o token e retorna dados do admin (protegido).

Fluxo recomendado para front-end:

1. Fazer `POST /auth/login` com `{ email, password }`.
2. Armazenar o token retornado (e.g. `localStorage`) e enviar `Authorization: Bearer <token>` nas requisições protegidas.
3. Verificar sessão chamando `GET /auth/me` ao iniciar a aplicação.

Obs.: Não há signup público — o admin inicial é criado via seed ou `POST /auth/setup`.

## ⛑️ Rate limiting no login

Para mitigar ataques de força bruta, o endpoint de login possui rate limiting:

- Limite padrão: **5 tentativas** a cada **15 minutos** por IP.
- Ao exceder, o IP é bloqueado por **15 minutos**.
- Resposta HTTP: `429 Too Many Requests` com header `Retry-After` indicando segundos até poder tentar novamente.

Essa proteção é implementada em `src/middleware/loginRateLimiter.ts` e aplicada em `POST /auth/login`.

## ⚙️ Variáveis de ambiente (autenticação)

Adicione as seguintes variáveis no seu `.env` para habilitar e configurar o painel:

- `AUTH_JWT_SECRET` — segredo usado para assinar JWTs (obrigatório em produção).
- `AUTH_JWT_EXPIRES_IN` — tempo de expiração do token (ex: `12h`).
- `AUTH_SETUP_KEY` — chave opcional para proteger o endpoint de setup inicial.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` — opcionalmente usados pelo seed para criar o admin inicial.

O seed (`npx prisma db seed`) usa `ADMIN_EMAIL` e `ADMIN_PASSWORD` para criar/atualizar o admin inicial de forma idempotente.

## 🧾 Instruções rápidas de administração

1. Aplicar migrations:

```bash
npx prisma migrate deploy
```

2. Executar seed (cria admin inicial e dados padrão):

```bash
npx prisma db seed
```

3. Testar login (exemplo `curl`):

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@painel.local","password":"sua_senha"}'
```

Resposta esperada:

```json
{
  "token": "<jwt-token>",
  "admin": { "id": "...", "email": "admin@painel.local", "name": "Admin" }
}
```

Use o token retornado nas próximas chamadas protegidas:

```
Authorization: Bearer <jwt-token>
```

## 🔧 Rotas administrativas protegidas (exemplos)

- `GET /availability` — lista horários de expediente (requer JWT)
- `POST /availability` — cria horário de expediente
- `GET /availability-blocks` — lista bloqueios por data
- `POST /availability-blocks` — cria bloqueio de data/período
- `POST /appointments` / `PATCH /appointments/:id/reschedule` / `PATCH /appointments/:id/cancel` — operações protegidas

As rotas administrativas estão protegidas pelo middleware `requireAdminAuth` (ver `src/middleware/requireAdminAuth.ts`).

Ajuste as variáveis conforme seu ambiente.

### Exemplo de `.env`

```env
PORT=3000
DATABASE_URL=postgresql://barber:barber@localhost:5432/barberdb
WAHA_API_URL=http://localhost:3001
WAHA_API_KEY=your_api_key_here

WHATSAPP_DEFAULT_ENGINE=WEBJS
WAHA_LOG_LEVEL=info
WAHA_LOG_FORMAT=JSON

WHATSAPP_START_SESSION=default
WHATSAPP_RESTART_ALL_SESSIONS=false

WHATSAPP_HOOK_URL=http://host.docker.internal:3000/webhook/waha
WHATSAPP_HOOK_EVENTS=session.status,message
```

* `WAHA_API_KEY` é usado para enviar mensagens pelo WAHA
* `WHATSAPP_HOOK_URL` aponta para o webhook do backend

---

## 🚀 Como rodar o projeto

### 🔥 Opção recomendada: WAHA + PostgreSQL no Docker, backend local

Suba os serviços de infraestrutura:

```bash
docker compose up -d
```

Instale as dependências:

```bash
npm install
```

Rode as migrations:

```bash
npx prisma migrate dev
```

Popule os dados iniciais:

```bash
npx prisma db seed
```

Inicie o backend:

```bash
npm run dev
```

Acesse o WAHA:

```
http://localhost:3001
```

Conecte o WhatsApp via QR Code no dashboard.

---

### ⚙️ Rodar sem Docker

Você precisará de:

* PostgreSQL rodando
* WAHA rodando separadamente
* `.env` configurado corretamente

Depois:

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

---

## 🌱 Seed inicial

O seed cria:

### Serviços padrão

* Corte
* Barba
* Corte + Barba

### Disponibilidade

* Segunda a sexta: 09:00 às 18:00
* Sábado: 09:00 às 13:00

Executar:

```bash
npx prisma db seed
```

---

## 📡 Endpoints principais

### 🩺 Saúde

```
GET /health
```

---

### 📲 Webhook do WAHA

```
POST /webhook/waha
```

---

### 📅 Agendamentos

```
POST   /appointments
PATCH  /appointments/:id/cancel
PATCH  /appointments/:id/reschedule
```

---

### 📋 Agenda do barbeiro

```
GET /agenda?date=YYYY-MM-DD
```

---

### ⏰ Disponibilidade

```
POST /availability
GET  /availability-slots?date=DD/MM&serviceId=...
```

---

## 🤖 Fluxo do bot WhatsApp

### 1. Saudação

O bot se apresenta e orienta o cliente.

---

### 2. Agendamento

Fluxo de booking:

* Se o telefone ainda não existir, o bot pergunta o nome
* O bot mostra os serviços disponíveis
* O cliente escolhe o serviço
* O bot pede a data
* O bot gera e lista os horários disponíveis
* O cliente escolhe um horário
* O bot pede o endereço
* O cliente confirma o agendamento

---

### 3. Disponibilidade

Fluxo informativo:

* O bot pede a data
* O sistema retorna os horários livres
* O fluxo encerra

---

### 4. Cancelamento

Fluxo:

* O bot lista os agendamentos futuros
* O cliente escolhe qual cancelar
* O bot pede confirmação
* O agendamento é cancelado

---

### 5. Serviços

Fluxo de catálogo:

* Lista serviços cadastrados
* Mostra nome, preço e duração
* Encerra

---

## ⌨️ Comandos do bot

```
#pause     → pausa o atendimento automático
#resume    → retoma o atendimento automático
#reset     → reinicia a conversa
#commands  → lista os comandos disponíveis
```

---

## 🧠 Detalhes de arquitetura

* Estado da conversa mantido em memória
* Controle via `flow` e `step`
* Uso de `lastBotMessage` para contexto
* Separação de fluxos:

  * booking
  * cancel
  * availability
  * services

📌 Regras de negócio ficam em `services`
📌 Prisma apenas na persistência

---

## 🌐 Acesso remoto

A exposição externa via Cloudflare Tunnel será implementada futuramente.

📄 Documentação:

```
docs/adr-001-cloudflare-tunnel.md
```

---

## 🗺 Próximos passos

* Painel web para o barbeiro
* Autenticação
* Acesso remoto via celular
* Melhorias no fluxo de disponibilidade
* Testes automatizados
* Documentação OpenAPI/Swagger

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Elias Neto**
