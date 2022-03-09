//* This file contains functions for encoding and decoding canvas setters and methods using a simple binary scheme */

import {
  Call,
  CallDataType,
  isMethodCall,
  MethodName,
  methodSignatures,
  setterDataTypes,
  SetterName,
} from './types'

const setterNames = Object.keys(setterDataTypes)
const methodNames = Object.keys(methodSignatures)

const commandNames = methodNames.concat(setterNames)
if (commandNames.length > 256) {
  throw new Error(
    'too many command names, need to update this library to store the command number as bigger than a UInt8',
  )
}
const commandNumbers = new Map(
  commandNames.map((name, number) => [name, number]),
)

const commandArgSchemas: CallDataType[][] = [
  ...Object.values(methodSignatures),
  ...Object.values(setterDataTypes).map(t => [t]),
]

export function encodeCommand(
  cmdName: SetterName | MethodName,
  cmdArgs: unknown[],
  target: Buffer,
  startingOffset = 0,
) {
  const commandNumber = commandNumbers.get(cmdName)
  let offset = startingOffset
  if (commandNumber !== undefined) {
    offset = target.writeUInt8(commandNumber, offset)
    const schema = commandArgSchemas[commandNumber]
    let i = 0
    for (; i < schema.length; i++) {
      // bare for loop is a tiny bit faster than foreach
      const type = schema[i]
      if (type === CallDataType.FLOAT) {
        offset = target.writeFloatLE(cmdArgs[i] as number, offset)
      } else if (type === CallDataType.STRING) {
        offset += target.write(cmdArgs[i] as string, offset, 'utf-8')
      } else if (type === CallDataType.FOLLOWING_ARGUMENTS_OPTIONAL) {
        const numArgumentsRemaining = cmdArgs.length - i - 1
        offset = target.writeUInt8(numArgumentsRemaining, offset)
      } else if (type === CallDataType.BOOL) {
        offset = target.writeUInt8(Boolean(cmdArgs[i]) ? 1 : 0)
      } else {
        throw new Error('unsupported argument data type ' + type)
      }
    }
    if (i < cmdArgs.length) {
      throw new Error(
        'OffscreenCanvas shim does not support this calling signature for method "' +
          cmdName +
          '"',
      )
    }
  } else {
    throw new Error(
      'OffscreenCanvas shim does not support method or setter "' +
        cmdName +
        '"',
    )
  }

  return offset
}

export function replayCommandsOntoContext(
  targetContext: CanvasRenderingContext2D,
  encodedCommands: Buffer,
  startingOffset = 0,
) {
  let offset = startingOffset
  while (offset < encodedCommands.length) {
    offset = replaySingleCommand(targetContext, encodedCommands, offset)
  }
}

/** decode all the commands in the buffer, starting at the given offset */
export function* decodeCommands(encodedCommands: Buffer, startingOffset = 0) {
  let offset = startingOffset
  while (offset < encodedCommands.length) {
    const [command, newOffset] = decodeSingleCommand(encodedCommands, offset)
    offset = newOffset
    yield command
  }
}

/** decode a single canvas command from the buffer starting at the given offset */
export function decodeSingleCommand(
  encodedCommands: Buffer,
  startingOffset = 0,
): [Call, number] {
  let offset = startingOffset
  const commandNumber = encodedCommands.readUInt8(offset)
  offset += 1
  const commandSchema = commandArgSchemas[commandNumber]
  if (!commandSchema) {
    throw new Error('unknown command number ' + commandNumber)
  }
  const decodedArgs = []
  let numArgs = commandSchema.length
  for (let i = 0; i < numArgs; i++) {
    const argType = commandSchema[i]
    if (argType === CallDataType.FLOAT) {
      decodedArgs.push(encodedCommands.readFloatLE(offset))
      offset += 4
    } else if (argType === CallDataType.STRING) {
      let v: string
      ;[v, offset] = readString(encodedCommands, offset, 'utf8')
      decodedArgs.push(v)
    } else if (argType === CallDataType.FOLLOWING_ARGUMENTS_OPTIONAL) {
      const numArgumentsRemaining = encodedCommands.readUInt8(offset)
      numArgs = i + numArgumentsRemaining + 1
      offset += 1
    } else if (argType === CallDataType.BOOL) {
      decodedArgs.push(Boolean(encodedCommands.readUInt8(offset)))
      offset += 1
    } else {
      throw new Error('unknown argType ' + argType)
    }
  }

  const commandName = commandNames[commandNumber]
  return [{ name: commandName, args: decodedArgs }, offset]
}

function replaySingleCommand(
  targetContext: CanvasRenderingContext2D,
  encodedCommands: Buffer,
  startingOffset = 0,
) {
  const [command, offset] = decodeSingleCommand(encodedCommands, startingOffset)

  if (isMethodCall(command)) {
    // @ts-ignore
    // eslint-disable-next-line prefer-spread
    targetContext[command.name].apply(targetContext, command.args)
  } else {
    // @ts-ignore
    targetContext[command.name] = command.args[0]
  }

  return offset
}

/** read a zero-terminated string from a buffer at the given offset
 * @returns [string read, new offset after string]
 */
export function readString(
  buffer: Buffer,
  offset: number,
  encoding?: Parameters<Buffer['toString']>[0],
): [string, number] {
  let stringEnd = offset
  while (buffer[stringEnd]) {
    stringEnd += 1
  }
  return [buffer.subarray(offset, stringEnd).toString(encoding), stringEnd + 1]
}
