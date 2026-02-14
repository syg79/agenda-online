# Guia de Implantação no Vercel

Este projeto está pronto para ser implantado no [Vercel](https://vercel.com), a plataforma recomendada para Next.js.

## 1. Pré-requisitos

### Repositório GitHub
Certifique-se de que seu código está salvo no GitHub (o que já fizemos na versão `v0.01.0`).

### Banco de Dados (Supabase)
Seu arquivo `.env` indica que você já está usando o **Supabase**, o que é perfeito para produção. Não é necessário alterar nada na configuração do banco.

## 2. Configurando no Vercel

1. Acesse https://vercel.com e faça login.
2. Clique em **"Add New..."** -> **"Project"**.
3. Importe o repositório `agendamento-fotos`.
4. Nas configurações do projeto (**Configure Project**):
   - **Framework Preset**: Next.js (deve ser automático)
   - **Root Directory**: `./` (padrão)

### Variáveis de Ambiente (Environment Variables)
Você PRECISARÁ adicionar as seguintes variáveis na seção "Environment Variables" do Vercel. Copie os valores do seu arquivo local `.env`, **exceto** `NEXT_PUBLIC_APP_URL`.

| Variável | Descrição |
| :--- | :--- |
| `DATABASE_URL` | URL de conexão do Supabase (Pooler) - **IMPORTANTE:** Adicione `?pgbouncer=true` no final. |
| `DIRECT_URL` | URL de conexão direta do Supabase |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Sua chave de API do Google Maps |
### Variáveis de Ambiente (Environment Variables)
Você PRECISARÁ adicionar as seguintes variáveis na seção "Environment Variables" do Vercel. Copie os valores do seu arquivo local `.env`, **exceto** `NEXT_PUBLIC_APP_URL`.
| `EMAIL_USER` | Email para envio (Gmail) |
| `EMAIL_PASS` | Senha de App do Gmail |
| `TADABASE_API_URL` | `https://api.tadabase.io/api/v1` |
| `TADABASE_APP_ID` | Seu App ID do Tadabase |
| `TADABASE_APP_KEY` | Sua App Key do Tadabase |
| `TADABASE_APP_SECRET` | Seu App Secret do Tadabase |
| `SOLICITACAO_TABLE_ID` | ID da tabela de solicitações (`o6WQb5NnBZ`) |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_URL` | **ATENÇÃO:** Use a URL que o Vercel gerar (ex: `https://seu-projeto.vercel.app`) ou deixe vazio inicialmente. NÃO use `localhost`. |

> **Dica:** Você pode copiar todo o conteúdo do seu `.env` e colar no campo de importação do Vercel, mas lembre-se de **desmarcar** ou **remover** a linha `NEXT_PUBLIC_APP_URL` antes de salvar.

1. Clonar o repositório.
2. Instalar as dependências (`npm install`).
3. Executar o comando de build (`prisma generate && next build`).
4. Publicar o site.

Se tudo estiver correto, seu site estará no ar em poucos minutos! 🚀
