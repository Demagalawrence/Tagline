import { isErrorReportingEnabled, reportError, setErrorReporter } from '@/services/errorReporting'

describe('errorReporting', () => {
  afterEach(() => {
    setErrorReporter(null)
  })

  it('reports nothing when no reporter is registered', () => {
    expect(isErrorReportingEnabled()).toBe(false)
    // Must not throw even though there is nowhere to send the error.
    expect(() => reportError(new Error('boom'), { screen: 'test' })).not.toThrow()
  })

  it('forwards errors to a registered reporter', () => {
    const reporter = jest.fn()
    setErrorReporter(reporter)
    expect(isErrorReportingEnabled()).toBe(true)

    const error = new Error('boom')
    reportError(error, { screen: 'profile' })

    expect(reporter).toHaveBeenCalledWith(error, { screen: 'profile' })
  })

  it('buffers errors reported before a reporter is registered', () => {
    const first = new Error('early one')
    const second = new Error('early two')
    reportError(first)
    reportError(second)

    const reporter = jest.fn()
    setErrorReporter(reporter)

    // A crash during startup should not be lost just because the SDK was slow
    // to initialise.
    expect(reporter).toHaveBeenCalledWith(first, undefined)
    expect(reporter).toHaveBeenCalledWith(second, undefined)
  })

  it('does not replay the buffer twice', () => {
    reportError(new Error('once'))
    const first = jest.fn()
    setErrorReporter(first)
    const second = jest.fn()
    setErrorReporter(second)

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()
  })

  it('caps the buffer so a crash loop cannot grow it without bound', () => {
    for (let i = 0; i < 60; i++) reportError(new Error(`err ${i}`))

    const reporter = jest.fn()
    setErrorReporter(reporter)
    expect(reporter.mock.calls.length).toBeLessThanOrEqual(25)
  })

  it('survives a reporter that throws', () => {
    setErrorReporter(() => {
      throw new Error('reporter is broken')
    })
    // Reporting must never take the app down with it.
    expect(() => reportError(new Error('original'))).not.toThrow()
  })

  it('survives a reporter that throws while flushing the buffer', () => {
    reportError(new Error('buffered'))
    setErrorReporter(() => {
      throw new Error('reporter is broken')
    })
    expect(isErrorReportingEnabled()).toBe(true)
  })
})
