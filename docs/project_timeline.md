# CRONOGRAMA DE DESENVOLVIMENTO
## Sistema de Agendamento - Fotografia Imobiliária

**Projeto:** MVP Sistema de Agendamento Online  
**Início Previsto:** [DATA DE INÍCIO]  
**Duração:** 3-4 semanas (tempo integral) ou 6-8 semanas (part-time)  
**Equipe:** 1 desenvolvedor full-stack

---
**STATUS ATUAL (FEVEREIRO/2026):**
- O frontend do fluxo de agendamento está bem avançado (`booking-form.tsx`).
- Os passos de endereço, serviços, data e horário estão integrados com as APIs de backend (`/api/address/search`, `/api/address/validate`, `/api/availability`).
- A etapa final de confirmação do agendamento (criação do booking no backend) e as funcionalidades de email e cancelamento ainda precisam ser implementadas.
---

## VISÃO GERAL DO PROJETO

```
┌─────────────────────────────────────────────────────────┐
│  SEMANA 1     │  SEMANA 2     │  SEMANA 3     │         │
│  Setup +      │  Backend      │  Integração + │ Deploy  │
│  Validação    │  Core         │  Testes       │         │
└─────────────────────────────────────────────────────────┘
    4 dias          5 dias          5 dias        3 dias
```

**Duração Total:** 17 dias úteis ≈ **3 semanas**  
**Total de Horas:** 120-140 horas  
**Custo de Infraestrutura:** $0/mês (100% grátis até 1.000 agendamentos/mês)

---

## SEMANA 1: PREPARAÇÃO E SETUP (28-32 horas) - CONCLUÍDO

### DIA 1: Validação do Protótipo (6-8h)

**Manhã (3-4h): Testes com Usuários**
- [x] Recrutar 3-5 testadores (amigos, clientes, família)
- [x] Preparar roteiro de teste:
  - Tarefa 1: "Agende uma sessão de fotos para amanhã"
  - Tarefa 2: "Agende fotos + vídeo para sábado"
  - Tarefa 3: "Cancele um agendamento"
- [x] Observar dificuldades e tempo gasto
- [x] Anotar feedback verbal
- [x] Registrar pontos de confusão

**Tarde (3-4h): Análise e Ajustes**
- [x] Compilar feedback
- [x] Priorizar ajustes críticos
- [x] Implementar correções no protótipo
- [x] Validar novamente (1-2 testadores)

**Entregável:** Lista de ajustes + Protótipo validado

---

### DIA 2: Definições de Negócio (6-8h)

**Manhã (3-4h): Dados Operacionais**
- [x] **Lista de Bairros Atendidos** (whitelist)
- [x] **Lista de Municípios Bloqueados** (blacklist)

**Tarde (3-4h): Regras de Negócio**
- [x] **Durações dos Serviços** (confirmar)
  - Fotos: 40min? ✓
  - Vídeo Paisagem: 50min? ✓
  - Vídeo Retrato: 50min? ✓
  - Drone Fotos: 25min? ✓
  - Drone Fotos+Vídeo: 40min? ✓

- [ ] **Regras de Cancelamento** (definir)
- [ ] **Dados dos Fotógrafos**

**Entregável:** Documento de regras de negócio completo

---

### DIA 3: Setup de Contas e APIs (7-9h)

**Manhã (4-5h): Contas e Credenciais**

**3.1 Google Cloud Platform** (90min)
- [x] Criar conta GCP (gmail@empresa.com)
- [x] Criar novo projeto: "Agendamento-Foto"
- [x] Habilitar APIs:
  - ✓ Maps JavaScript API
  - ✓ Places API
  - ✓ Geocoding API
  - ✓ Distance Matrix API
- [x] Criar API Key
- [x] Configurar restrições (domínio)
- [x] Testar chamada básica

**3.2 Vercel** (30min)
- [x] Criar conta Vercel
- [x] Conectar GitHub/GitLab

**3.3 Banco de Dados** (60min)
- [x] Criar Supabase (free tier - RECOMENDADO)
- [x] Obter connection string
- [x] Testar conexão local
- [x] Criar primeiro schema de teste

**3.4 Email** (30min)
- [ ] Criar conta Resend
- [ ] Obter API Key

**Tarde (3-4h): Tadabase e Documentação**

**3.5 Tadabase/Make.com** (90min)
- [ ] Documentar estrutura de dados Tadabase

**3.6 Organização** (90min)
- [x] Criar arquivo `.env.local` com todas as keys
- [x] Documentar variáveis de ambiente
- [x] Criar README inicial

**Entregável:** Todas as contas criadas + credenciais documentadas

---

### DIA 4: Repositório Git e Estrutura (6-8h)

**Manhã (3-4h): Setup do Projeto**

**4.1 Repositório** (60min)
- [x] Criar repositório Git (GitHub/GitLab)
- [x] Clonar localmente
- [x] Adicionar .gitignore
- [x] Primeiro commit

**4.2 Next.js Boilerplate** (120min)
- [x] Instalar Next.js 14 com TypeScript
- [x] Configurar Tailwind CSS
- [x] Instalar Shadcn/ui
- [x] Configurar Prisma ORM
- [x] Setup de pastas:
  ```
  /app
    /api
      /address
      /availability
      /bookings
      /webhooks
    /(routes)
      /page.tsx (landing)
      /agendar/page.tsx (booking flow)
  /components
  /lib
  /prisma
  /public
  ```

**Tarde (3-4h): Banco de Dados**

**4.3 Schema Prisma** (120min)
- [x] Criar schema.prisma
- [x] Definir models:
  - Photographer
  - CoverageArea
  - Booking
  - WebhookLog
- [x] Criar migrations
- [x] Rodar seed inicial (fotógrafos + bairros)

**4.4 Testes Iniciais** (60min)
- [x] Testar conexão com banco
- [x] Criar fotógrafo via Prisma
- [x] Consultar dados

**Entregável:** Projeto Next.js configurado + banco com dados seed

---

### DIA 5: Migração do Protótipo (6-8h)

**Manhã (3-4h): Copiar Código do Protótipo**
- [x] Copiar componentes do artifact para `/components`
- [x] Ajustar imports
- [x] Converter dados mockados em props
- [x] Testar renderização

**Tarde (3-4h): Integração Básica**
- [x] Criar páginas Next.js
- [x] Configurar rotas
- [x] Testar navegação
- [x] Deploy preview no Vercel

**Entregável:** Protótipo rodando em Next.js localmente

---

## SEMANA 2: DESENVOLVIMENTO BACKEND (35-42 horas) - CONCLUÍDO

### DIA 6-7: APIs de Validação (12-16h)

**API 1: Validação de Endereço** (6-8h)
- [x] Integrar Google Geocoding API
- [x] Extrair componentes do endereço
- [x] Validar contra whitelist de bairros
- [x] Validar contra blacklist de municípios
- [x] Testes unitários e de integração

**API 2: Buscar Endereços (Autocomplete)** (6-8h)
- [x] Integrar Google Places Autocomplete
- [x] Filtrar apenas Curitiba
- [x] Formatar resultados
- [x] Cache de resultados e Rate limiting

**Entregável:** APIs de endereço funcionando

---

### DIA 8-9: API de Disponibilidade (12-16h)

**API: Consultar Horários Disponíveis** (12-16h)
- [x] **Buscar agendamentos do dia**
- [x] **Calcular fotógrafos disponíveis por serviço**
- [x] **Calcular distância e tempo**
- [x] **Gerar slots disponíveis**
- [x] **Testes**

**Entregável:** API de disponibilidade precisa

---

### DIA 10: API de Agendamento (8-10h) - EM ANDAMENTO

**API: Criar Agendamento** (8-10h)
- [ ] **Validações** (Todos os campos, email, telefone, data, horário)
- [ ] **Lock temporário** (Prevenir agendamentos duplicados)
- [ ] **Alocar fotógrafo** (Escolher o mais próximo e disponível)
- [ ] **Criar agendamento** (Salvar no banco)
- [ ] **Integração Tadabase** (Enviar webhook)
- [ ] **Testes**

**Entregável:** API de agendamento completa

---

## SEMANA 3: INTEGRAÇÃO, TESTES E DEPLOY (30-36 horas) - A FAZER

### DIA 11-12: Integração Frontend ↔ Backend (12-16h)

**Tarefas:**
- [x] **Passo 1: Endereço** (Integração com API de validação e busca)
- [x] **Passo 2: Serviços** (Lógica local)
- [x] **Passo 3: Calendário** (Busca de disponibilidade)
- [x] **Passo 4: Horários** (Carregamento de slots da API)
- [x] **Passo 5: Dados** (Validações client-side)
- [ ] **Passo 6: Confirmação** (Enviar para API de agendamento)

**Entregável:** Fluxo completo integrado

---

### DIA 13: Sistema de Emails (7-9h)

- [ ] Design e criação de templates de email
- [ ] Integração com Resend para envio
- [ ] Testes de envio e formatação

**Entregável:** Emails automáticos funcionando

---

### DIA 14: Webhook Tadabase → Sistema (7-9h)

- [ ] Criação da API para receber webhooks
- [ ] Tratamento de conflitos
- [ ] Testes de sincronização

**Entregável:** Sincronização bidirecional funcionando

---

### DIA 15: Cancelamento (6-8h)

- [ ] Criação da API de cancelamento
- [ ] Desenvolvimento da página de cancelamento
- [ ] Testes do fluxo de cancelamento

**Entregável:** Cancelamento funcional

---

## SEMANA 4: TESTES E DEPLOY (30-40 horas) - A FAZER

### DIA 16-17: Testes e Deploy Final (12-15h)

- [ ] Testes End-to-End do fluxo completo
- [ ] Deploy em Produção no Vercel
- [ ] Configuração de monitoramento

**Entregável:** MVP EM PRODUÇÃO! 🚀
