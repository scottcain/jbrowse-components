import {
  decodeCommands,
  decodeSingleCommand,
  encodeCommand,
  readString,
} from './command_codec'

test('readstring', () => {
  const b = Buffer.alloc(100)
  b.write('hello', 20)
  const [str, newOffset] = readString(b, 20)
  expect(str).toEqual('hello')
  expect(newOffset).toBe(26)
  b.write('hello', 0)
  //       012345
  b.write('bonjour', 6)
  //       67890123
  const [str2, b1] = readString(b, 0)
  expect(str2).toBe('hello')
  expect(b1).toBe(6)
  const [str3, b2] = readString(b, 6)
  expect(str3).toBe('bonjour')
  expect(b2).toBe(14)
})

test('single encode and decode round trip', () => {
  const b = Buffer.alloc(100)
  encodeCommand('fillRect', [1, 2, 3, 4], b, 0)
  const decode = decodeSingleCommand(b, 0)
  expect(decode).toEqual([{ name: 'fillRect', args: [1, 2, 3, 4] }, 17])
})

test('encode more commands, including optional args', () => {
  const b = Buffer.alloc(10000)
  let offset = 0
  offset = encodeCommand('fillRect', [1, 2, 3, 4], b, offset)
  encodeCommand('arc', [1, 2, 3, 4, true], b, offset)
  const commands = Array.from(decodeCommands(b, 0))
  expect(commands).toEqual([
    { name: 'fillRect', args: [1, 2, 3, 4] },
    { name: 'arc', args: [1, 2, 3, 4, true] },
  ])
})

test('encode more commands, one without its optional arg', () => {
  const b = Buffer.alloc(10000)
  let offset = 0
  offset = encodeCommand('fillRect', [1, 2, 3, 4], b, offset)
  offset = encodeCommand('arc', [5, 6, 7, 8], b, offset)
  offset = encodeCommand('save', [], b, offset)
  offset = encodeCommand('fillRect', [-100, 200, -300, -400], b, offset)
  const commands = Array.from(decodeCommands(b, 0))
  expect(commands).toEqual([
    { name: 'fillRect', args: [1, 2, 3, 4] },
    { name: 'arc', args: [5, 6, 7, 8] },
    { name: 'save', args: [] },
    { name: 'fillRect', args: [-100, 200, -300, -400] },
  ])
})

test('encoding beyond end of buffer throws', () => {
  const b = Buffer.alloc(3)
  expect(() => encodeCommand('fillRect', [1, 2, 3, 4], b, 0)).toThrow('bounds')
})
