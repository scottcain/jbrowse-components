import {
  decodeCommands,
  decodeSingleCommand,
  encodeCommand,
  readString,
  writeString,
} from './binary_command_codec'

test('readstring', () => {
  const b = new Uint8Array(10000)
  writeString('hello', b, 2)
  const [str, newOffset] = readString(b, 2)
  expect(str).toEqual('hello')
  expect(newOffset).toBe(16)
  writeString('hello', b, 1)
  writeString('bonjour', b, 28)
  const [str2, b1] = readString(b, 1)
  expect(str2).toBe('hello')
  expect(b1).toBe(14)
  const [str3, b2] = readString(b, 28)
  expect(str3).toBe('bonjour')
  expect(b2).toBe(28 + 2 + 7 * 2 + 2)
})

test('single encode and decode round trip', () => {
  const b = new Uint8Array(10000)
  encodeCommand('fillRect', [1, 2, 3, 4], b, 0)
  const decode = decodeSingleCommand(b, 0)
  expect(decode).toEqual([{ name: 'fillRect', args: [1, 2, 3, 4] }, 17])
})

test('encode more commands, including optional args', () => {
  const b = new Uint8Array(10000)
  let offset = 0
  offset = encodeCommand('fillRect', [1, 2, 3, 4], b, offset)
  encodeCommand('arc', [1, 2, 3, 4, 5, true], b, offset)
  const commands = Array.from(decodeCommands(b, 0))
  expect(commands).toEqual([
    { name: 'fillRect', args: [1, 2, 3, 4] },
    { name: 'arc', args: [1, 2, 3, 4, 5, true] },
  ])
})

test('encode more commands, one without its optional arg', () => {
  const b = new Uint8Array(10000)
  let offset = 0
  offset = encodeCommand('fillRect', [1, 2, 3, 4], b, offset)
  offset = encodeCommand('arc', [5, 6, 7, 8, 9], b, offset)
  offset = encodeCommand('save', [], b, offset)
  encodeCommand('fillRect', [-100, 200, -300, -400], b, offset)
  const commands = Array.from(decodeCommands(b, 0))
  expect(commands).toEqual([
    { name: 'fillRect', args: [1, 2, 3, 4] },
    { name: 'arc', args: [5, 6, 7, 8, 9] },
    { name: 'save', args: [] },
    { name: 'fillRect', args: [-100, 200, -300, -400] },
  ])
})

test('encode more commands, including setters', () => {
  const b = new Uint8Array(100000)
  let offset = 0
  offset = encodeCommand('fillRect', [1, 2, 3, 4], b, offset)
  offset = encodeCommand('fillStyle', ['noggin'], b, offset)
  offset = encodeCommand('fillRect', [6, 7, 8, 9], b, offset)
  offset = encodeCommand('fillStyle', [], b, offset)
  offset = encodeCommand('save', [], b, offset)
  encodeCommand('fillRect', [-100, 200, -300, -400], b, offset)
  const commands = Array.from(decodeCommands(b, 0))
  expect(commands).toEqual([
    { name: 'fillRect', args: [1, 2, 3, 4] },
    { name: 'fillStyle', args: ['noggin'] },
    { name: 'fillRect', args: [6, 7, 8, 9] },
    { name: 'fillStyle', args: [] },
    { name: 'save', args: [] },
    { name: 'fillRect', args: [-100, 200, -300, -400] },
  ])
})

test('encoding beyond end of buffer throws', () => {
  const b = new Uint8Array(3)
  expect(() => encodeCommand('fillRect', [1, 2, 3, 4], b, 0)).toThrow('bounds')
})
