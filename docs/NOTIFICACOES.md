# Notificações em segundo plano

O site usa o Firebase Cloud Messaging (FCM) para receber notificações e uma
função da Vercel para enviá-las. Não é necessário publicar Cloud Functions nem
ativar o plano Blaze do Firebase.

As notificações são enviadas quando uma regente:

- define ou altera o hino e a regente de um ensaio;
- cria, atualiza ou cancela um evento;
- cria, atualiza ou remove um aviso ativo.

## Configuração na Vercel

1. No Firebase, abra **Configurações do projeto > Contas de serviço**.
2. Clique em **Gerar nova chave privada** e guarde o arquivo JSON. Não envie
   esse arquivo para o GitHub e não o coloque dentro do projeto.
3. Na Vercel, abra o projeto e entre em **Settings > Environment Variables**.
4. Crie estas três variáveis para Production, Preview e Development:
   - `FIREBASE_PROJECT_ID`: valor de `project_id` do JSON;
   - `FIREBASE_CLIENT_EMAIL`: valor de `client_email` do JSON;
   - `FIREBASE_PRIVATE_KEY`: valor completo de `private_key`, incluindo
     `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`.
5. Faça um novo deploy na Vercel.

## Como funciona no aparelho

- Android e computadores podem receber pela instalação do site ou por um
  navegador compatível.
- No iPhone ou iPad, é necessário iOS/iPadOS 16.4 ou mais recente, adicionar o
  Zuriel à Tela de Início e sempre abri-lo pelo ícone instalado.
- A permissão precisa ser aceita em cada aparelho.
- Depois da permissão, o token do aparelho fica salvo na coleção privada
  `notificationTokens`. O navegador não possui acesso direto a essa coleção.
- O sino do site continua mostrando somente os avisos comuns.

## Teste

1. Abra o site publicado no aparelho e permita as notificações.
2. Feche o aplicativo Zuriel.
3. Em outro aparelho ou computador, entre no painel administrativo.
4. Altere um ensaio ou crie um aviso ativo.
5. Confirme que o painel mostra **notificação enviada** e aguarde o aviso na
   barra do aparelho.

O FCM é gratuito. A função usa a franquia da conta da Vercel e só executa ao
registrar um aparelho ou quando uma regente salva uma alteração.
