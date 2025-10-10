import { test, expect } from './fixtures';

test.describe('Login & Authentication', () => {
  test('should successfully login with valid credentials', async ({ api, testUser, authToken }) => {
    // The authToken fixture already handles login, so we verify it worked
    expect(authToken).toBeDefined();
    expect(typeof authToken).toBe('string');
    expect(authToken.length).toBeGreaterThan(0);

    // Verify token format (JWT has 3 parts separated by dots)
    const parts = authToken.split('.');
    expect(parts).toHaveLength(3);
  });

  test('should return proper response structure on successful login', async ({ api }) => {
    const uniqueEmail = `login${Date.now()}@example.com`;

    // First register
    await api.post('/api/auth/register', {
      data: {
        name: 'Login Test User',
        email: uniqueEmail,
        company_name: 'Test Company',
        password: 'password123',
      },
    });

    // Then login
    const loginResponse = await api.post('/api/auth/login', {
      data: {
        email: uniqueEmail,
        password: 'password123',
      },
    });

    expect(loginResponse.status()).toBe(200);
    const data = await loginResponse.json();

    expect(data.success).toBe(true);
    expect(data.message).toBe('Login successful');
    expect(data.data).toBeDefined();
    expect(data.data.accessToken).toBeDefined();
    expect(data.data.user).toBeDefined();
    expect(data.data.user.email).toBe(uniqueEmail);
  });

  test('should reject login with invalid email', async ({ api }) => {
    const response = await api.post('/api/auth/login', {
      data: {
        email: 'nonexistent@example.com',
        password: 'password123',
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid credentials');
  });

  test('should reject login with wrong password', async ({ api }) => {
    const uniqueEmail = `wrongpass${Date.now()}@example.com`;

    // Register user first
    await api.post('/api/auth/register', {
      data: {
        name: 'Wrong Pass User',
        email: uniqueEmail,
        company_name: 'Test Company',
        password: 'correctpassword',
      },
    });

    // Try login with wrong password
    const response = await api.post('/api/auth/login', {
      data: {
        email: uniqueEmail,
        password: 'wrongpassword',
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid credentials');
  });

  test('should reject login with missing email', async ({ api }) => {
    const response = await api.post('/api/auth/login', {
      data: {
        password: 'password123',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe('Validation Error');
    expect(data.error).toBe('Email and password are required');
  });

  test('should reject login with missing password', async ({ api }) => {
    const response = await api.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe('Validation Error');
    expect(data.error).toBe('Email and password are required');
  });

  test('should generate valid JWT token on login', async ({ api }) => {
    const uniqueEmail = `jwttest${Date.now()}@example.com`;

    // Register
    await api.post('/api/auth/register', {
      data: {
        name: 'JWT Test User',
        email: uniqueEmail,
        company_name: 'Test Company',
        password: 'password123',
      },
    });

    // Login
    const loginResponse = await api.post('/api/auth/login', {
      data: {
        email: uniqueEmail,
        password: 'password123',
      },
    });

    const loginData = await loginResponse.json();
    const token = loginData.data.accessToken;

    // Verify token can be used for authenticated requests
    const profileResponse = await api.get('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(profileResponse.ok()).toBe(true);
  });

  test('should handle multiple login attempts', async ({ api }) => {
    const uniqueEmail = `multilogin${Date.now()}@example.com`;

    // Register
    await api.post('/api/auth/register', {
      data: {
        name: 'Multi Login User',
        email: uniqueEmail,
        company_name: 'Test Company',
        password: 'password123',
      },
    });

    // Multiple login attempts should all succeed
    for (let i = 0; i < 3; i++) {
      const response = await api.post('/api/auth/login', {
        data: {
          email: uniqueEmail,
          password: 'password123',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.accessToken).toBeDefined();
    }
  });
});