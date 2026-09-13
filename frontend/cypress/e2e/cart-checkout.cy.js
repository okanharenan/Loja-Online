describe("Carrinho", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/cart", { fixture: "cart.json" }).as("getCart");
    cy.fixture("user.json").then((user) => {
      cy.visitAsUser("/carrinho", user);
    });
    cy.wait("@getCart");
  });

  it("mostra os itens do carrinho e o total vindo da API", () => {
    cy.contains("Nike Revolution 6 Next Nature").should("be.visible");
    cy.contains("R$ 219,00").should("be.visible");
  });

  it("não deixa digitar quantidade maior que o estoque disponível", () => {
    // fixture tem stock: 12 — tentar 999 deve ser limitado no próprio campo
    cy.intercept("PUT", "**/api/cart/item1", { statusCode: 200, body: {} }).as("updateItem");
    cy.get("input[type=number]").clear().type("999");
    cy.wait("@updateItem").its("request.body.quantity").should("eq", 12);
  });

  it("cria o pedido e inicia o checkout de pagamento ao finalizar", () => {
    cy.intercept("POST", "**/api/orders", {
      statusCode: 201,
      body: { order: { id: "order-1", status: "PENDING", total: 219 } },
    }).as("createOrder");
    cy.intercept("POST", "**/api/orders/order-1/payment", {
      checkoutUrl: "https://checkout.stripe.com/pay/cs_test_fake",
    }).as("createPayment");

    cy.contains("button", "Finalizar pedido").click();

    cy.wait("@createOrder");
    cy.wait("@createPayment");
  
  });
});