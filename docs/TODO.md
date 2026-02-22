## 👤 Identificação de Cliente

- [ ] Verificar se o número já existe no banco ao iniciar conversa
- [ ] Se não existir:
  - [ ] Perguntar o nome do cliente
  - [ ] Validar se o nome não está vazio
  - [ ] Salvar nome vinculado ao número
  - [ ] Continuar fluxo normal após salvar
- [ ] Se já existir:
  - [ ] Não perguntar nome novamente
  - [ ] Usar nome salvo automaticamente no atendimento
- [ ] Garantir que a pergunta de nome aconteça antes de qualquer outro fluxo
- [ ] Testar:
  - [ ] Número novo iniciando conversa
  - [ ] Número já cadastrado
  - [ ] Cliente enviando mensagem diferente ao invés do nome