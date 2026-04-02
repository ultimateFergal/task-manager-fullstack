import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/register/route'

vi.mock('@/lib/auth-utils', () => ({
  createUser: vi.fn(),
}))

describe('POST /api/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 201 and user data on success', async () => {
    const { createUser } = await import('@/lib/auth-utils')
    vi.mocked(createUser).mockResolvedValue({
      id: 'new-uuid',
      email: 'test@example.com',
      name: 'Test User',
    })

    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'password123' }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.email).toBe('test@example.com')
    expect(data.name).toBe('Test User')
    expect(data).not.toHaveProperty('password')
  })

  it('returns 400 when name is missing', async () => {
    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({ name: '', email: 'test@example.com', password: 'password123' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBeTruthy()
  })

  it('returns 400 when password is too short', async () => {
    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'test@example.com', password: 'short' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toMatch(/8 caracteres/)
  })

  it('returns 409 when email is already registered', async () => {
    const { createUser } = await import('@/lib/auth-utils')
    vi.mocked(createUser).mockResolvedValue(null)

    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'existing@example.com', password: 'password123' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(409)
  })

  it('returns 500 on unexpected error', async () => {
    const { createUser } = await import('@/lib/auth-utils')
    vi.mocked(createUser).mockRejectedValue(new Error('DB error'))

    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'test@example.com', password: 'password123' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(500)
  })
})
