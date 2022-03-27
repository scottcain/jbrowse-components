import { Command, MethodName, SetterName } from './types'
import { decodeCommands } from './binary_command_codec'

/**
 * tiny class that just remembers commands and makes sure the encoding and decoding is lossless.
 * only used during debugging (that is, when DEBUG=true in context.ts)
 */

export class DebuggingValidator {
  // colin please don't delete this code
  commands: Command[]
  constructor(c: Command[] = []) {
    this.commands = c
  }

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
        // if(a !== b) {
        if (Math.abs((a as number) - (b as number)) > 0.01) {
          return false
        }
      } else if (a !== b) {
        return false
      }
    }
    return true
  }

  validateAgainst(encodedCommands: Uint8Array) {
    let debugCommandIndex = 0
    console.log('validating ' + this.commands.length + ' commands')
    for (const encodedCommand of decodeCommands(encodedCommands)) {
      const debugCommand = this.commands[debugCommandIndex++]
      if (!this.commandsEqual(debugCommand, encodedCommand)) {
        console.error({ debugCommand, encodedCommand })
        // debugger
        // this.commandsEqual(debugCommand, encodedCommand)
        throw new Error(
          'command recording validation failed, a command differs beyond threshold',
        )
      }
    }
    if (debugCommandIndex < this.commands.length) {
      throw new Error(
        'command recording validation failed, validator recorded ' +
          this.commands.length.toLocaleString() +
          ' commands, but decoder only emitted ' +
          (debugCommandIndex - 1).toLocaleString(),
      )
    }
    console.log(
      'command validation succeeded for ' +
        this.commands.length.toLocaleString() +
        ' commands',
    )
  }
}
