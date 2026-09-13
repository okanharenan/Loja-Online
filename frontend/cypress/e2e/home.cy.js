describe("Home", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/products?*", { fixture: "products.json" }).as("listProducts");
    // A Home também busca o produto "vitrine" do banner final por slug fixo
    cy.intercept("GET", "**/api/products/nike-revolution-6", {
      fixture: "product-detail.json",
    }).as("getFeatured");
    cy.visit("/");
  });

  it("mostra o hero com o slide inicial", () => {
    cy.contains("h1", "Queima de estoque Nike").should("be.visible");
    cy.contains("a", "Ver Ofertas").should("be.visible");
  });

  it("lista os produtos em alta vindos da API", () => {
    cy.wait("@listProducts");
    cy.contains("Produtos em alta").should("be.visible");
    cy.contains("Nike Revolution 6 Next Nature").should("be.visible");
    cy.contains("Adidas Runfalcon 3.0").should("be.visible");
  });

  it("navega pra listagem ao clicar em 'Ver todos'", () => {
    cy.contains("a", "Ver todos").click();
    cy.url().should("include", "/produtos");
  });

  it("mostra o produto real no banner final, não um aleatório", () => {
    // Regressão do bug em que o banner linkava pro primeiro item de uma
    // lista com ordem instável, em vez de um produto fixo por slug.
    cy.wait("@getFeatured");
    cy.contains("Oferta especial").should("be.visible");
    cy.contains("Nike Revolution 6 Next Nature").should("be.visible");
  });
});