# Contexto para Nova Sessão de Chat - Agenda Online

**Data:** 11/02/2026
**Status do Projeto:** Fase 2 (Refinamentos) concluída, Iniciando Fase 3 (Lógica Avançada e Admin).

## 🚀 O que foi feito até agora
1.  **Fluxo de Agendamento (Público)**:
    - Formulário completo com validação de endereço (Google/ViaCEP).
    - Lógica de disponibilidade "Hardcoded" para MVP (Slots de hora em hora, 08:00 as 18:00).
    - Integração com Tadabase (Webhook).
    - Exclusão de "São Paulo" (exceto ruas em Curitiba).

2.  **Painel da Secretaria (`/secretaria`)**:
    - Visualização de agendamentos por dia e semana.
    - **Correção Recente:** Adicionada seção para **"Agendamentos Sem Fotógrafo"** (Unassigned), pois agendamentos feitos pelo site público ainda não atribuem fotógrafo automaticamente.
    - Botões de ação (Editar, Cancelar) visuais (sem backend funcional ainda).

3.  **Painel Admin (`/admin`)**:
    - Estrutura de abas (Habilidades, Regiões, Clientes).
    - **Correção Recente:** Refatorado para remover dependências quebradas do Shadcn UI, usando Tailwind puro.

4.  **Banco de Dados (Prisma)**:
    - Models: `Booking`, `Photographer`, `TimeBlock`, `Region`, `ClientPreference`.
    - Seed populado com fotógrafos (Rafael, Renato, Rodrigo, Augusto).

## 🚧 Em Progresso / Problemas Conhecidos
1.  **Atribuição de Fotógrafos**: 
    - Atualmente, novos agendamentos ficam com `photographerId: null`. 
    - Precisamos de uma lógica (manual ou automática) para atribuir esses agendamentos a um fotógrafo.
2.  **Funcionalidade de Edição/Cancelamento**:
    - Os botões no dashboard da secretaria exibem apenas `alert()`. Precisam ser conectados a Server Actions ou API.
3.  **Lógica de Disponibilidade Avançada**:
    - O sistema ainda não filtra fotógrafos por **Região** ou **Preferência do Cliente**. Ele assume que todos atendem tudo (MVP).
4.  **Admin UI**:
    - **ATENÇÃO:** As abas de "Regiões" e "Clientes" no `/admin` são apenas **mockups visuais** (HTML estático). 
    - **Não há lógica** implementada para criar/editar/excluir regiões ou preferências ainda.
    - O banco de dados possui apenas os dados iniciais do Seed.

## 📂 Arquivos Chaves para Analisar
- `d:\PROJETO\Agenda online\components\SecretaryDashboard.tsx`: O painel principal da secretaria. Contém a lógica de visualização Diária/Semanal e a lista de "Sem Fotógrafo".
- `d:\PROJETO\Agenda online\app\secretaria\page.tsx`: Fetch de dados para o dashboard. Busca fotógrafos E agendamentos órfãos.
- `d:\PROJETO\Agenda online\lib\services\availabilityService.ts`: O motor de disponibilidade. Precisa ser evoluído para suportar regiões.
- `d:\PROJETO\Agenda online\app\admin\page.tsx`: O painel administrativo (Tailwind puro).

## 🎯 Próximos Passos Imediatos (Para o Novo Chat)
1.  **Implementar Edição de Agendamento**: Criar Server Action para editar data/hora/fotógrafo de um agendamento existente.
2.  **Atribuição Manual**: Permitir que a secretaria arraste ou selecione um fotógrafo para os agendamentos "Sem Fotógrafo".
3.  **Conectar Admin ao Backend**: Fazer as telas de Região e Preferências salvarem no banco.
4.  **Refinar Disponibilidade**: Usar as tabelas de `Region` e `ClientPreference` no `availabilityService.ts`.

## 💡 Contexto Adicional do Usuário
- O usuário quer que o sistema sugira horários com base na **proximidade geográfica** (Otimização de Rota) no futuro (Fase 4+).
- O usuário prefere uma lista simples para ordenar preferências de clientes, em vez de drag-and-drop complexo por enquanto.

## 📝 Tarefas Pendentes (Sessão Atual)
- [ ] Analisar `CONTEXTO_NOVO_CHAT.md` e `schema.prisma`
- [ ] Definir estratégia de integração com Tadabase
    - [ ] Avaliar opções API vs Webhook vs Espelhamento de DB
    - [ ] Propor solução para sincronização de Clientes/Pedidos/Fotógrafos
- [ ] Projetar recursos de "Detalhes do Agendamento"
    - [ ] Adicionar campo Endereço ao modelo de Agendamento
    - [ ] Implementar lógica de seleção/troca de Fotógrafo
- [ ] Implementar Integração
    - [ ] (Aguardando decisão sobre estratégia)
