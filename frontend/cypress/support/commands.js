Cypress.Commands.add("visitAsUser", (path, user) => {
  cy.intercept("GET", "**/api/auth/me", { user }).as("me");
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem("token", "fake-jwt-token");
    },
  });
  cy.wait("@me");
});