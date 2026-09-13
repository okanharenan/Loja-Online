import "./commands.js";
beforeEach(() => {
  cy.intercept("GET", "**/api/cart", { items: [], total: 0 });
  cy.intercept("GET", "**/api/wishlist", { items: [] });
});