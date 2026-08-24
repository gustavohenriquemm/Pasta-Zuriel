export function renderShirt(root) {
  root.innerHTML = `
    <section class="shirt-page shirt-static-page fade-in">
      <div class="shirt-toolbar">
        <div>
          <h1>Camisa do Congresso</h1>
          <p>Modelo oficial - Insaciáveis</p>
        </div>
      </div>

      <article class="shirt-static-card">
        <figure class="shirt-reference shirt-reference-static">
          <img src="img/camisa-congresso.png?v=20260824-2" alt="Modelo oficial da camisa do congresso Zuriel">
          <figcaption>Modelo oficial do Congresso Zuriel</figcaption>
        </figure>

        <div class="shirt-info-panel">
          <span class="shirt-tag">Congresso Zuriel</span>
          <h2>Camisa oficial Insaciáveis</h2>
          <p>As confirmações serão organizadas pelas regentes. Confira o valor e os prazos antes de enviar seu pedido.</p>

          <div class="shirt-price-box">
            <span>Valor</span>
            <strong>R$ 60,00</strong>
          </div>

          <div class="shirt-info-grid">
            <div>
              <span>Pagamento</span>
              <strong>até o 5º dia útil de setembro</strong>
            </div>
            <div>
              <span>Confirmação dos pedidos</span>
              <strong>10/09</strong>
            </div>
          </div>

          <p class="shirt-note">Quem puder realizar o pagamento antecipadamente já pode fazer. Isso ajuda na organização dos pedidos.</p>
        </div>
      </article>
    </section>
  `;
}
