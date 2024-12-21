describe('Authentication Flow', () => {
    beforeEach(() => {
      cy.visit('/login');
    });
  
    it('should successfully log in with valid credentials', () => {
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      cy.url().should('equal', Cypress.config().baseUrl + '/');
    });
  
    it('should display error message with invalid credentials', () => {
      cy.get('[data-testid="email-input"]').type('wrong@example.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-button"]').click();
      cy.get('[data-testid="error-message"]').should('be.visible');
    });
  });