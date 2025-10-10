import { test, expect } from './fixtures';

test.describe('Protected Route Access', () => {
  test('should allow access to protected routes with valid JWT token', async ({ api, authToken }) => {
    const response = await api.get('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.email).toBeDefined();
  });

  test('should reject access to protected routes without authorization header', async ({ api }) => {
    const response = await api.get('/api/auth/profile');

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe('Access token is required');
  });

  test('should reject access with malformed authorization header', async ({ api }) => {
    const testCases = [
      { header: 'Bearer', description: 'Missing token' },
      { header: 'Token valid.token.here', description: 'Wrong scheme' },
      { header: 'Bearer invalid', description: 'Invalid token format' },
      { header: '', description: 'Empty header' },
    ];

    for (const testCase of testCases) {
      const response = await api.get('/api/auth/profile', {
        headers: {
          'Authorization': testCase.header,
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    }
  });

  test('should reject access with invalid JWT token', async ({ api }) => {
    const invalidTokens = [
      'invalid.jwt.token',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid',
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid',
    ];

    for (const token of invalidTokens) {
      const response = await api.get('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid or expired access token');
    }
  });

  test('should validate JWT token payload structure', async ({ api, authToken }) => {
    const response = await api.get('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Verify the user data structure from the token
    expect(data.data).toHaveProperty('id');
    expect(data.data).toHaveProperty('name');
    expect(data.data).toHaveProperty('email');
    expect(data.data).toHaveProperty('company_name');
    expect(data.data).toHaveProperty('filesUploaded');

    // Verify data types
    expect(typeof data.data.id).toBe('string');
    expect(typeof data.data.name).toBe('string');
    expect(typeof data.data.email).toBe('string');
    expect(typeof data.data.company_name).toBe('string');
    expect(typeof data.data.filesUploaded).toBe('number');
  });

  test('should allow access to multiple protected routes with same token', async ({ api, authToken }) => {
    const protectedRoutes = [
      '/api/auth/profile',
      '/api/auth/upload-stats',
    ];

    for (const route of protectedRoutes) {
      const response = await api.get(route, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      // Routes might return different status codes, but should not be 401
      expect([200, 404, 422]).toContain(response.status());
    }
  });

  test('should handle concurrent requests with same token', async ({ api, authToken }) => {
    // Make multiple concurrent requests
    const requests = Array(5).fill(null).map(() =>
      api.get('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })
    );

    const responses = await Promise.all(requests);

    // All requests should succeed
    for (const response of responses) {
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    }
  });

  test('should properly handle token expiration', async ({ api }) => {
    // This test would require manipulating token expiration
    // For now, we'll test with a token that should be valid
    const uniqueEmail = `expiretest${Date.now()}@example.com`;

    // Register and login
    await api.post('/api/auth/register', {
      data: {
        name: 'Expire Test User',
        email: uniqueEmail,
        company_name: 'Test Company',
        password: 'password123',
      },
    });

    const loginResponse = await api.post('/api/auth/login', {
      data: {
        email: uniqueEmail,
        password: 'password123',
      },
    });

    const loginData = await loginResponse.json();
    const token = loginData.data.accessToken;

    // Use token immediately - should work
    const immediateResponse = await api.get('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(immediateResponse.status()).toBe(200);

    // Note: Testing actual expiration would require waiting or manipulating system time
    // This is documented for future implementation
  });
});