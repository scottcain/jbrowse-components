import { fireEvent, waitFor } from '@testing-library/react'

// locals
import { setup, expectCanvasMatch, doBeforeEach, createView, hts } from './util'

setup()

beforeEach(() => {
  doBeforeEach()
})

async function wait(view: any) {
  await waitFor(
    () => expect(view.tracks[0].displays[0].PileupDisplay.drawn).toBe(true),
    delay,
  )
}
const delay = { timeout: 20000 }
const opts = [{}, delay]

test('toggle short-read arc display, in-view arcs', async () => {
  const { view, findByTestId, findAllByText, findByText } = createView()
  await findByText('Help')
  await view.navToLocString('ctgA:1-50000')
  fireEvent.click(await findByTestId(hts('volvox_sv_cram'), ...opts))
  fireEvent.click(await findByTestId('track_menu_icon', ...opts))
  fireEvent.click(await findByText('Replace lower panel with...'))
  fireEvent.click((await findAllByText('Arc display'))[0])
  await wait(view)
  expectCanvasMatch(await findByTestId('Arc-display', ...opts), 0)
}, 30000)

test('toggle short-read cloud display', async () => {
  const { view, findByTestId, findAllByText, findByText } = createView()
  await findByText('Help')
  await view.navToLocString('ctgA:1-50000')
  fireEvent.click(await findByTestId(hts('volvox_sv_cram'), ...opts))
  fireEvent.click(await findByTestId('track_menu_icon', ...opts))
  fireEvent.click(await findByText('Replace lower panel with...'))
  fireEvent.click((await findAllByText('Read cloud display'))[0])
  await wait(view)
  expectCanvasMatch(await findByTestId('ReadCloud-display', ...opts), 0)
}, 30000)

test('toggle long-read cloud display', async () => {
  const { view, findByTestId, findAllByText, findByText } = createView()
  await findByText('Help')
  await view.navToLocString('ctgA:19,101..32,027')
  fireEvent.click(await findByTestId(hts('volvox-simple-inv.bam'), ...opts))
  fireEvent.click(await findByTestId('track_menu_icon', ...opts))
  fireEvent.click(await findByText('Replace lower panel with...'))
  fireEvent.click((await findAllByText('Read cloud display'))[0])
  await wait(view)
  expectCanvasMatch(await findByTestId('ReadCloud-display', ...opts), 0)
}, 30000)

test('toggle long-read arc display, in-view arcs', async () => {
  const { view, findByTestId, findAllByText, findByText } = createView()
  await findByText('Help')
  await view.navToLocString('ctgA:19,101..32,027')
  fireEvent.click(await findByTestId(hts('volvox-simple-inv.bam'), ...opts))
  fireEvent.click(await findByTestId('track_menu_icon', ...opts))
  fireEvent.click(await findByText('Replace lower panel with...'))
  fireEvent.click((await findAllByText('Arc display'))[0])
  await wait(view)
  expectCanvasMatch(await findByTestId('Arc-display', ...opts), 0)
}, 30000)

test('toggle long-read arc display, use out of view pairing', async () => {
  const { view, findByTestId, findAllByText, findByText } = createView()
  await findByText('Help')
  await view.navToLocString('ctgA:478..6,191')
  fireEvent.click(await findByTestId(hts('volvox-long-reads-sv-cram'), ...opts))
  fireEvent.click(await findByTestId('track_menu_icon', ...opts))
  fireEvent.click(await findByText('Replace lower panel with...'))
  fireEvent.click((await findAllByText('Arc display'))[0])
  await wait(view)
  expectCanvasMatch(await findByTestId('Arc-display', ...opts), 0)
}, 30000)

test('toggle short-read arc display, use out of view pairing', async () => {
  const { view, findByTestId, findAllByText, findByText } = createView()
  await findByText('Help')
  await view.navToLocString('ctgA:478..6,191')
  fireEvent.click(await findByTestId(hts('volvox_sv_cram'), ...opts))
  fireEvent.click(await findByTestId('track_menu_icon', ...opts))
  fireEvent.click(await findByText('Replace lower panel with...'))
  fireEvent.click((await findAllByText('Arc display'))[0])
  await wait(view)
  expectCanvasMatch(await findByTestId('Arc-display', ...opts), 0)
}, 30000)
