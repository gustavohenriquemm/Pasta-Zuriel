# Deploy na Vercel

1. Envie o projeto para um repositorio Git.
2. Na Vercel, importe o repositorio.
3. Use as configuracoes padrao de projeto estatico.
4. Nao configure comando de build.
5. O diretorio de saida deve ser a raiz do projeto.
6. Depois do deploy, teste Biblia, Harpa, Mocidade e Painel.

O Firebase usado pelo navegador nao exige servidor proprio. As chaves do arquivo `config/firebase-config.js` sao publicas por natureza; a protecao real fica nas regras do Firestore.
