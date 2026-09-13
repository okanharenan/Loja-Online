describe("Listagem de produtos", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/products?*", { fixture: "products.json" }).as("listProducts");
    cy.visit("/produtos");
    cy.wait("@listProducts");
  });

  it("mostra o total de produtos vindo da API", () => {
    cy.contains("2 produtos").should("be.visible");
  });

  it("filtra por marca e refaz a busca com o parâmetro certo", () => {
    cy.intercept("GET", "**/api/products?*brand=Nike*", {
      fixture: "products.json",
    }).as("filterByBrand");

    cy.contains("label", "Nike").click();

    cy.wait("@filterByBrand")
      .its("request.url")
      .should("include", "brand=Nike");
  });

  it("mostra estado vazio quando a API não retorna nenhum produto", () => {
    cy.intercept("GET", "**/api/products?*", {
      products: [],
      meta: { page: 1, limit: 12, total: 0, totalPages: 1 },
    }).as("emptyList");

    cy.contains("label", "Puma").click();

    cy.wait("@emptyList");
    cy.contains("Nenhum produto encontrado").should("be.visible");
  });
});