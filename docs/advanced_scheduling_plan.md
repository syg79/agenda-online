# Plano de Otimização de Agendamento (Advanced Scheduling)

Este documento descreve a viabilidade e o plano técnico para implementar lógica avançada de agendamento, incluindo filtragem por fotógrafo/região e otimização de rotas (distância).

## 1. Filtragem Avançada (Já em andamento)
O sistema atual já possui a base para isso, mas precisa ser refinado para garantir que **cada agendamento seja validado contra regras estritas**.

### Objetivos:
- [ ] **Vincular Bairro -> Fotógrafo:** Cada bairro (ou setor) deve ter uma lista explícita de fotógrafos atendentes.
- [ ] **Vincular Serviço -> Habilidade:** Nem todo fotógrafo faz "Drone" ou "Tour 360". O sistema deve cruzar essa informação.
- [ ] **Validação em Tempo Real:** Se o usuário mudar o Bairro, o sistema deve rodar a busca de disponibilidade novamente (já implementado parcialmente, mas precisa ser robusto).

**Refatoração Necessária:** 
Criar uma tabela (ou constante configurável) de `CoverageRules` que defina: `{ Neighborhood: [PhotographerIDs] }` e `{ Service: [PhotographerIDs] }`.

---

## 2. Otimização de Distância (Route Optimization)

O usuário solicitou que o sistema calcule distâncias entre agendamentos para sugerir ou bloquear horários, evitando deslocamentos inviáveis.

### Viabilidade no MVP:
- **Alta Complexidade:** Implementar um "Traveling Salesman Problem" (TSP) completo em tempo real é complexo e custoso (Google Maps API Matrix custa por requisição).
- **Abordagem Recomendada (Nível 1):** Usar "Setorização" como proxy de distância. Se o fotógrafo tem um agendamento no "Bairro A" às 10:00, ele só pode aceitar agendamentos no "Bairro A" ou "Bairro B" (vizinho) às 11:30. Bairros distantes são bloqueados.
- **Abordagem (Nível 2 - Matriz de Distância Simples):**
  - Manter uma tabela estática de distâncias médias entre bairros (ex: Matriz 50x50 bairros de Curitiba).
  - Consulta rápida sem custo de API externa.
  - Se `Distancia(Bairro1, Bairro2) > TempoDisponivel`, bloqueia o horário.

### Proposta de Implementação (Fase 2):

1.  **Matriz de Adjacência:** Criar uma tabela JSON com tempos de deslocamento estimados entre regiões chaves (Norte, Sul, Centro, etc.).
2.  **Lógica de "Slot Inteligente":**
    - Ao buscar disponibilidade para o Fotógrafo X:
    - Verificar agendamentos existentes no dia.
    - Para cada slot livre, verificar: `AgendamentoAnterior.Local + TempoDeslocamento <= SlotAtual`.
    - Se o deslocamento "estourar" o tempo, o slot é removido.

---

## 3. Apolarbot Integration (Tadabase Automation)

O robô atual (`main_final.py` no Render) pode ser evoluído pa executar essa otimização pesada durante a noite (reorganizando agendas) ou via API sob demanda.

**Fluxo Sugerido:**
1.  **Agendamento Online (Next.js):** Usa regras "Nível 1" (Bairros Vizinhos) para resposta rápida (<2s).
2.  **Otimizador Noturno (Python/Tadabase):** Roda toda madrugada, analisa as rotas dos fotógrafos e sugere trocas de horários para otimizar KM rodado (envia sugestão para secretária).

## Conclusão
Para o MVP atual, recomendo implementar a **Regra de Setores/Vizinhos** hardcoded no código Typescript. É rápido, custo zero e resolve 90% dos problemas de deslocamento absurdo. A "Matriz exata de distância" pode ficar para uma versão 2.0.
