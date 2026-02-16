# ADR-001 – Exposição Remota via Cloudflare Tunnel

## Status
Aprovado

## Contexto
Após finalizar o front principal, será necessário permitir acesso remoto ao sistema via celular.

## Decisão
Utilizar Cloudflare Tunnel para expor a aplicação.

## Motivo

- Gratuito
- HTTPS automático
- Não exige IP fixo
- Não requer abertura de portas
- Configuração simples
- Ideal para MVP profissional

## Regras antes da exposição

- Implementar autenticação (login + senha)
- Proteger rotas administrativas

## Objetivo

Permitir que o cliente:

- Veja agenda remotamente
- Consulte próximo cliente
- Veja endereço
- Cancele ou reagende

## Observação

O PC local precisará permanecer ligado.
