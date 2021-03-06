import * as path from 'path'
import { Response } from 'puppeteer'
import { TestAPI, runBrowserWith } from '../../../support/runBrowserWith'
import { captureConsole } from '../../../support/captureConsole'

describe('API: setupWorker / start / quiet', () => {
  let test: TestAPI
  const logs: string[] = []

  beforeAll(async () => {
    test = await runBrowserWith(path.resolve(__dirname, 'quiet.mocks.ts'))

    captureConsole(test.page, logs, (message) => {
      return message.type() === 'startGroupCollapsed'
    })
  })

  afterAll(() => {
    return test.cleanup()
  })

  describe('given I start a worker with "quiet: true" option', () => {
    beforeAll(async () => {
      await test.page.evaluate(() => {
        // @ts-ignore
        return window.__MSW_REGISTRATION__
      })

      await test.reload()
    })

    it('should not print any activation message into console', () => {
      const activationMessage = logs.find((message) => {
        return message.includes('[MSW] Mocking enabled.')
      })
      expect(activationMessage).toBeFalsy()
    })

    describe('and I perform a request that should be mocked', () => {
      let res: Response

      beforeAll(async () => {
        res = await test.request({
          url: `${test.origin}/user`,
        })
      })

      it('should return the mocked response', async () => {
        const headers = res.headers()
        const body = await res.json()

        expect(headers).toHaveProperty('x-powered-by', 'msw')
        expect(body).toEqual({
          firstName: 'John',
          age: 32,
        })
      })

      it('should not print request logs into console', () => {
        const requetsLog = logs.find((message) => {
          return message.includes('[MSW]') && message.includes('GET /user')
        })
        expect(requetsLog).toBeUndefined()
      })
    })
  })
})
