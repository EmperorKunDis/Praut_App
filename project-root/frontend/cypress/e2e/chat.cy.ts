describe('Chat Functionality', () => {
    beforeEach(() => {
      cy.login();
      cy.visit('/chat');
    });
  
    it('should send and receive messages', () => {
      const testMessage = 'Hello, this is a test message';
      cy.get('[data-testid="message-input"]').type(testMessage);
      cy.get('[data-testid="send-button"]').click();
      cy.get('[data-testid="message-list"]').should('contain', testMessage);
    });
  });