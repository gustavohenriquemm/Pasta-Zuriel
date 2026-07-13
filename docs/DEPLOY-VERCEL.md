# Deploy na Vercel

1. Envie o projeto para um repositorio Git.
2. Na Vercel, importe o repositorio.
3. Use as configurações padrão de projeto estático.
4. Não configure comando de build.
5. O diretório de saída deve ser a raiz do projeto.
6. Configure as três variáveis secretas descritas em `docs/NOTIFICACOES.md`.
7. Depois do deploy, teste Bíblia, Harpa, Mocidade, Painel e notificações.

As chaves do arquivo `config/firebase-config.js` são públicas por natureza. A
chave privada do Firebase Admin deve existir somente nas variáveis da Vercel.
