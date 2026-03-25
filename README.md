# 💈 WhatsApp Barber Booking

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

Sistema de agendamento para barbearia via WhatsApp, com backend em Node.js, TypeScript, Prisma, PostgreSQL e integração com WAHA. O bot conversa com o cliente, cadastra dados, mostra serviços, consulta horários disponíveis, agenda e cancela compromissos.

---

## ✨ Funcionalidades

* Agendamento de horários via WhatsApp
* Cadastro automático de clientes por telefone
* Captura de nome apenas na primeira conversa
* Catálogo dinâmico de serviços com nome, duração e preço
* Consulta de horários disponíveis por data
* Cancelamento de agendamentos futuros
* Agenda diária para o barbeiro
* Comandos administrativos via WhatsApp
* Validação de conflitos de horário e horário de funcionamento

---

## 🧱 Stack

* Node.js
* TypeScript
* Express
* Prisma
* PostgreSQL
* WAHA (WhatsApp HTTP API)
* Docker Compose
* Axios

---

## 🧠 Como o sistema funciona

1. O cliente envia uma mensagem no WhatsApp.
2. O WAHA recebe essa mensagem e envia um webhook para o backend.
3. O backend processa o webhook, aplica rate limit e regras de validação.
4. O handler identifica o fluxo correto por intenção e estado da conversa.
5. Os fluxos (`booking`, `availability`, `cancel`, `services`) chamam services de negócio.
6. Os services usam Prisma para persistir ou consultar dados.
7. O backend responde ao cliente pelo WAHA.

```mermaid
sequenceDiagram
    participant U as Usuário (WhatsApp)
    participant W as WAHA (Docker)
    participant B as Backend (Express)
    participant DB as Postgres (Prisma)
    
    U->>W: Envia mensagem
    W->>B: Webhook (POST /webhook/waha)
    B->>B: Identifica Intent & Step atual
    B->>DB: Consulta/Atualiza Dados
    DB-->>B: Retorna Dados (Ex: Horários)
    B->>W: Dispara Resposta (Axios)
    W-->>U: Recebe mensagem
```

📌 A conversa é mantida em memória enquanto o processo está ativo.

---

## 📁 Estrutura principal

```bash
src/whatsapp/core — handler, intents, comandos, tipos de fluxo
src/whatsapp/conversation — estado da conversa
src/whatsapp/flows — fluxos de booking, cancelamento, disponibilidade e serviços
src/services — regras de negócio
src/routes — rotas HTTP da API
prisma/ — schema, migrations e seed
docs/ — decisões e anotações do projeto
```

---

## 🛠 Pré-requisitos

* Node.js 18+
* Docker e Docker Compose
* PostgreSQL
* Conta WhatsApp para conectar ao WAHA

---

## 🔐 Configuração do ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

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
