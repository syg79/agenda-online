# Changelog

## [0.01.0] - 2026-02-12

### Adicionado
- **Integração Completa com Tadabase**:
  - Sincronização automática de agendamentos (`lib/tadabase.ts`).
  - Mapeamento robusto de serviços (Fotos, Vídeo, Drone, Tour 360, Planta Baixa).
  - Mapeamento de campos de cliente (Nome, Email, Telefone, Observações).
  - Suporte a CEP e Complemento no endereço.
- **Formulário de Agendamento (`/agendar`)**:
  - Validação de CEP automática via Google Maps API.
  - Seleção de múltiplos serviços com cálculo de tempo e preço.
  - Interface passo-a-passo (Wizard).
- **Backend (API)**:
  - Rota `/api/bookings` atualizada para receber e validar todos os campos.
  - Integração com Prisma (Postgres) para persistência de dados.
  - Disparo de e-mails de confirmação.

### Corrigido
- Correção no envio de serviços para o Tadabase (tradução de chaves internas para valores do checkbox).
- Correção na captura de CEP que estava indo vazio ("80000-000").
