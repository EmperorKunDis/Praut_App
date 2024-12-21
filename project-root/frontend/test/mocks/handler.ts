import { rest } from 'msw';

export const handlers = [
  rest.post('*/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'user'
        },
        token: 'mock-jwt-token'
      })
    );
  }),

  rest.get('*/api/whiteboards/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: req.params.id,
        name: 'Test Whiteboard',
        elements: []
      })
    );
  }),

  rest.get('*/api/chat/messages', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          content: 'Hello',
          sender: '1',
          timestamp: new Date().toISOString()
        }
      ])
    );
  })
];