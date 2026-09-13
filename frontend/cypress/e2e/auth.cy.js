describe("Login", () => {
  beforeEach(() => {
    cy.visit("/entrar");
  });

  it("mostra o link de recuperação de senha", () => {
    cy.contains("a", "Esqueci minha senha")
      .should("have.attr", "href", "/esqueci-senha");
  });

  it("mostra erro quando as credenciais estão erradas", () => {
    cy.intercept("POST", "**/api/auth/login", {
      statusCode: 401,
      body: { error: "E-mail ou senha inválidos" },
    }).as("loginFail");

    cy.get("input[type=email]").type("ana@teste.com");
    cy.get("input[type=password]").type("senha-errada");
    cy.contains("button", "Entrar").click();

    cy.wait("@loginFail");
    cy.contains("E-mail ou senha inválidos").should("be.visible");
  });

  it("loga com sucesso e mostra o nome do usuário no header", () => {
    cy.intercept("POST", "**/api/auth/login", {
      user: { id: "u1", name: "Ana Teste", email: "ana@teste.com", role: "CUSTOMER" },
      token: "fake-jwt-token",
    }).as("loginOk");
    cy.intercept("GET", "**/api/wishlist", { items: [] });

    cy.get("input[type=email]").type("ana@teste.com");
    cy.get("input[type=password]").type("senha-certa");
    cy.contains("button", "Entrar").click();

    cy.wait("@loginOk");
    cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
    cy.contains("Olá, Ana").should("be.visible");
  });
});