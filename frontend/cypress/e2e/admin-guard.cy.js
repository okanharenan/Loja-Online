describe("Proteção do painel admin", () => {
  it("usuário comum é redirecionado pra Home ao tentar acessar /admin/produtos", () => {
    cy.intercept("GET", "**/api/products?*", { fixture: "products.json" });
    cy.fixture("user.json").then((user) => {
      cy.visitAsUser("/admin/produtos", user);
    });

    cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
    cy.contains("Gerenciar produtos").should("not.exist");
  });

  it("visitante sem login é redirecionado pra tela de entrar", () => {
    cy.visit("/admin/produtos");
    cy.url().should("include", "/entrar");
  });

  it("admin consegue acessar o painel normalmente", () => {
    cy.intercept("GET", "**/api/products?*", { fixture: "products.json" }).as("listProducts");
    cy.fixture("admin.json").then((admin) => {
      cy.visitAsUser("/admin/produtos", admin);
    });

    cy.wait("@listProducts");
    cy.contains("h1", "Gerenciar produtos").should("be.visible");
    cy.contains("Nike Revolution 6 Next Nature").should("be.visible");
  });
});