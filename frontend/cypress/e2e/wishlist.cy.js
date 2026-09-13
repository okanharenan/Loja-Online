describe("Favoritar produto", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/products/nike-revolution-6", {
      fixture: "product-detail.json",
    }).as("getProduct");
    cy.intercept("GET", "**/api/products?*", { fixture: "products.json" });
  });

  it("visitante que tenta favoritar é levado pra tela de login", () => {
    cy.visit("/produto/nike-revolution-6");
    cy.wait("@getProduct");

    cy.get('button[aria-label="Adicionar aos favoritos"]').click();

    cy.url().should("include", "/entrar");
  });

  it("usuário logado consegue favoritar o produto", () => {
    cy.intercept("GET", "**/api/wishlist", { items: [] }).as("getWishlist");
    cy.intercept("POST", "**/api/wishlist", {
      statusCode: 201,
      body: { item: { id: "w1", productId: "9f000000-0000-0000-0000-000000000001" } },
    }).as("addWishlist");

    cy.fixture("user.json").then((user) => {
      cy.visitAsUser("/produto/nike-revolution-6", user);
    });
    cy.wait("@getProduct");
    cy.wait("@getWishlist");

    cy.get('button[aria-label="Adicionar aos favoritos"]').click();

    cy.wait("@addWishlist")
      .its("request.body")
      .should("deep.equal", { productId: "9f000000-0000-0000-0000-000000000001" });

    cy.get('button[aria-label="Remover dos favoritos"]').should("be.visible");
  });
});