import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import configSnapshot from '../../test_data/volvox/config_main_thread.json'
import { LocalFile } from 'generic-filehandle'

import { createView, generateReadBuffer, doBeforeEach } from './util'
jest.mock('../makeWorkerInstance', () => () => {})

beforeEach(() => {
  doBeforeEach()
})

const readBuffer = generateReadBuffer(
  url => new LocalFile(require.resolve(`../../test_data/volvox/${url}`)),
)

const readBuffer2 = generateReadBuffer(
  url =>
    new LocalFile(require.resolve(`../../test_data/volvoxhub/hub1/${url}`)),
)

const delay = { timeout: 40000 }
const opts = [{}, delay]
const root = 'https://jbrowse.org/volvoxhub/'

test('Open up a UCSC trackhub connection', async () => {
  const user = userEvent.setup()
  // @ts-ignore
  fetch.mockResponse(async request => {
    if (request.url.startsWith(root)) {
      const str = request.url.replace(root, '')
      // @ts-ignore
      return readBuffer2({ url: str, headers: new Map() })
    }
    return readBuffer(request)
  })

  const { findByText, findByTestId } = createView(configSnapshot)

  await user.click(await screen.findByText('File'))
  await user.click(await screen.findByText('Open connection...'))
  const elt = await screen.findByTestId('addConnectionNext', ...opts)
  await waitFor(() => expect(elt.getAttribute('disabled')).toBe(null))
  await user.click(elt)
  const input = await findByTestId('urlInput', ...opts)
  await user.clear(input)
  await user.type(input, root + 'hub.txt')
  const elt2 = await screen.findByText('Connect', ...opts)
  await waitFor(() => expect(elt2.getAttribute('disabled')).toBe(null))
  await user.click(elt2)
  await findByText('CRAM - Volvox Sorted', ...opts)
}, 80000)
