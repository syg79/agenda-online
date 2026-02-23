# Plano Mestre de Arquitetura: Transição Segura (Tadabase -> Vercel + Supabase)

Este plano descreve o roteiro arquitetural global para migração total do sistema legado (Tadabase) para um ecossistema próprio (Vercel + Supabase).

---

## As 5 Fases da Transição Segura

### FASE 1: O Núcleo do Agendamento (MVP Agenda Online)
**Objetivo:** Começar a usar a nova plataforma restrita exclusivamente à função de agendamento online inteligente.

- [ ] **1.A. O Agendamento Novo:** Usamos o Supabase para a inteligência de calendário, horários, cálculo de distâncias (Nível 1) e alocação de fotógrafos.
- [ ] **1.B. Dependência do Tadabase:** O Tadabase continua sendo a Fonte da Verdade primária para toda a retaguarda.
- [ ] **1.C. Sincronização Passiva:** A Agenda Online apenas atualiza o status de volta no Tadabase quando um agendamento é feito ou modificado.

---

### FASE 2: Novas Portas de Entrada (Apolarbot e Formulários)
**Objetivo:** Começar a popular o banco de dados novo (Supabase) diretamente na fonte, estruturando os dados de forma limpa.

- [ ] **2.A. Apolarbot 100% Online:** O script de scraping vira uma API nativa hospedada (agência digita REF, sistema busca dados).
- [ ] **2.B. Formulário Expresso para Outros Clientes:** Interface rápida para clientes não-atacadistas preencherem seus pedidos no Supabase.

---

### FASE 3: Sincronização Bidirecional Complexa (Refatoração de Dados)
**Objetivo:** Começar a lidar com o caos e desconstruir a "tabela de tudo" (Tadabase) e mapeá-la para o banco relacional elegante (Supabase).

- [ ] **3.A. Mapeamento de Equivalências:** Scripts para ler os campos do Tadabase, limpar/transformar e escrever nas tabelas do Prisma (`Bookings`, `Clients`, `Properties`).
- [ ] **3.B. Escrita Dupla Garantida:** Tudo inserido de novo (Agendas, Apolarbot) é replicado silenciosamente pro Tadabase.
- [ ] **3.C. Sincronização Lendo o Legado:** Mudanças manuais feitas no Tadabase refletidas no Supabase quase em tempo real.

---

### FASE 4: O Desligamento do Cérebro Velho (Make.com e Webhooks)
**Objetivo:** Uma vez que os dados inseridos estão confiáveis, nós matamos a inteligência de automação de terceiros.

- [ ] **4.A. Webhook Dispatcher Nativo (Vercel):** Implementar a Fila de Retentativas (`WebhookEvent`) no Supabase para lidar com falhas de rede.
- [ ] **4.B. Automações de Mídia:** Dispatcher passa a criar pastas físicas no Google Drive e enviar links via Gmail.
- [ ] **4.C. Morte das Rotinas no Make:** Desligamento oficial do Make.com e de seus limites, transferindo alertas para o Painel Novo.

---

### FASE 5: O Funeral e A Emancipação do Tadabase
**Objetivo:** Substituir definitivamente os módulos visuais da secretaria, exportar histórico frio e cancelar o plano do Tadabase.

- [ ] **5.A. Painéis Administrativos Finais:** Construção das telas de Faturas (Financeiro) e Relatórios Mensais em React.
- [ ] **5.B. Exportação Definitiva de Histórico Frio:** Histórico adormecido do Tadabase extraído (scraping automatizado auxiliado por IA) e congelado no Supabase.
- [ ] **5.C. Tchau Tadabase:** Encerramento do plano e extinção do banco legado. Fim da migração e início da fase 100% Inteligente (IA).
