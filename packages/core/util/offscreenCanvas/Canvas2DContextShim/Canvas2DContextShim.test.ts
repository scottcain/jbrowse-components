import Canvas2DContextShim from '.'
import { Call } from './types'


test('serialize a single command and read back out', () => {
  const ctx = new Canvas2DContextShim(100, 100)
  ctx.fillRect(20, 20, 20, 20)
  const cmds: Call[] = []
  expect(cmds).toEqual([{ type: 'fillRect', args: [20, 20, 20, 20] }])
})
