import OffscreenCanvasShim from './CanvasShim'
import OffscreenCanvasRenderingContext2DShim from './Canvas2DContextShim'
import type * as NodeCanvas from 'canvas'
import isObject from 'is-object'

export type AbstractCanvas =
  | OffscreenCanvas
  | OffscreenCanvasShim
  | NodeCanvas.Canvas

export type Abstract2DCanvasContext =
  | OffscreenCanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2DShim

export type AbstractImageBitmap = Pick<ImageBitmap, 'height' | 'width'>

/** a plain-object (JSON) serialization of a OffscreenCanvasRenderingContext2DShim */
export interface CanvasImageDataShim {
  serializedCommands: Uint8Array
  height: number
  width: number
}

export function isCanvasImageDataShim(
  thing: unknown,
): thing is CanvasImageDataShim {
  return (
    isObject(thing) &&
    'serializedCommands' in thing &&
    'height' in thing &&
    thing.serializedCommands instanceof Uint8Array
  )
}
