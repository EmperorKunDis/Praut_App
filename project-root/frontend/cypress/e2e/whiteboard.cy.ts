describe('Whiteboard Features', () => {
    beforeEach(() => {
      cy.login(); // Custom command
      cy.visit('/whiteboard');
    });
  
    it('should allow drawing on canvas', () => {
      cy.get('canvas').then($canvas => {
        const canvas = $canvas[0];
        const rect = canvas.getBoundingClientRect();
        
        cy.wrap($canvas)
          .trigger('mousedown', { clientX: rect.left + 100, clientY: rect.top + 100 })
          .trigger('mousemove', { clientX: rect.left + 200, clientY: rect.top + 200 })
          .trigger('mouseup');
      });
    });
  });