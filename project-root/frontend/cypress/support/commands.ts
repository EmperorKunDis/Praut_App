Cypress.Commands.add('login', () => {
    cy.request('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    }).then((response) => {
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          token: response.body.token,
          user: response.body.user,
          isAuthenticated: true
        }
      }));
    });
  });