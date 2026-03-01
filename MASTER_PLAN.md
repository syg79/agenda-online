# Plano Mestre de Arquitetura: Transição Segura (Tadabase -> Vercel + Supabase)

Este plano descreve o roteiro arquitetural global para migração total do sistema legado (Tadabase) para um ecossistema próprio (Vercel + Supabase).

---

## As 5 Fases da Transição Segura

### FASE 1: O Núcleo do Agendamento (MVP Agenda Online)
**Objetivo:** Começar a usar a nova plataforma restrita exclusivamente à função de agendamento online inteligente.

- [x] **1.A. O Agendamento Novo:** Usamos o Supabase para a inteligência de calendário, horários, cálculo de distâncias (Nível 1) e alocação de fotógrafos.
- [ ] **1.B. Dependência do Tadabase:** O Tadabase continua sendo a Fonte da Verdade primária para toda a retaguarda.
- [ ] **1.C. Sincronização Passiva:** A Agenda Online apenas atualiza o status de volta no Tadabase quando um agendamento é feito ou modificado.

---

### FASE 2: Novas Portas de Entrada (Apolarbot e Formulários)
**Objetivo:** Começar a popular o banco de dados novo (Supabase) diretamente na fonte, estruturando os dados de forma limpa.

- [ ] **2.A. Apolarbot 100% Online:** O script de scraping vira uma API nativa hospedada (agência digita REF, sistema busca dados).
- [ ] **2.B. Formulário Expresso para Outros Clientes:** Interface rápida para clientes não-atacadistas preencherem seus pedidos no Supabase.

### FASE 3: Desligamento do Cérebro Velho (Make.com e Webhooks Antigos)
**Objetivo:** Extinguir a automação do Make.com e transferir toda a inteligência (pastas no drive, e-mails, entrega) para dentro da própria Agenda Online (Next.js).

- [ ] **3.A. Dicionário de Dados 1:1:** A API da Agenda (`app/api/webhooks/tadabase-...`) passará a escutar os mesmos gatilhos do Make, precisando apenas alinhavar quais colunas (field_123) do Tadabase ela espera receber em seu formato.
- [ ] **3.B. A Trava de Segurança (Origem dos Dados):**  Agenda Online enviará "Origem: agenda-online" pro Tadabase ao editar, e o Webhook do Tadabase terá uma trava "Não disparar se Origem for agenda-online" (Isso previne o temido Loop Infinito de automações).
- [ ] **3.C. Go-Live Controlado (1 por 1):** Desligamos um módulo no Make, colamos nossa URL da API no painel do Tadabase, rodamos 1 simulação e validamos a pasta/entrega.
- [ ] **3.D. Fila Encalhada ("Sincronizar Atrasados"):** O botão "Atualizar Lista" da secretaria usará o script (`tadabase-pull`) para não só atualizar os cards, mas acionar de modo autônomo as criações de pastas que bugaram no Make nos últimos dias.

---

### FASE 4: Sincronização Bidirecional e Banco de Dados Limpo (Supabase)
**Objetivo:** Somente após desligarmos o Make, entraremos na fase final onde os dados são espelhados de forma limpa pro Supabase, aprendendo com os erros de antigas migrações.

- [ ] **4.A. Abordagem Anti-Trauma (Natividade vs Force Shift):** A antiga migração tentou espelhar 146 colunas cegamente via Python/n8n externo. Nossa migração 2.0 apenas escreve no banco prisma (`Bookings`, `Clients`, `Properties`) utilizando as rotas da própria aplicação Next.js local (já implementada em partes nas APIs). 
- [ ] **4.B. Mapeamento de Faltantes:** Avaliaremos colunas secundárias ainda órfãs (Faturamento, etc) que o Supabase/Prisma ainda não possui.
- [ ] **4.C. Escrita Dupla Desativada Gradualmente:** O Supabase vira mestre e o Tadabase passará a ser apêndice, não core.

### FASE 5: O Funeral e A Emancipação do Tadabase
**Objetivo:** Substituir definitivamente os módulos visuais da secretaria, exportar histórico frio e cancelar o plano do Tadabase.

- [ ] **5.A. Painéis Administrativos Finais:** Construção das telas de Faturas (Financeiro) e Relatórios Mensais em React.
- [ ] **5.B. Exportação Definitiva de Histórico Frio:** Histórico adormecido do Tadabase extraído (scraping automatizado auxiliado por IA) e congelado no Supabase.
- [ ] **5.C. Tchau Tadabase:** Encerramento do plano e extinção do banco legado. Fim da migração e início da fase 100% Inteligente (IA).

---

### FASE 6: Inteligência Artificial e Atendimento ("Ana")
**Objetivo:** Substituir processos passivos por uma IA orquestradora que gerencia WhatsApp e Emails proativamente através de microsserviços na Oracle Cloud e Railway.

- [ ] **6.A. Infraestrutura Multi-Device (Evolution API):** Subir e plugar a Evolution API na *Railway* gerenciando o número de WhatsApp Business da Secretaria de forma limpa e paralela a instâncias no celular.
- [ ] **6.B. Pipeline LLM & Whisper (Oracle Cloud):** O cérebro Node.js da Ana rodando na Oracle para transcrição de áudios (Whisper) e classificação de intenções via Anthropic Claude (Haiku com fallback para Sonnet).
- [ ] **6.C. Hub de Escalonamento Humano:** Sistema de alocação de "TimerBomb". Se a restrição falhar ou o score de confiança for baixo, o caso é jogado no grupo da equipe humana de fotografia imediatamente com resumo do ocorrido.

### FASE 7: Ecossistema Global (Timefold & Portais B2B)
**Objetivo:** Transcender o MVP criando portais corporativos logados e otimização de rotas logística.

- [ ] **7.A. Otimização do Caixeiro Viajante (Timefold):** Tirar a lógica pesada em TS do cálculo linear geográfico e jogar para o Solver matemático `Timefold` alocado na *Railway*. Ele dirá ao Supabase "este fotógrafo cabe neste slot perfeitamente com 99% de margem".
- [ ] **7.B. Área Logada: Painel da Imobiliária (Cliente):** Um dashboard clean (Vercel) para a imobiliária entrar com senha e puxar todos seus pedidos, fazer refações, alterar chaves ou reagendar sessoes, eliminando a centralização do WhatsApp.
- [ ] **7.C. Área Logada: Área do Fotógrafo e Editores:** App responsivo listando a rota Pwa diária (estilo Uber), permitindo recusas ou aceite rápido, GPS nativo, e upload em batch para Editores terceirizados controlarem prazos e filas de retocagem via link de nuvem seguro.
