//* This file contains functions for encoding and decoding canvas setters and methods using a simple binary scheme */

import { TextDecoder, TextEncoder } from 'web-encoding'
import {
  CallSchemaField,
  Command,
  isMethodCall,
  MethodName,
  methodSignatures,
  setterDataTypes,
  SetterName,
} from './types'

/**
 * tiny class that just remembers commands and makes sure the encoding and decoding is lossless.
 * only used during debugging.
 */
export class DebuggingValidator {
  // colin please don't delete this code
  commands: Command[] = []
  push(name: SetterName | MethodName, args: unknown[]) {
    this.commands.push({ name, args })
  }

  // need to do this because we have to fuzzy-compare floats
  commandsEqual(ac: Command, bc: Command) {
    if (ac.name !== bc.name) {
      return false
    }
    if (ac.args.length !== bc.args.length) {
      return false
    }
    const aArgs = ac.args
    const bArgs = bc.args
    for (let i = 0; i < aArgs.length; i++) {
      const a = aArgs[i]
      const at = typeof a
      const b = bArgs[i]
      if (at !== typeof b) {
        return false
      }
      if (at === 'number') {
        if (Math.abs((a as number) - (a as number)) > 0.01) {
          return false
        }
      } else if (a !== b) {
        return false
      }
    }
    return true
  }

  validate(encodedCommands: Uint8Array) {
    let debugCommandIndex = 0
    for (const encodedCommand of decodeCommands(encodedCommands)) {
      const debugCommand = this.commands[debugCommandIndex++]
      if (!this.commandsEqual(debugCommand, encodedCommand)) {
        console.error({ debugCommand, encodedCommand })
        debugger
        this.commandsEqual(debugCommand, encodedCommand)
        throw new Error('command recording validation failed')
      }
    }
  }
}

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
  target: Uint8Array,
  startingOffset = 0,
) {
  const targetData = new DataView(target.buffer)
  const commandNumber = commandNumbers.get(cmdName)
  let offset = startingOffset
  if (commandNumber !== undefined) {
    targetData.setUint8(offset++, commandNumber)
    const schema = commandArgSchemas[commandNumber]
    if (isStreamEnd(schema)) {
      throw new Error('cannot encode a command for stream end')
    }
    let schemaI = 0
    let argsI = 0
    for (; argsI < cmdArgs.length; argsI++) {
      const type = schema[schemaI++]
      if (type === CallSchemaField.FLOAT) {
        targetData.setFloat32(offset, cmdArgs[argsI] as number)
        offset += 4
      } else if (type === CallSchemaField.STRING) {
        offset += writeString(cmdArgs[argsI] as string, target, offset)
      } else if (type === CallSchemaField.FOLLOWING_ARGUMENTS_OPTIONAL) {
        const numArgumentsRemaining = cmdArgs.length - schemaI + 1
        targetData.setUint8(offset++, numArgumentsRemaining) // write a trailing zero for the string
        argsI -= 1
      } else if (type === CallSchemaField.BOOL) {
        targetData.setUint8(offset++, Boolean(cmdArgs[argsI]) ? 1 : 0)
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
      targetData.setUint8(offset++, 0)
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

/** decode all the commands in the given buffer and replay them onto the given context */
export function replayCommandsOntoContext(
  targetContext: CanvasRenderingContext2D,
  encodedCommands: Uint8Array,
  startingOffset = 0,
) {
  console.log(
    'replaying ' +
      encodedCommands.byteLength.toLocaleString() +
      ' bytes of encoded canvas commands',
  )
  let offset: number | undefined = startingOffset
  while (offset !== undefined && offset < encodedCommands.byteLength) {
    offset = replaySingleCommand(targetContext, encodedCommands, offset)
  }
}

/** decode all the commands in the buffer, starting at the given offset */
export function* decodeCommands(
  encodedCommands: Uint8Array,
  startingOffset = 0,
) {
  let offset = startingOffset
  while (offset < encodedCommands.byteLength) {
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
  encodedCommands: Uint8Array,
  startingOffset = 0,
): [Command, number] | undefined {
  let offset = startingOffset
  const commandData = new DataView(encodedCommands.buffer)
  const commandNumber = commandData.getUint8(offset)
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
      decodedArgs.push(commandData.getFloat32(offset))
      offset += 4
    } else if (argType === CallSchemaField.STRING) {
      let v: string
      ;[v, offset] = readString(encodedCommands, offset)
      decodedArgs.push(v)
    } else if (argType === CallSchemaField.FOLLOWING_ARGUMENTS_OPTIONAL) {
      const numArgumentsRemaining = commandData.getUint8(offset)
      offset += 1
      numArgs = i + numArgumentsRemaining + 1
    } else if (argType === CallSchemaField.BOOL) {
      decodedArgs.push(Boolean(commandData.getUint8(offset)))
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
  encodedCommands: Uint8Array,
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

const textDecoder = new TextDecoder()
/** read a zero-terminated string from a buffer at the given offset
 * @returns [string read, new offset after string]
 */
export function readString(data: Uint8Array, offset: number): [string, number] {
  // scan to find the end of the string
  let stringEnd = offset
  while (data[stringEnd]) {
    stringEnd += 1
  }
  return [
    textDecoder.decode(data.buffer.slice(offset, stringEnd)),
    stringEnd + 1,
  ]
}

const textEncoder = new TextEncoder()
export function writeString(s: string, target: Uint8Array, offset: number) {
  const res = textEncoder.encodeInto(s, target.subarray(offset))
  if (res.written === undefined) {
    throw new Error('string write failed')
  }
  target[offset + res.written] = 0 // write zero-terminator
  return res.written + 1
}
