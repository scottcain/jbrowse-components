import { decodeSingleCommand, encodeCommand, readString } from './command_codec'

test('readstring', () => {
  const b = Buffer.alloc(100)
  b.write('hello', 20)
  const [str, newOffset] = readString(b, 20)
  expect(str).toEqual('hello')
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
  const [decodedCommand, byteSize] = decodeSingleCommand(b, 0)
  expect(decodedCommand).toEqual({ name: 'fillRect', args: [1, 2, 3, 4] })
  expect(byteSize).toEqual(17)
})

test('encoding beyond end of buffer throws', () => {
  const b = Buffer.alloc(3)
  const command = { name: 'fillRect', args: [1, 2, 3, 4] }
  expect(() => encodeCommand(command, b, 0)).toThrow('bounds')
})
