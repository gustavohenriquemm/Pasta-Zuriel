# Igreja Zuriel

Sistema estatico para Biblia, Harpa Crista, hinos da mocidade e painel administrativo.

## Escolha tecnica

A conexao administrativa foi preparada com Firebase Authentication + Firestore no plano gratuito. Essa foi a opcao escolhida porque funciona direto na Vercel sem servidor proprio, permite login seguro para regentes, grava dados em tempo real e protege escrita por regras do Firestore.

Conteudos grandes ficam fora do codigo:

- Biblia ARC: carregada sob demanda da base JSON aberta `damarals/biblias`.
- Harpa Crista: carregada do JSON externo com 640 hinos.
- Mocidade: migrada das paginas antigas para `data/hymns/mocidade.seed.json`.

## Como testar

Sirva a pasta com um servidor estatico e abra `index.html`.

Exemplo:

```bash
npx serve .
```

## Documentacao

- Instalacao: `docs/INSTALACAO.md`
- Deploy na Vercel: `docs/DEPLOY-VERCEL.md`
- Regras do Firestore: `docs/firestore.rules`
