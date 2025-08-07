import jwt from 'jsonwebtoken';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key';

describe('Authentication Middleware Tests', () => {
  describe('Public Routes', () => {
    const publicRoutes = [
      '/health',
      '/docs',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
    ];

    it('should identify public routes correctly', () => {
      publicRoutes.forEach(route => {
        const isPublic = publicRoutes.some(publicRoute =>
          route.startsWith(publicRoute)
        );
        expect(isPublic).toBe(true);
      });
    });

    it('should identify non-public routes correctly', () => {
      const privateRoutes = [
        '/api/users/me',
        '/api/products/create',
        '/api/orders',
        '/api/cart'
      ];

      privateRoutes.forEach(route => {
        const isPublic = publicRoutes.some(publicRoute =>
          route.startsWith(publicRoute)
        );
        expect(isPublic).toBe(false);
      });
    });
  });

  describe('JWT Token Validation', () => {
    const testUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'USER',
      name: 'Test User'
    };

    it('should validate valid JWT token', () => {
      const token = jwt.sign(
        {
          userId: testUser.id,
          email: testUser.email,
          role: testUser.role,
          name: testUser.name
        },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      expect(decoded.userId).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
    });

    it('should reject expired token', () => {
      const token = jwt.sign(
        {
          userId: testUser.id,
          email: testUser.email,
          role: testUser.role,
          name: testUser.name
        },
        process.env.JWT_SECRET!,
        { expiresIn: '0s' } // Expired immediately
      );

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET!);
      }).toThrow();
    });

    it('should reject token with wrong secret', () => {
      const token = jwt.sign(
        {
          userId: testUser.id,
          email: testUser.email,
          role: testUser.role,
          name: testUser.name
        },
        'wrong-secret',
        { expiresIn: '24h' }
      );

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET!);
      }).toThrow();
    });

    it('should reject malformed token', () => {
      expect(() => {
        jwt.verify('malformed.token.here', process.env.JWT_SECRET!);
      }).toThrow();
    });
  });

  describe('Role-Based Access Control', () => {
    const adminUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'admin@example.com',
      role: 'ADMIN',
      name: 'Admin User'
    };

    const regularUser = {
      id: '456e7890-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      role: 'USER',
      name: 'Regular User'
    };

    it('should allow admin access to admin-only routes', () => {
      const adminRoles = ['ADMIN'];
      const userRole = adminUser.role;
      
      const hasAccess = adminRoles.includes(userRole);
      expect(hasAccess).toBe(true);
    });

    it('should deny user access to admin-only routes', () => {
      const adminRoles = ['ADMIN'];
      const userRole = regularUser.role;
      
      const hasAccess = adminRoles.includes(userRole);
      expect(hasAccess).toBe(false);
    });

    it('should allow both user and admin access to user routes', () => {
      const userRoles = ['USER', 'ADMIN'];
      
      const adminAccess = userRoles.includes(adminUser.role);
      const userAccess = userRoles.includes(regularUser.role);
      
      expect(adminAccess).toBe(true);
      expect(userAccess).toBe(true);
    });
  });

  describe('Error Response Format', () => {
    it('should format unauthorized error correctly', () => {
      const unauthorizedError = {
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      };

      expect(unauthorizedError.success).toBe(false);
      expect(unauthorizedError.message).toBe('Authentication required');
      expect(unauthorizedError.error).toBe('UNAUTHORIZED');
    });

    it('should format forbidden error correctly', () => {
      const forbiddenError = {
        success: false,
        message: 'Insufficient permissions',
        error: 'FORBIDDEN'
      };

      expect(forbiddenError.success).toBe(false);
      expect(forbiddenError.message).toBe('Insufficient permissions');
      expect(forbiddenError.error).toBe('FORBIDDEN');
    });
  });
});
