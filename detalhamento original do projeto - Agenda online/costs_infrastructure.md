# ANÁLISE DE CUSTOS E INFRAESTRUTURA
## Sistema de Agendamento para Fotografia Imobiliária

**Versão:** 2.0 (Corrigida)  
**Data:** Janeiro 2026  
**Análise:** Custos reais de operação

---

## 💡 RESUMO EXECUTIVO

**Descoberta Principal:**
- ✅ Sistema pode operar **100% GRÁTIS** até **1.000 agendamentos/mês**
- ✅ Custos só começam após volume significativo
- ✅ Quando há custos, a receita já cobre facilmente

---

## 📊 ANÁLISE DE CONSUMO

### O que consome recursos?

**Alto Consumo (NÃO é seu caso):**
- ❌ Upload de fotos/vídeos (MB-GB por arquivo)
- ❌ Streaming de mídia (GB/hora)
- ❌ Processamento de imagem/vídeo (CPU intensivo)
- ❌ Chat em tempo real (conexões persistentes)
- ❌ Redes sociais (milhões de posts/dia)

**Baixo Consumo (SEU caso):**
- ✅ Formulários web (KB por submit)
- ✅ Consultas de banco (ms de processamento)
- ✅ Envio de emails (KB por email)
- ✅ Chamadas de API (KB por request)
- ✅ Agendamentos simples

### Consumo por Agendamento

```
1 Agendamento =
├─ Validação endereço (Google Maps): 3 requests × 5KB = 15KB
├─ Consulta disponibilidade: 10 queries × 1KB = 10KB
├─ Criar agendamento: 3 queries × 2KB = 6KB
├─ Enviar emails: 2 emails × 10KB = 20KB
├─ Webhook Tadabase: 1 request × 1KB = 1KB
└─ TOTAL: ~50KB por agendamento

100 agendamentos = 5MB (menos que 2 músicas MP3)
1.000 agendamentos = 50MB (menos que 1 episódio de série)
```

**Comparação:**
- 1 foto HD = 5MB = **100 agendamentos**
- 1 vídeo curto = 50MB = **1.000 agendamentos**

---

## 💰 CUSTOS DETALHADOS POR SERVIÇO

### 1. Hospedagem - Vercel

**Free Tier (para sempre):**
- 100GB bandwidth/mês
- 100 builds/mês
- Serverless functions ilimitadas
- SSL grátis
- Domínio customizado grátis
- Deploy automático

**Seu uso estimado:**
```
100 agendamentos/mês:    ~500MB bandwidth
1.000 agendamentos/mês:  ~5GB bandwidth
5.000 agendamentos/mês:  ~25GB bandwidth
```

**Quando precisa pagar?**
- Nunca, a menos que ultrapasse 100GB/mês
- Isso seria ~20.000 agendamentos/mês
- Nesse volume, Vercel Pro ($20/mês) vale a pena pelo suporte

**💰 Custo: $0/mês (até 20.000 agendamentos)**

---

### 2. Banco de Dados - Supabase

**Free Tier (para sempre):**
- 500MB storage
- **Queries ilimitadas** ⭐
- 2 databases
- API REST automática
- Realtime subscriptions
- Backup diário automático

**Comparação com alternativas:**
```
Vercel Postgres Free:
❌ 100 queries/dia = 3.000/mês
❌ 100 agendamentos = 30.000 queries
❌ Estoura o limite em ~3 dias

Supabase Free:
✅ Queries ilimitadas
✅ 500MB storage
✅ Suporta facilmente 50.000+ agendamentos
```

**Seu uso estimado:**
```
100 agendamentos/mês:    ~10MB storage usado
1.000 agendamentos/mês:  ~100MB storage
5.000 agendamentos/mês:  ~500MB storage (limite do free)
```

**Quando precisa pagar?**
- Quando ultrapassar 500MB de dados
- Isso seria ~5.000 agendamentos históricos acumulados
- Ou quando precisar de backup avançado
- Supabase Pro: $25/mês (8GB storage)

**💰 Custo: $0/mês (até 5.000 agendamentos acumulados)**

---

### 3. Google Maps API

**Free Tier:**
- $200 crédito/mês (renova todo mês)
- Geocoding: $5 por 1.000 requests
- Distance Matrix: $5 por 1.000 requests
- Places Autocomplete: $17 por 1.000 requests

**Seu uso por agendamento:**
```
1 agendamento =
├─ Autocomplete (usuário digitando): 2 requests
├─ Geocoding (validar endereço): 1 request
├─ Distance Matrix (calcular distância): 0-4 requests
└─ TOTAL: 3-7 requests por agendamento
```

**Cálculo de custos:**
```
100 agendamentos:
├─ 200 Autocomplete: $3.40
├─ 100 Geocoding: $0.50
├─ 100 Distance: $0.50
└─ TOTAL: $4.40/mês (coberto pelo crédito)

1.000 agendamentos:
├─ 2.000 Autocomplete: $34
├─ 1.000 Geocoding: $5
├─ 1.000 Distance: $5
└─ TOTAL: $44/mês (coberto pelo crédito)

4.000 agendamentos:
├─ 8.000 Autocomplete: $136
├─ 4.000 Geocoding: $20
├─ 4.000 Distance: $20
└─ TOTAL: $176/mês (coberto pelo crédito)

5.000 agendamentos:
├─ Total: ~$220/mês
└─ Você paga: $20/mês (excedente do crédito)
```

**Otimizações para reduzir custos:**
- ✅ Cache de geocodificação (endereços repetidos)
- ✅ Cache de distâncias (rotas comuns)
- ✅ Limitar autocomplete (só após 3 caracteres)

**Com cache agressivo:**
- Redução de 40-60% nos custos
- 5.000 agendamentos = ~$0-10/mês

**💰 Custo: $0/mês (até 4.000 agendamentos)**

---

### 4. Email - Resend

**Free Tier:**
- 100 emails/dia = 3.000/mês
- Domínio customizado grátis
- API simples
- Tracking de abertura/clique
- Logs de 30 dias

**Seu uso por agendamento:**
```
1 agendamento =
├─ Confirmação cliente: 1 email
├─ Notificação fotógrafo: 1 email
└─ TOTAL: 2 emails por agendamento

Extras:
├─ Lembrete 24h antes: 2 emails (cliente + fotógrafo)
├─ Cancelamento: 2 emails
```

**Cálculo de custos:**
```
100 agendamentos/mês:
├─ 200 emails confirmação
├─ 200 emails lembrete
└─ TOTAL: 400/mês (dentro do free tier)

1.500 agendamentos/mês:
├─ 3.000 emails confirmação
├─ 3.000 emails lembrete
└─ TOTAL: 6.000/mês (precisa Growth)

Resend Growth: $20/mês
├─ 50.000 emails/mês
└─ Suporta ~12.500 agendamentos/mês
```

**💰 Custo:**
- $0/mês (até 750 agendamentos)
- $20/mês (750-12.500 agendamentos)

---

### 5. WhatsApp - Twilio (Opcional - Fase 2)

**Custo:**
- $0.005 por mensagem enviada
- $0.000 por mensagem recebida

**Seu uso:**
```
1 agendamento =
├─ Confirmação: 1 mensagem
├─ Lembrete 24h: 1 mensagem
├─ Lembrete 2h: 1 mensagem
└─ TOTAL: 3 mensagens = $0.015

100 agendamentos = $1.50/mês
1.000 agendamentos = $15/mês
5.000 agendamentos = $75/mês
```

**💰 Custo: $0/mês no MVP (implementar depois)**

---

## 📈 TABELA RESUMIDA DE CUSTOS

| Agendamentos/mês | Vercel | Supabase | Google Maps | Resend | WhatsApp | **TOTAL** |
|------------------|--------|----------|-------------|--------|----------|-----------|
| **50** | $0 | $0 | $0 | $0 | - | **$0** |
| **100** | $0 | $0 | $0 | $0 | - | **$0** |
| **200** | $0 | $0 | $0 | $0 | - | **$0** |
| **500** | $0 | $0 | $0 | $0 | - | **$0** |
| **1.000** | $0 | $0 | $0 | $20 | $15 | **$35** |
| **2.000** | $0 | $0 | $0 | $20 | $30 | **$50** |
| **5.000** | $20 | $0 | $10 | $20 | $75 | **$125** |
| **10.000** | $20 | $25 | $50 | $20 | $150 | **$265** |

---

## 💡 ANÁLISE DE VIABILIDADE

### Break-Even por Volume

**Assumindo ticket médio: R$ 350/sessão**

| Volume/mês | Custo Infra | Receita | Custo/Receita | Viável? |
|------------|-------------|---------|---------------|---------|
| 50 | $0 | R$ 17.500 | 0% | ✅✅✅ |
| 100 | $0 | R$ 35.000 | 0% | ✅✅✅ |
| 500 | $0 | R$ 175.000 | 0% | ✅✅✅ |
| 1.000 | $35 | R$ 350.000 | 0.05% | ✅✅✅ |
| 5.000 | $125 | R$ 1.750.000 | 0.04% | ✅✅✅ |
| 10.000 | $265 | R$ 3.500.000 | 0.04% | ✅✅✅ |

**Conclusão:** O custo de infraestrutura é **IRRELEVANTE** em todos os cenários.

---

## 🎯 QUANDO MIGRAR DE PLANOS?

### Permanecer no Free Tier enquanto:
- ✅ Volume < 750 agendamentos/mês
- ✅ Sistema responde em < 2s
- ✅ Sem erros de limite
- ✅ Não precisa de suporte prioritário

### Migrar para Paid quando:
- ⚠️ > 750 agendamentos/mês (Email)
- ⚠️ > 4.000 agendamentos/mês (Google Maps)
- ⚠️ Quer backup avançado (Supabase Pro)
- ⚠️ Precisa de suporte 24/7 (Vercel Pro)
- ⚠️ Quer analytics avançados

### Importante:
**Quando você precisar migrar para planos pagos, já terá receita mais que suficiente para cobrir todos os custos operacionais.**

---

## 🚀 ESTRATÉGIA DE CRESCIMENTO

### Fase 1: MVP (0-1.000 agendamentos/mês)
**Stack:** 100% Free Tier  
**Custo:** $0-35/mês  
**Receita estimada:** R$ 350.000/mês  
**Margem:** 99.9%

**Foco:**
- Validar produto
- Coletar feedback
- Refinar processos
- Crescer organicamente

---

### Fase 2: Crescimento (1.000-5.000 agendamentos/mês)
**Stack:** Mostly Free + alguns Paid  
**Custo:** $35-125/mês  
**Receita estimada:** R$ 350.000-1.750.000/mês  
**Margem:** 99.9%

**Foco:**
- Adicionar WhatsApp
- Otimizar conversão
- Expandir equipe de fotógrafos
- Marketing

---

### Fase 3: Escala (5.000+ agendamentos/mês)
**Stack:** Paid tiers  
**Custo:** $125-500/mês  
**Receita estimada:** R$ 1.750.000+/mês  
**Margem:** 99.9%

**Foco:**
- Múltiplas cidades
- Dashboard avançado
- Analytics e BI
- Automação completa

---

## 🔒 SEGURANÇA E COMPLIANCE

**Incluído no Free Tier:**
- ✅ SSL/HTTPS (Vercel)
- ✅ Backup automático (Supabase)
- ✅ Auth seguro (Supabase)
- ✅ Rate limiting (Vercel)
- ✅ DDoS protection (Vercel)
- ✅ Conformidade LGPD (você implementa)

**Sem custo adicional de segurança!**

---

## 📊 COMPARAÇÃO COM ALTERNATIVAS

### Opção 1: Seu Sistema (Recomendado)
- Custo inicial: $6.000-7.000 (desenvolvimento)
- Custo mensal: $0-125 (dependendo volume)
- Controle total
- Customização ilimitada
- Sem taxas por transação

### Opção 2: SaaS Genérico (Calendly, Acuity)
- Custo inicial: $0
- Custo mensal: $30-80/usuário = $120-320/mês (4 fotógrafos)
- Funcionalidades limitadas
- Sem integração Tadabase
- Branding deles

### Opção 3: Contratar Agência
- Custo inicial: $15.000-30.000
- Custo mensal: $200-500 (manutenção)
- Overhead de comunicação
- Dependência externa

**Vencedor:** Seu sistema próprio

---

## ✅ RECOMENDAÇÕES FINAIS

### Para MVP:
1. **Use Supabase** (não Vercel Postgres)
   - Queries ilimitadas
   - Dashboard pronto
   - API automática

2. **Comece 100% grátis**
   - Só migre para paid quando necessário
   - Monitore uso mensalmente

3. **Otimize desde o início**
   - Cache de geocodificação
   - Cache de distâncias
   - Limitar autocomplete

4. **Não se preocupe com custos**
   - São IRRELEVANTES vs receita
   - Foque em qualidade do produto

### Para Crescimento:
1. **Monitore métricas**
   - Uso de APIs
   - Storage do banco
   - Emails enviados

2. **Otimize continuamente**
   - Cache agressivo
   - Queries eficientes
   - Compressão de dados

3. **Escale gradualmente**
   - Free tier → Growth → Pro
   - Só quando realmente necessário

---

## 📞 SUPORTE

**Todos os serviços têm:**
- ✅ Documentação extensa
- ✅ Comunidade ativa
- ✅ Suporte via ticket (free tier)
- ✅ Suporte prioritário (paid tiers)

**Não há custo adicional de suporte técnico.**

---

## 🎁 BÔNUS: Economia vs Alternativas

**SaaS (Calendly Pro):**
- $80/mês × 12 meses = $960/ano
- × 3 anos = $2.880

**Seu Sistema:**
- Desenvolvimento: $7.000 (uma vez)
- Operação: $0-500/ano (primeiro ano)
- × 3 anos = $7.000-8.500

**Economia a partir do 2° ano:** ~$6.000-8.000
**ROI:** < 12 meses

---

**Conclusão Final:**
O sistema pode operar **100% GRÁTIS** durante todo o MVP e crescimento inicial. Custos só aparecem quando há volume significativo, e nesse ponto a receita já cobre tudo facilmente.

**Infraestrutura não é um problema. Foque em construir um ótimo produto.**

---

_Documento atualizado: Janeiro 2026_  
_Próxima revisão: Após 1.000 agendamentos_