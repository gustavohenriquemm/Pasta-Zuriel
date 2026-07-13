# Notificações gratuitas

O projeto usa apenas Firebase Authentication e Firestore no plano Spark. Não é
necessário ativar o plano Blaze, cadastrar cartão nem publicar Cloud Functions.

As notificações são registradas quando uma regente:

- define ou altera o hino e a regente de um ensaio;
- cria, atualiza ou cancela um evento;
- cria, atualiza ou remove um aviso.

## Como funciona

- Na primeira entrada, o site apresenta uma explicação com o botão **Permitir
  notificações**. A solicitação do navegador aparece somente depois desse clique.
- Com o site aberto e a permissão ativada, mudanças de ensaio, hino e evento
  aparecem somente na barra de notificações do aparelho.
- O sino e a tela do site mostram somente os avisos cadastrados na área
  **Avisos** do painel administrativo.
- Com o site fechado, as notificações de ensaios e eventos não aparecem. Os
  avisos comuns continuam disponíveis no sino quando a pessoa entrar novamente.
- O momento em que cada pessoa leu os avisos é salvo somente no aparelho dela.

Os registros usam a coleção `notices`, que já possui leitura pública e escrita
restrita aos administradores. Os avisos internos recebem o campo
`notificationOnly` e não aparecem como avisos comuns no calendário.
