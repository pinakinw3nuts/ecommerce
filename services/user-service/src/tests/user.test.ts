import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { DataSource } from 'typeorm'
import { createServer } from '../server'
import { User, UserRole, UserStatus } from '../entities'
import { createTestDataSource } from './utils/test-database'
// Create a stub function for generateToken that just returns a string
const generateToken = (_user: any) => 'test-token';
import bcrypt from 'bcryptjs'

describe('User Profile Endpoints', () => {
  let app: FastifyInstance
  let dataSource: DataSource
  let testUser: User
  let authToken: string

  beforeAll(async () => {
    // Set up test database
    dataSource = await createTestDataSource()
    app = await createServer({ dataSource })

    // Create test user
    const userRepository = dataSource.getRepository(User)
    testUser = userRepository.create({
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      phoneVerified: false,
      preferences: {
        newsletter: false,
        marketing: false
      }
    })
    await userRepository.save(testUser)

    // Generate auth token
    authToken = generateToken(testUser)
  })

  afterAll(async () => {
    await app.close()
    await dataSource.destroy()
  })

  beforeEach(async () => {
    // Reset user data before each test
    const userRepository = dataSource.getRepository(User)
    await userRepository.update(testUser.id, {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    })
  })

  describe('GET /me', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/me'
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 401 when invalid token is provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/me',
        headers: {
          Authorization: 'Bearer invalid-token'
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return user profile when valid token is provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/me',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role
      })
      expect(body).not.toHaveProperty('password')
    })
  })

  describe('PATCH /update-profile', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/update-profile',
        payload: {
          firstName: 'Updated'
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should update user firstName', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/update-profile',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        payload: {
          firstName: 'UpdatedFirst'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.firstName).toBe('UpdatedFirst')

      // Verify database update
      const userRepository = dataSource.getRepository(User)
      const updatedUser = await userRepository.findOneBy({ id: testUser.id })
      expect(updatedUser?.firstName).toBe('UpdatedFirst')
    })

    it('should update user lastName', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/update-profile',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        payload: {
          lastName: 'UpdatedLast'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.lastName).toBe('UpdatedLast')
    })

    it('should update user email', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/update-profile',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        payload: {
          email: 'updated@example.com'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.email).toBe('updated@example.com')
    })

    it('should return 400 for invalid email format', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/update-profile',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        payload: {
          email: 'invalid-email'
        }
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 when no update fields provided', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/update-profile',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        payload: {}
      })

      expect(response.statusCode).toBe(400)
    })
  })
}) 