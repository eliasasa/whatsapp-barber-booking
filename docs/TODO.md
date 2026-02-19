# TODO

## 🧪 Testes Pendentes
- [ ] Testar novo sistema de rate limit:
  - [ ] Rate limit normal (15 mensagens/minuto)
  - [ ] Cooldown entre mensagens (500ms)
  - [ ] Detecção de mensagens repetidas (3x)
  - [ ] Reset do contador ao mudar mensagem
  - [ ] Reset após expirar janela de 60s

## 🔄 Mudança de Intenção em Fluxos Ativos
- [ ] Implementar detector de intenções conflitantes
- [ ] Criar fluxo de confirmação para troca de intenção
- [ ] Preservar dados do fluxo atual (snapshot) para possível retorno
- [ ] Adicionar comando explícito de "cancelar" ou "voltar"
- [ ] Testar cenários:
  - [ ] Usuário no meio de agendamento e envia "cancelar"
  - [ ] Usuário no meio de cancelamento e envia "agendar"
  - [ ] Usuário desiste da troca e retorna ao fluxo anterior