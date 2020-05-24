import timeFrameMultiplier from '../../portara/timeFrameMultiplier';

describe('Rate Limiter accepts various timeframe values', () => {
  it('returns an error when input value is not recognized', () => {
    const timeFrame = timeFrameMultiplier('years')
    expect(timeFrame).toBeInstanceOf(Error)
  })


  it('defaults to 1 second when value is an empty string or undefined', () => {
    const timeFrame = timeFrameMultiplier(undefined || '')
    expect(timeFrame).toEqual(1000)
  })

  it('converts hours into milliseconds if the input is hours', () => {
    const timeFrame = timeFrameMultiplier('hours')
    expect(timeFrame).toEqual(3600000)
  })

  it('converts days into milliseconds if the input is days', () => {
    const timeFrame = timeFrameMultiplier('days')
    expect(timeFrame).toEqual(86400000)

  })
})