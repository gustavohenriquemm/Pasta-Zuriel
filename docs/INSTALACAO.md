# Instalacao

Este projeto foi mantido como site estatico para continuar simples e gratuito na Vercel.

1. Abra o projeto no computador.
2. Para testar localmente, sirva a pasta com qualquer servidor estatico.
3. Copie `config/firebase-config.example.js` para `config/firebase-config.js`.
4. Crie um projeto gratuito no Firebase.
5. Ative Authentication com login por e-mail e senha.
6. Crie os usuarios dos regentes em Authentication.
7. Ative o Firestore.
8. Crie documentos em `admins/{uid}` para cada regente autorizado.
9. Publique as regras de `docs/firestore.rules`.

## Estrutura dos dados

Colecoes usadas:

- `mocidade`: hinos editaveis da mocidade.
- `harpa`: hinos da Harpa editaveis no painel, quando desejar sobrescrever a fonte externa.
- `admins`: documentos com o UID dos regentes autorizados.

Campos dos hinos:

- `id`
- `number`
- `title`
- `lyrics`
- `category`
- `updatedAt`
