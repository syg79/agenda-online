
# Contexto Inicial: Migração do Make.com & Manutenção Atual

## Onde Estamos
Estamos migrando um sistema de agendamento de fotógrafos da **Tadabase** para **Vercel (Next.js) + Supabase**.
O sistema já está funcional localmente com:
1. **Dashboard da Secretaria:** Calendário, Mapa, Timeline, Agendamento.
2. **Sincronização:** Script `sync-real-data.ts` puxa dados do Tadabase.
3. **Correções Recentes:**
   - **Dark Mode** implementado.
   - **Mapeamento de Dados** corrigido (Nome da Loja, Observações, Corretor).

## Próximo Objetivo (Foco deste Chat)
**Migrar as automações do Make.com para código nativo (Next.js Services).**

### Fluxos para Migrar:
1.  **Google Drive (Pastas do Imóvel):**
    - Criar pasta "Cliente - Data" automaticamente ao agendar.
    - Estratégia: Usar **Service Account** do Google Cloud.
2.  **Gmail (Envio de Emails/Rascunhos):**
    - Enviar email com link de download/confirmação.
    - Estratégia: Usar **OAuth 2.0 com Refresh Token** (para conta @gmail.com pessoal).

### Arquivos de Referência (Disponíveis na pasta `_matriz modelo`):
- `CRIA PASTA DO IMOVEL...json`
- `ENTREGAR...json`
- `ARQUIVO...json`
- `make_migration_plan.md` (Plano inicial já criado).

## Tecnologias Envolvidas
- **Google Cloud Platform:** Drive API, Gmail API.
- **Supabase:** Armazenar tokens e logs.
- **Next.js API Routes:** Gatilhos para executar as ações.
