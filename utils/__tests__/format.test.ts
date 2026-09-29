import { formatCountdown, greetingForHour, timeAgo } from '@/utils/format'

describe('formatCountdown', () => {
  it('pads and splits minutes and seconds', () => {
    expect(formatCountdown(0)).toBe('00:00')
    expect(formatCountdown(65)).toBe('01:05')
    expect(formatCountdown(900)).toBe('15:00')
    expect(formatCountdown(9)).toBe('00:09')
  })
})

describe('greetingForHour', () => {
  it('greets by time of day', () => {
    expect(greetingForHour(3)).toBe('Good night')
    expect(greetingForHour(9)).toBe('Good morning')
    expect(greetingForHour(14)).toBe('Good afternoon')
    expect(greetingForHour(19)).toBe('Good evening')
    expect(greetingForHour(23)).toBe('Good night')
  })
})

describe('timeAgo', () => {
  const now = Date.now()

  it('describes recent timestamps in minutes', () => {
    expect(timeAgo(new Date(now - 30_000).toISOString())).toBe('Just now')
    expect(timeAgo(new Date(now - 5 * 60_000).toISOString())).toBe('5m ago')
  })

  it('describes older timestamps in hours and days', () => {
    expect(timeAgo(new Date(now - 3 * 3_600_000).toISOString())).toBe('3h ago')
    expect(timeAgo(new Date(now - 2 * 86_400_000).toISOString())).toBe('2d ago')
  })
})
