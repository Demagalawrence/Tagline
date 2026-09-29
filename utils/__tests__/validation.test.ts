import {
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
} from '@/utils/validation'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'jane@example.com', password: 'secret123' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email and a short password', () => {
    const result = loginSchema.safeParse({ email: 'nope', password: '123' })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('requires an international phone number', () => {
    const local = registerSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '0700123456',
      password: 'secret123',
    })
    expect(local.success).toBe(false)

    const international = registerSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+256700123456',
      password: 'secret123',
    })
    expect(international.success).toBe(true)
  })
})

describe('forgotPasswordSchema', () => {
  it('rejects a non-email input', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'not-an-email' })
    expect(result.success).toBe(false)
  })
})

describe('profileSchema', () => {
  it('accepts a complete profile with an empty optional email', () => {
    const result = profileSchema.safeParse({
      name: 'Jane Doe',
      phone: '+256700111111',
      whatsapp: '+256700111111',
      bio: 'Hello there',
      email: '',
      title: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a bio over 120 characters', () => {
    const result = profileSchema.safeParse({
      name: 'Jane Doe',
      phone: '+256700111111',
      whatsapp: '+256700111111',
      bio: 'x'.repeat(121),
    })
    expect(result.success).toBe(false)
  })
})
