//* This file contains functions for encoding and decoding canvas setters and methods using a simple binary scheme */

import {
  Call,
  CallSchemaField,
  isMethodCall,
  MethodName,
  methodSignatures,
  setterDataTypes,
  SetterName,
} from './types'

const END_STREAM: unique symbol = Symbol('command_stream_end')

const setterNames = Object.keys(setterDataTypes)
const methodNames = Object.keys(methodSignatures)

const commandNames = [undefined, ...methodNames, ...setterNames]
if (commandNames.length > 256) {
  throw new Error(
    'too many command names, need to update this library to store the command number as bigger than a UInt8',
  )
}
const commandNumbers = new Map(
  commandNames.map((name, number) => [name, number]),
)

function isStreamEnd(thing: unknown): thing is typeof END_STREAM {
  return thing === END_STREAM
}

/** mapping of command number to command schema */
const commandArgSchemas: (CallSchemaField[] | typeof END_STREAM)[] = [
  END_STREAM,
  ...Object.values(methodSignatures),
  ...Object.values(setterDataTypes),
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
    if (isStreamEnd(schema)) {
      throw new Error('cannot encode a command for stream end')
    }
    let schemaI = 0
    let argsI = 0
    for (; argsI < cmdArgs.length; argsI++) {
      const type = schema[schemaI++]
      if (type === CallSchemaField.FLOAT) {
        offset = target.writeFloatLE(cmdArgs[argsI] as number, offset)
      } else if (type === CallSchemaField.STRING) {
        offset += target.write(cmdArgs[argsI] as string, offset, 'utf-8')
        offset = target.writeUInt8(0, offset) // write a trailing zero for the string
      } else if (type === CallSchemaField.FOLLOWING_ARGUMENTS_OPTIONAL) {
        const numArgumentsRemaining = cmdArgs.length - schemaI + 1
        offset = target.writeUInt8(numArgumentsRemaining, offset)
        argsI -= 1
      } else if (type === CallSchemaField.BOOL) {
        offset = target.writeUInt8(Boolean(cmdArgs[argsI]) ? 1 : 0, offset)
      } else {
        throw new Error('unsupported argument data type ' + type)
      }
    }

    // if there are no optional arguments, we may not have written the optional-args
    // count when looping through the args, so write it
    if (schemaI < schema.length) {
      // in this case the next thing in the schema better be the optional marker or something is wrong
      const type = schema[schemaI]
      if (type !== CallSchemaField.FOLLOWING_ARGUMENTS_OPTIONAL) {
        throw new Error(
          'OffscreenCanvas shim does not support this calling signature for method "' +
            cmdName +
            '"',
        )
      }
      // write that are no optional arguments remaining
      offset = target.writeUInt8(0, offset)
    }

    if (argsI < cmdArgs.length) {
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
  let offset: number | undefined = startingOffset
  while (offset !== undefined && offset < encodedCommands.length) {
    offset = replaySingleCommand(targetContext, encodedCommands, offset)
  }
}

/** decode all the commands in the buffer, starting at the given offset */
export function* decodeCommands(encodedCommands: Buffer, startingOffset = 0) {
  let offset = startingOffset
  while (offset < encodedCommands.length) {
    const decode = decodeSingleCommand(encodedCommands, offset)
    if (!decode) {
      return
    }
    offset = decode[1]
    yield decode[0]
  }
}

/**
 * decode a single canvas command from the buffer starting at the
 * given offset, returns undefined if no more commands
 */
export function decodeSingleCommand(
  encodedCommands: Buffer,
  startingOffset = 0,
): [Call, number] | undefined {
  let offset = startingOffset
  const commandNumber = encodedCommands.readUInt8(offset)
  offset += 1
  const commandSchema = commandArgSchemas[commandNumber]
  if (!commandSchema) {
    throw new Error('unknown command number ' + commandNumber)
  }
  if (commandSchema === END_STREAM) {
    return undefined
  }
  const decodedArgs = []
  let numArgs = commandSchema.length
  for (let i = 0; i < numArgs; i++) {
    const argType = commandSchema[i]
    if (argType === CallSchemaField.FLOAT) {
      decodedArgs.push(encodedCommands.readFloatLE(offset))
      offset += 4
    } else if (argType === CallSchemaField.STRING) {
      let v: string
      ;[v, offset] = readString(encodedCommands, offset, 'utf8')
      decodedArgs.push(v)
    } else if (argType === CallSchemaField.FOLLOWING_ARGUMENTS_OPTIONAL) {
      const numArgumentsRemaining = encodedCommands.readUInt8(offset)
      offset += 1
      numArgs = i + numArgumentsRemaining + 1
    } else if (argType === CallSchemaField.BOOL) {
      decodedArgs.push(Boolean(encodedCommands.readUInt8(offset)))
      offset += 1
    } else {
      throw new Error('unknown argType ' + argType)
    }
  }

  const commandName = commandNames[commandNumber]
  if (!commandName) {
    return
  }
  return [{ name: commandName, args: decodedArgs }, offset]
}

/** replay a single command from the buffer starting at the given offset.
 * @returns the new offset for the next command, or undefined if at the end of the command stream
 */
function replaySingleCommand(
  targetContext: CanvasRenderingContext2D,
  encodedCommands: Buffer,
  startingOffset = 0,
) {
  const decode = decodeSingleCommand(encodedCommands, startingOffset)
  if (!decode) {
    return
  }

  const [command, offset] = decode

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
